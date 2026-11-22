
import type { Application, ApplicationStatus } from "../types/application";
import { checkInterviewConflicts } from "../utils/conflictChecker";

interface PipelineProps {
  applications: Application[];
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

export function Pipeline({
  applications,
  onSelectApplication,
  onSimulate15Days,
  simulatedDate,
}: PipelineProps) {
  const conflicts = checkInterviewConflicts(applications);

  const ghostedApplications = applications.filter(
    (application) => application.status === "GHOSTED",
  );

  return (
    <section className="pipeline">
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

        <button type="button" onClick={onSimulate15Days}>
          Simulasikan +15 Hari
        </button>
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
          <strong>{ghostedApplications.length}</strong>
        </div>

        <div className="pipeline-stat">
          <span>Jadwal Bentrok</span>
          <strong>{conflicts.length}</strong>
        </div>
      </div>

      <div className="pipeline-board">
        {pipelineStatuses.map((status) => {
          const statusApplications = applications.filter(
            (application) => application.status === status,
          );

          return (
            <div className="pipeline-column" key={status}>
              <div className="pipeline-column-header">
                <h3>{statusLabels[status]}</h3>
                <span>{statusApplications.length}</span>
              </div>

              {statusApplications.length === 0 ? (
                <p className="pipeline-empty">
                  Belum ada lamaran
                </p>
              ) : (
                statusApplications.map((application) => (
                  <button
                    type="button"
                    className="pipeline-card"
                    key={application.id}
                    onClick={() => onSelectApplication(application)}
                  >
                    <strong>{application.role}</strong>
                    <span>{application.company}</span>
                  </button>
                ))
              )}
            </div>
          );
        })}
      </div>

      <div className="pipeline-alerts">
        <div className="pipeline-alert">
          <h3>Ghosting Monitor</h3>

          {ghostedApplications.length === 0 ? (
            <p>Belum ada lamaran berstatus ghosted.</p>
          ) : (
            ghostedApplications.map((application) => (
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
