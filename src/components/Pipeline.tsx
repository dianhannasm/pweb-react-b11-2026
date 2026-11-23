import { useMemo, useState } from "react";
import type {
  Application,
  ApplicationStatus,
  ChecklistItem,
} from "../types/application";
import { checkInterviewConflicts } from "../utils/conflictChecker";
import { calculateSkillMatch } from "../utils/skillMatch";
import { isGhostingRisk } from "../utils/ghostingChecker";

interface PipelineProps {
  applications: Application[];
  kaptenSkills: string[];
  onSelectApplication: (application: Application) => void;
  onSimulate15Days: () => void;
  simulatedDate: Date;
}

const pipelineStatuses: ApplicationStatus[] = [
  "WISHLIST",
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "GHOSTED",
];

const statusLabels: Record<ApplicationStatus, string> = {
  WISHLIST: "Wishlist",
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  GHOSTED: "Ghosted",
};

type SortOption = "terbaru" | "terdekat" | "offerTertinggi";

function countDoneChecklist(items: ChecklistItem[]): number {
  let count = 0;

  for (const item of items) {
    if (item.done) {
      count += 1;
    }
    count += countDoneChecklist(item.children ?? []);
  }

  return count;
}

export function Pipeline({
  applications,
  kaptenSkills,
  onSelectApplication,
  onSimulate15Days,
  simulatedDate,
}: PipelineProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ApplicationStatus>(
    "all",
  );
  const [onlyGhostRisk, setOnlyGhostRisk] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>("terbaru");

  const conflicts = checkInterviewConflicts(applications);

  const hasSimulatable = applications.some(
    (application) =>
      application.status === "APPLIED" ||
      application.status === "SCREENING",
  );

  const filteredApplications = useMemo(() => {
    const query = search.trim().toLowerCase();

    const filtered = applications.filter((application) => {
      const matchesSearch =
        query === "" ||
        application.company.toLowerCase().includes(query) ||
        application.role.toLowerCase().includes(query) ||
        application.requiredSkills.some((skill) =>
          skill.toLowerCase().includes(query),
        );

      const matchesStatus =
        statusFilter === "all" || application.status === statusFilter;

      const matchesGhosting = !onlyGhostRisk || isGhostingRisk(application);

      return matchesSearch && matchesStatus && matchesGhosting;
    });

    if (sortOption === "terbaru") {
      filtered.sort(
        (a, b) =>
          new Date(b.lastUpdatedAt).getTime() -
          new Date(a.lastUpdatedAt).getTime(),
      );
    } else if (sortOption === "terdekat") {
      filtered.sort((a, b) => {
        const aTime = a.interviewDateTime
          ? new Date(a.interviewDateTime).getTime()
          : Number.MAX_SAFE_INTEGER;
        const bTime = b.interviewDateTime
          ? new Date(b.interviewDateTime).getTime()
          : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    } else {
      filtered.sort(
        (a, b) =>
          (b.salaryOffer ?? Number.NEGATIVE_INFINITY) -
          (a.salaryOffer ?? Number.NEGATIVE_INFINITY),
      );
    }

    return filtered;
  }, [applications, search, statusFilter, onlyGhostRisk, sortOption]);

  return (
    <section className="pipeline" aria-label="War Room Pipeline">
      {conflicts.length > 0 && (
        <div className="pipeline-banner" role="alert">
          <strong>Peringatan Bentrok Interview</strong>
          <p>
            Terdeteksi {conflicts.length} lamaran berstatus INTERVIEW dengan
            jadwal yang bertabrakan (&lt; 60 menit). Pastikan jadwal interview
            mereka tidak bertabrakan.
          </p>
        </div>
      )}

      <div className="pipeline-header">
        <div>
          <h2>War Room Pipeline</h2>
          <p>Pantau perjalanan setiap lamaran magangmu.</p>
        </div>

        <span className="pipeline-total">
          {applications.length} Total Lamaran
        </span>
      </div>

      <div className="pipeline-simulation">
        <div>
          <strong>Simulasi Waktu</strong>
          <p>
            Tanggal simulasi:{" "}
            {simulatedDate.toLocaleDateString("id-ID")}
          </p>
        </div>

        <button
          type="button"
          onClick={onSimulate15Days}
          disabled={!hasSimulatable}
        >
          Simulasikan +15 Hari
        </button>
      </div>

      <div className="pipeline-controls">
        <input
          type="search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Cari company atau role..."
          aria-label="Cari lamaran di pipeline"
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(event.target.value as "all" | ApplicationStatus)
          }
          aria-label="Filter status lamaran"
        >
          <option value="all">Semua status</option>
          {pipelineStatuses.map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </select>

        <label className="pipeline-ghosting-toggle">
          <input
            type="checkbox"
            checked={onlyGhostRisk}
            onChange={(event) => setOnlyGhostRisk(event.target.checked)}
          />
          Hanya Rawan Ghosting
        </label>

        <select
          value={sortOption}
          onChange={(event) =>
            setSortOption(event.target.value as SortOption)
          }
          aria-label="Urutkan lamaran"
        >
          <option value="terbaru">Terbaru</option>
          <option value="terdekat">Jadwal Interview Terdekat</option>
          <option value="offerTertinggi">Offer Tertinggi</option>
        </select>
      </div>

      <div className="pipeline-summary">
        <div className="pipeline-stat">
          <span>Total Lamaran</span>
          <strong>{applications.length}</strong>
        </div>

        <div className="pipeline-stat">
          <span>Interview</span>
          <strong>
            {applications.filter(
              (app) => app.status === "INTERVIEW",
            ).length}
          </strong>
        </div>

        <div className="pipeline-stat">
          <span>Ghosted</span>
          <strong>
            {applications.filter((app) => app.status === "GHOSTED").length}
          </strong>
        </div>

        <div className="pipeline-stat">
          <span>Jadwal Bentrok</span>
          <strong>{conflicts.length}</strong>
        </div>
      </div>

      <div className="pipeline-board">
        {pipelineStatuses.map((status) => {
          const columnApplications = filteredApplications.filter(
            (application) => application.status === status,
          );

          return (
            <div className="pipeline-column" key={status}>
              <div className="pipeline-column-header">
                <h3>{statusLabels[status]}</h3>
                <span>{columnApplications.length}</span>
              </div>

              {columnApplications.length === 0 ? (
                <p className="pipeline-empty">
                  Belum ada lamaran
                </p>
              ) : (
                columnApplications.map((application) => {
                  const doneChecklist = countDoneChecklist(
                    application.checklist,
                  );
                  const totalChecklist = application.checklist.length;
                  const match = calculateSkillMatch(
                    kaptenSkills,
                    application.requiredSkills,
                  );

                  return (
                    <button
                      type="button"
                      className="pipeline-card"
                      key={application.id}
                      onClick={() => onSelectApplication(application)}
                    >
                      <strong>{application.role}</strong>
                      <span>{application.company}</span>
                      <span className="pipeline-card-status">
                        {statusLabels[application.status]}
                      </span>
                      {application.cvVersion && (
                        <span className="pipeline-card-cv">
                          CV: {application.cvVersion}
                        </span>
                      )}
                      <span className="pipeline-card-checklist">
                        {doneChecklist}/{totalChecklist} checklist
                      </span>
                      <span className="pipeline-card-match">
                        Skill Match: {match.score}%
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          );
        })}
      </div>

      <div className="pipeline-alerts">
        <div className="pipeline-alert">
          <h3>Ghosting Monitor</h3>

          {applications.filter((app) => app.status === "GHOSTED").length ===
          0 ? (
            <p>Belum ada lamaran berstatus ghosted.</p>
          ) : (
            applications
              .filter((app) => app.status === "GHOSTED")
              .map((application) => (
                <p key={application.id}>
                  {application.company} — {application.role}
                </p>
              ))
          )}
        </div>

        <div className="pipeline-alert">
          <h3>Interview Conflict Monitor</h3>

          {conflicts.length === 0 ? (
            <p>
              Tidak ditemukan jadwal interview yang bentrok.
            </p>
          ) : (
            conflicts.map((conflict, index) => (
              <p key={index}>
                {conflict.firstApplication.company} dan{" "}
                {conflict.secondApplication.company} memiliki
                jadwal interview yang bertabrakan.
              </p>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
