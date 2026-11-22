
import { useState } from "react";
import type {
  Application,
  ApplicationStatus,
  ChecklistItem,
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
  const [newChecklistText, setNewChecklistText] = useState("");
  const [newSubtaskTexts, setNewSubtaskTexts] = useState<
    Record<string, string>
  >({});

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

  function handleChecklistChange(itemId: string) {
    addActivity(
      {
        checklist: updateChecklist(application.checklist, itemId),
      },
      "Checklist diperbarui",
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

  const completedItems = application.checklist.filter(
    (item) => item.done,
  ).length;

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

        <div className="detail-add-checklist">
          <input
            type="text"
            placeholder="Contoh: Persiapan Interview"
            value={newChecklistText}
            onChange={(event) =>
              setNewChecklistText(event.target.value)
            }
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
    </section>
  );
}
