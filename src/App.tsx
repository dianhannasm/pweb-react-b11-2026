import { useCallback, useState } from "react";
import { Dashboard } from "./components/Dashboard";
import { JobExplorer } from "./components/JobExplorer";
import { JobForm, type ManualApplicationData } from "./components/JobForm";
import { UndoToast } from "./components/UndoToast";
import { useLocalStorage } from "./hooks/useLocalStorage";
import type { Application, WorkMode } from "./types/application";
import type { JobListing } from "./types/job";
import "./App.css";

type ActiveTab = "explorer" | "dashboard";

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

  function handleDeleteApplication(id: string) {
    const index = applications.findIndex((app) => app.id === id);
    if (index === -1) return;

    const target = applications[index];
    setDeletedEntry({ app: target, index });
    setApplications((current) => current.filter((app) => app.id !== id));
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

  // Disiapkan untuk disambungkan ke komponen Pipeline milik Orang 2
  void handleDeleteApplication;

  return (
    <main>
      <h1>Aku Mw Magang</h1>
      <p>Eksplorasi lowongan dan kelola wishlist magang.</p>

      <nav className="tab-nav" aria-label="Navigasi utama">
        <button
          type="button"
          className={`tab-button ${activeTab === "explorer" ? "active" : ""}`}
          onClick={() => setActiveTab("explorer")}
        >
          Eksplorasi Lowongan
        </button>
        <button
          type="button"
          className={`tab-button ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard &amp; Offer ({applications.length})
        </button>
      </nav>

      {activeTab === "dashboard" ? (
        <Dashboard applications={applications} kaptenSkills={kaptenSkills} />
      ) : (
        <>
          <JobForm applications={applications} onSubmit={handleAddApplication} />

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
