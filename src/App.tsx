
import { useCallback, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { JobExplorer } from "./components/JobExplorer";
import { JobForm, type ManualApplicationData } from "./components/JobForm";
import { Pipeline } from "./components/Pipeline";
import { ApplicationDetail } from "./components/ApplicationDetail";
import { UndoToast } from "./components/UndoToast";
import { useLocalStorage } from "./hooks/useLocalStorage";
import { detectGhostedApplications } from "./utils/ghostingChecker";
import type { Application, WorkMode } from "./types/application";
import type { JobListing } from "./types/job";
import "./App.css";

type ActiveTab = "explorer" | "dashboard" | "pipeline";

interface DeletedEntry {
  app: Application;
  index: number;
}

function inferWorkMode(location: string): WorkMode {
  const lower = location.toLowerCase();

  if (lower.includes("hybrid")) return "Hybrid";
  if (lower.includes("onsite")) return "Onsite";

  return "Remote";
}

function App() {
  const [applications, setApplications] = useLocalStorage<Application[]>(
    "aku-mw-magang:applications",
    [],
  );

  const [kaptenSkills] = useLocalStorage<string[]>(
    "aku-mw-magang:kapten-skills",
    ["React", "TypeScript", "CSS"],
  );

  const [deletedEntry, setDeletedEntry] = useState<DeletedEntry | null>(null);
  const [activeTab, setActiveTab] = useState<ActiveTab>("explorer");
  const [selectedApplicationId, setSelectedApplicationId] = useState<
    string | null
  >(null);

  const [simulatedDate, setSimulatedDate] = useState<Date>(
    () => new Date(),
  );

  function handleSaveJob(job: JobListing) {
    const now = new Date().toISOString();

    const newApp: Application = {
      id: crypto.randomUUID(),
      company: job.company_name,
      role: job.title,
      workMode: inferWorkMode(job.candidate_required_location),
      status: "WISHLIST",
      requiredSkills: job.tags,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: "Disimpan ke Wishlist dari Eksplorasi Lowongan",
        },
      ],
    };

    setApplications((current) => [...current, newApp]);
  }

  function handleAddApplication(data: ManualApplicationData) {
    const now = new Date().toISOString();

    const newApp: Application = {
      id: crypto.randomUUID(),
      company: data.company,
      role: data.role,
      workMode: data.workMode,
      status: data.status,
      requiredSkills: data.requiredSkills,
      cvVersion: data.cvVersion,
      appliedDate: data.appliedDate,
      interviewDateTime: data.interviewDateTime,
      lastUpdatedAt: now,
      checklist: [],
      activityLogs: [
        {
          id: crypto.randomUUID(),
          timestamp: now,
          message: `Lamaran ditambahkan dengan status ${data.status}`,
        },
      ],
    };

    setApplications((current) => [...current, newApp]);
  }

  function handleUpdateApplication(updatedApplication: Application) {
    setApplications((current) =>
      current.map((app) =>
        app.id === updatedApplication.id ? updatedApplication : app,
      ),
    );
  }

  function handleSimulate15Days() {
    const nextDate = new Date(simulatedDate);
    nextDate.setDate(nextDate.getDate() + 15);

    setSimulatedDate(nextDate);

    setApplications((current) => {
      const ghostedApplications = detectGhostedApplications(
        current,
        nextDate,
      );

      const ghostedIds = new Set(
        ghostedApplications.map((app) => app.id),
      );

      return current.map((app) => {
        if (!ghostedIds.has(app.id)) {
          return app;
        }

        const now = new Date().toISOString();

        return {
          ...app,
          status: "GHOSTED",
          lastUpdatedAt: now,
          activityLogs: [
            {
              id: crypto.randomUUID(),
              timestamp: now,
              message:
                "Status otomatis berubah menjadi GHOSTED setelah simulasi +15 hari tanpa respons.",
            },
            ...app.activityLogs,
          ],
        };
      });
    });
  }

  function handleDeleteApplication(id: string) {
    const index = applications.findIndex((app) => app.id === id);

    if (index === -1) return;

    const target = applications[index];

    setDeletedEntry({ app: target, index });

    setApplications((current) =>
      current.filter((app) => app.id !== id),
    );

    if (selectedApplicationId === id) {
      setSelectedApplicationId(null);
    }
  }

  function handleUndoDelete() {
    if (!deletedEntry) return;

    setApplications((current) => {
      const safeIndex = Math.min(deletedEntry.index, current.length);

      return [
        ...current.slice(0, safeIndex),
        deletedEntry.app,
        ...current.slice(safeIndex),
      ];
    });

    setDeletedEntry(null);
  }

  const handleExpireUndo = useCallback(() => {
    setDeletedEntry(null);
  }, []);

  const selectedApplication = applications.find(
    (app) => app.id === selectedApplicationId,
  );

  return (
    <main>
      <h1>Aku Mw Magang</h1>
      <p>Eksplorasi lowongan dan kelola wishlist magang.</p>

      <nav className="tab-nav" aria-label="Navigasi utama">
        <button
          type="button"
          className={`tab-button ${activeTab === "explorer" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("explorer");
            setSelectedApplicationId(null);
          }}
        >
          Eksplorasi Lowongan
        </button>

        <button
          type="button"
          className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("dashboard");
            setSelectedApplicationId(null);
          }}
        >
          Dashboard &amp; Offer ({applications.length})
        </button>

        <button
          type="button"
          className={`tab-button ${activeTab === "pipeline" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("pipeline");
            setSelectedApplicationId(null);
          }}
        >
          War Room Pipeline
        </button>
      </nav>

      {activeTab === "dashboard" ? (
        <Dashboard
          applications={applications}
          kaptenSkills={kaptenSkills}
        />
      ) : activeTab === "pipeline" ? (
        selectedApplication ? (
          <ApplicationDetail
            application={selectedApplication}
            onBack={() => setSelectedApplicationId(null)}
            onUpdate={handleUpdateApplication}
          />
        ) : (
          <Pipeline
            applications={applications}
            onSelectApplication={(application) =>
              setSelectedApplicationId(application.id)
            }
            onSimulate15Days={handleSimulate15Days}
            simulatedDate={simulatedDate}
          />
        )
      ) : (
        <>
          <JobForm
            applications={applications}
            onSubmit={handleAddApplication}
          />

          <JobExplorer
            kaptenSkills={kaptenSkills}
            applications={applications}
            onSaveJob={handleSaveJob}
          />
        </>
      )}

      <UndoToast
        deletedApp={deletedEntry?.app ?? null}
        onUndo={handleUndoDelete}
        onExpire={handleExpireUndo}
      />
    </main>
  );
}

export default App;
