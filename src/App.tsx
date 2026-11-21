import { useState } from "react";
import { JobExplorer } from "./components/JobExplorer";
import { JobForm, type ManualApplicationData } from "./components/JobForm";
import type { JobListing } from "./types/job";
import "./App.css";

interface SavedApplication {
  company: string;
  role: string;
}

function App() {
  const [applications, setApplications] = useState<SavedApplication[]>([]);

  function handleSaveJob(job: JobListing) {
    setApplications((current) => [
      ...current,
      { company: job.company_name, role: job.title },
    ]);
  }

  function handleAddApplication(data: ManualApplicationData) {
    setApplications((current) => [
      ...current,
      { company: data.company, role: data.role },
    ]);
  }

  return (
    <main>
      <h1>Aku Mw Magang</h1>
      <p>Eksplorasi lowongan dan kelola wishlist magang.</p>

      <JobForm
        applications={applications}
        onSubmit={handleAddApplication}
      />

      <JobExplorer
        kaptenSkills={["React", "TypeScript", "JavaScript", "Git"]}
        applications={applications}
        onSaveJob={handleSaveJob}
      />
    </main>
  );
}

export default App;