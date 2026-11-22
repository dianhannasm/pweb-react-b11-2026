import { useRef, useState } from "react";
import type {
  Application,
  ApplicationStatus,
  ChecklistItem,
  WorkMode,
} from "../types/application";
import {
  canTransitionStatus,
  getAllowedNextStatuses,
} from "../utils/stateMachine";
import { InterviewTimer } from "./InterviewTimer";

interface ApplicationDetailProps {
  application: Application;
  onBack: () => void;
  onUpdate: (updatedApplication: Application) => void;
  onDelete: (id: string) => void;
}

const statusLabels: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

export function ApplicationDetail({
  application,
  onBack,
  onUpdate,
  onDelete,
}: ApplicationDetailProps) {
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);
  const interviewRef = useRef<HTMLInputElement>(null);
  const salaryRef = useRef<HTMLInputElement>(null);

  const [newChecklistText, setNewChecklistText] = useState("");
  const [newSubtaskTexts, setNewSubtaskTexts] = useState<
    Record<string, string>
  >({});
  const [salaryInput, setSalaryInput] = useState(
    application.salaryOffer ? String(application.salaryOffer) : "",
  );
  const [offerWorkMode, setOfferWorkMode] = useState<WorkMode>(
    application.workMode,
  );
  const [cvVersionInput, setCvVersionInput] = useState(
    application.cvVersion ?? "",
  );
  const [appliedDateInput, setAppliedDateInput] = useState(
    application.appliedDate ?? "",
  );
  const [interviewDateTimeInput, setInterviewDateTimeInput] = useState(
    application.interviewDateTime ?? "",
  );
  const [note, setNote] = useState("");
  const [statusError, setStatusError] = useState("");

  const allowedStatuses = getAllowedNextStatuses(application.status);

  function addActivity(
    updatedData: Partial<Application>,
    message: string,
  ) {
    const now = new Date().toISOString();

    onUpdate({
      ...application,
      ...updatedData,
      lastUpdatedAt: now,
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message,
        },
        ...application.activityLogs,
      ],
    });
  }

  function handleStatusChange(nextStatus: ApplicationStatus) {
    if (!canTransitionStatus(application.status, nextStatus)) return;
    setStatusError("");

    if (nextStatus === "APPLIED") {
      const cvVersion = cvVersionInput.trim();

      if (!cvVersion) {
        setStatusError(
          "Versi CV wajib diisi sebelum pindah ke status APPLIED.",
        );
        cvRef.current?.focus();
        return;
      }

      if (!appliedDateInput) {
        setStatusError(
          "Tanggal melamar wajib diisi sebelum pindah ke status APPLIED.",
        );
        dateRef.current?.focus();
        return;
      }

      addActivity(
        { status: nextStatus, cvVersion, appliedDate: appliedDateInput },
        `Status berubah dari ${application.status} menjadi ${nextStatus}`,
      );
      return;
    }

    if (nextStatus === "INTERVIEW") {
      if (!interviewDateTimeInput) {
        setStatusError(
          "Jadwal interview wajib diisi sebelum pindah ke status INTERVIEW.",
        );
        interviewRef.current?.focus();
        return;
      }

      addActivity(
        { status: nextStatus, interviewDateTime: interviewDateTimeInput },
        `Status berubah dari ${application.status} menjadi ${nextStatus}`,
      );
      return;
    }

    if (nextStatus === "OFFER") {
      const parsedSalary = Number(salaryInput);
      if (
        !salaryInput.trim() ||
        Number.isNaN(parsedSalary) ||
        parsedSalary <= 0
      ) {
        setStatusError(
          "Uang saku (salaryOffer > 0) wajib diisi sebelum pindah ke status OFFER.",
        );
        salaryRef.current?.focus();
        return;
      }

      addActivity(
        {
          status: nextStatus,
          salaryOffer: parsedSalary,
          workMode: offerWorkMode,
        },
        `Status berubah dari ${application.status} menjadi ${nextStatus} (Rp ${parsedSalary.toLocaleString("id-ID")})`,
      );
      return;
    }

    addActivity(
      { status: nextStatus },
      `Status berubah dari ${application.status} menjadi ${nextStatus}`,
    );
  }

  function updateChecklist(
    items: ChecklistItem[],
    targetId: string,
  ): ChecklistItem[] {
    return items.map((item) => {
      if (item.id === targetId) {
        return { ...item, done: !item.done };
      }

      if (item.children) {
        return {
          ...item,
          children: updateChecklist(item.children, targetId),
        };
      }

      return item;
    });
  }

  function removeChecklist(
    items: ChecklistItem[],
    targetId: string,
  ): ChecklistItem[] {
    return items
      .filter((item) => item.id !== targetId)
      .map((item) =>
        item.children
          ? { ...item, children: removeChecklist(item.children, targetId) }
          : item,
      );
  }

  function countDoneChecklist(items: ChecklistItem[]): number {
    return items.reduce(
      (count, item) =>
        count +
        (item.done ? 1 : 0) +
        countDoneChecklist(item.children ?? []),
      0,
    );
  }

  const completedItems = countDoneChecklist(application.checklist);

  function handleChecklistChange(itemId: string) {
    addActivity(
      {
        checklist: updateChecklist(application.checklist, itemId),
      },
      "Checklist diperbarui",
    );
  }

  function handleRemoveChecklist(itemId: string) {
    addActivity(
      {
        checklist: removeChecklist(application.checklist, itemId),
      },
      "Checklist dihapus",
    );
  }

  function handleAddChecklist() {
    const text = newChecklistText.trim();

    if (!text) return;

    const newItem: ChecklistItem = {
      id: crypto.randomUUID(),
      text,
      done: false,
      children: [],
    };

    addActivity(
      {
        checklist: [...application.checklist, newItem],
      },
      `Checklist baru ditambahkan: ${text}`,
    );

    setNewChecklistText("");
  }

  function handleAddSubtask(parentId: string) {
    const text = (newSubtaskTexts[parentId] || "").trim();

    if (!text) return;

    function addChild(items: ChecklistItem[]): ChecklistItem[] {
      return items.map((item) => {
        if (item.id === parentId) {
          return {
            ...item,
            children: [
              ...(item.children || []),
              {
                id: crypto.randomUUID(),
                text,
                done: false,
              },
            ],
          };
        }

        if (item.children) {
          return {
            ...item,
            children: addChild(item.children),
          };
        }

        return item;
      });
    }

    addActivity(
      {
        checklist: addChild(application.checklist),
      },
      `Sub-checklist ditambahkan: ${text}`,
    );

    setNewSubtaskTexts((current) => ({
      ...current,
      [parentId]: "",
    }));
  }

  function renderChecklist(items: ChecklistItem[]) {
    return (
      <ul className="detail-checklist">
        {items.map((item) => (
          <li key={item.id}>
            <label className="detail-checklist-item">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => handleChecklistChange(item.id)}
              />
              <span className={item.done ? "completed" : ""}>
                {item.text}
              </span>
            </label>

            <button
              type="button"
              className="detail-checklist-delete"
              onClick={() => handleRemoveChecklist(item.id)}
            >
              Hapus
            </button>

            <div className="detail-subtask-form">
              <input
                type="text"
                placeholder="Tambah sub-checklist..."
                value={newSubtaskTexts[item.id] || ""}
                onChange={(event) =>
                  setNewSubtaskTexts((current) => ({
                    ...current,
                    [item.id]: event.target.value,
                  }))
                }
              />

              <button
                type="button"
                onClick={() => handleAddSubtask(item.id)}
              >
                + Subtask
              </button>
            </div>

            {item.children && item.children.length > 0 &&
              renderChecklist(item.children)}
          </li>
        ))}
      </ul>
    );
  }

  function handleAddNote() {
    const text = note.trim();

    if (!text) return;

    addActivity({}, `Catatan manual Kapten ditambahkan: ${text}`);

    setNote("");
  }

  return (
    <section className="application-detail">
      <button
        type="button"
        className="detail-back-button"
        onClick={onBack}
      >
        ← Kembali ke Pipeline
      </button>

      <div className="detail-header">
        <div>
          <h2>{application.role}</h2>
          <p>{application.company}</p>
        </div>

        <div className="detail-header-actions">
          <span className="detail-status">
            {statusLabels[application.status]}
          </span>
          <button
            type="button"
            className="detail-delete-button"
            onClick={() => onDelete(application.id)}
          >
            Hapus
          </button>
        </div>
      </div>

      <div className="detail-info">
        <div>
          <span>Mode Kerja</span>
          <strong>{application.workMode}</strong>
        </div>

        <div>
          <span>Tanggal Melamar</span>
          <strong>{application.appliedDate || "-"}</strong>
        </div>

        <div>
          <span>Versi CV</span>
          <strong>{application.cvVersion || "-"}</strong>
        </div>

        <div>
          <span>Jadwal Interview</span>
          <strong>{application.interviewDateTime || "-"}</strong>
        </div>
      </div>

      <div className="detail-section">
        <h3>Perbarui Status Lamaran</h3>

        {statusError && (
          <p className="form-error" role="alert">
            {statusError}
          </p>
        )}

        <div className="offer-transition-fields">
          {allowedStatuses.includes("APPLIED") && (
            <>
              <label htmlFor="cvVersion">
                <span>Versi CV</span>
                <input
                  id="cvVersion"
                  ref={cvRef}
                  type="text"
                  value={cvVersionInput}
                  onChange={(event) =>
                    setCvVersionInput(event.target.value)
                  }
                />
              </label>

              <label htmlFor="appliedDate">
                <span>Tanggal Melamar</span>
                <input
                  id="appliedDate"
                  ref={dateRef}
                  type="date"
                  value={appliedDateInput}
                  onChange={(event) =>
                    setAppliedDateInput(event.target.value)
                  }
                />
              </label>
            </>
          )}

          {allowedStatuses.includes("INTERVIEW") && (
            <label htmlFor="interviewDateTime">
              <span>Jadwal Interview</span>
              <input
                id="interviewDateTime"
                ref={interviewRef}
                type="datetime-local"
                value={interviewDateTimeInput}
                onChange={(event) =>
                  setInterviewDateTimeInput(event.target.value)
                }
              />
            </label>
          )}

          {allowedStatuses.includes("OFFER") && (
            <>
              <label>
                <span>Uang Saku / Salary Offer (Rp)</span>
                <input
                  type="number"
                  min={1}
                  step={1}
                  ref={salaryRef}
                  placeholder="Contoh: 5500000"
                  value={salaryInput}
                  onChange={(event) => setSalaryInput(event.target.value)}
                />
              </label>

              <label>
                <span>Mode Kerja Offer</span>
                <select
                  value={offerWorkMode}
                  onChange={(event) =>
                    setOfferWorkMode(event.target.value as WorkMode)
                  }
                >
                  <option value="Remote">Remote</option>
                  <option value="Hybrid">Hybrid</option>
                  <option value="Onsite">Onsite</option>
                </select>
              </label>
            </>
          )}
        </div>

        {allowedStatuses.length === 0 ? (
          <p>Status ini sudah merupakan status akhir.</p>
        ) : (
          <div className="detail-status-actions">
            {allowedStatuses.map((status) => (
              <button
                type="button"
                key={status}
                onClick={() => handleStatusChange(status)}
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3>Checklist Persiapan</h3>

        <p>
          {completedItems} dari {application.checklist.length} checklist utama selesai
        </p>

        <div className="checklist-progress-bar">
          <div
            className="checklist-progress-fill"
            style={{
              width: `${
                application.checklist.length === 0
                  ? 0
                  : (completedItems / application.checklist.length) * 100
              }%`,
            }}
          />
        </div>

        <div className="detail-add-checklist">
          <input
            type="text"
            placeholder="Contoh: Persiapan Interview"
            value={newChecklistText}
            onChange={(event) => setNewChecklistText(event.target.value)}
          />

          <button type="button" onClick={handleAddChecklist}>
            + Tambah Checklist
          </button>
        </div>

        {application.checklist.length === 0 ? (
          <p>Belum ada checklist persiapan.</p>
        ) : (
          renderChecklist(application.checklist)
        )}
      </div>

      {application.status === "INTERVIEW" && (
        <div className="detail-section">
          <InterviewTimer />
        </div>
      )}

      <div className="detail-section">
        <h3>Activity Log</h3>

        {application.activityLogs.length === 0 ? (
          <p>Belum ada aktivitas.</p>
        ) : (
          <div className="activity-log">
            {application.activityLogs.map((log) => (
              <div className="activity-log-item" key={log.id}>
                <strong>{log.message}</strong>
                <span>
                  {new Date(log.timestamp).toLocaleString("id-ID")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="detail-section">
        <h3>Catatan Manual</h3>
        <div className="detail-note">
          <input
            id="manual-note"
            className="detail-note-input"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Tulis catatan di sini..."
          />
          <button
            type="button"
            onClick={handleAddNote}
            disabled={!note.trim()}
          >
            Tambah Catatan
          </button>
        </div>
      </div>
    </section>
  );
}
