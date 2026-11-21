import { useRef, useState } from "react";

export type ApplicationStatus = "WISHLIST" | "APPLIED";
export type WorkMode = "Remote" | "Hybrid" | "Onsite";

export interface ManualApplicationData {
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
}

interface ExistingApplication {
  company: string;
  role: string;
}

interface JobFormProps {
  applications: ExistingApplication[];
  onSubmit: (data: ManualApplicationData) => void;
}

export function JobForm({ applications, onSubmit }: JobFormProps) {
  const companyRef = useRef<HTMLInputElement>(null);
  const roleRef = useRef<HTMLInputElement>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const dateRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Remote");
  const [status, setStatus] = useState<ApplicationStatus>("WISHLIST");
  const [skills, setSkills] = useState("");
  const [cvVersion, setCvVersion] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!company.trim()) {
      setError("Nama perusahaan wajib diisi.");
      companyRef.current?.focus();
      return;
    }

    if (!role.trim()) {
      setError("Posisi wajib diisi.");
      roleRef.current?.focus();
      return;
    }

    const duplicate = applications.some(
      (application) =>
        application.company.trim().toLowerCase() ===
          company.trim().toLowerCase() &&
        application.role.trim().toLowerCase() ===
          role.trim().toLowerCase(),
    );

    if (duplicate) {
      setError("Perusahaan dan posisi ini sudah ada.");
      companyRef.current?.focus();
      return;
    }

    if (status === "APPLIED" && !cvVersion.trim()) {
      setError("Versi CV wajib diisi jika sudah melamar.");
      cvRef.current?.focus();
      return;
    }

    if (status === "APPLIED" && !appliedDate) {
      setError("Tanggal melamar wajib diisi.");
      dateRef.current?.focus();
      return;
    }

    const data: ManualApplicationData = {
      company: company.trim(),
      role: role.trim(),
      workMode,
      status,
      requiredSkills: skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    };

    if (status === "APPLIED") {
      data.cvVersion = cvVersion.trim();
      data.appliedDate = appliedDate;
    }

    onSubmit(data);

    setCompany("");
    setRole("");
    setWorkMode("Remote");
    setStatus("WISHLIST");
    setSkills("");
    setCvVersion("");
    setAppliedDate("");
  }

  return (
    <form className="job-form" onSubmit={handleSubmit}>
      <h2>Tambah Lamaran Manual</h2>

      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}

      <label htmlFor="company">Perusahaan</label>
      <input
        id="company"
        ref={companyRef}
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        placeholder="Nama perusahaan"
      />

      <label htmlFor="role">Posisi</label>
      <input
        id="role"
        ref={roleRef}
        value={role}
        onChange={(event) => setRole(event.target.value)}
        placeholder="Contoh: Frontend Intern"
      />

      <label htmlFor="workMode">Work Mode</label>
      <select
        id="workMode"
        value={workMode}
        onChange={(event) =>
          setWorkMode(event.target.value as WorkMode)
        }
      >
        <option value="Remote">Remote</option>
        <option value="Hybrid">Hybrid</option>
        <option value="Onsite">Onsite</option>
      </select>

      <label htmlFor="status">Status awal</label>
      <select
        id="status"
        value={status}
        onChange={(event) =>
          setStatus(event.target.value as ApplicationStatus)
        }
      >
        <option value="WISHLIST">Wishlist</option>
        <option value="APPLIED">Sudah Dilamar</option>
      </select>

      <label htmlFor="skills">Skill yang dibutuhkan</label>
      <input
        id="skills"
        value={skills}
        onChange={(event) => setSkills(event.target.value)}
        placeholder="React, TypeScript, Git"
      />
      <small>Pisahkan skill menggunakan koma.</small>

      {status === "APPLIED" && (
        <>
          <label htmlFor="cvVersion">Versi CV</label>
          <input
            id="cvVersion"
            ref={cvRef}
            value={cvVersion}
            onChange={(event) => setCvVersion(event.target.value)}
            placeholder="Contoh: CV Data Analyst v2"
          />

          <label htmlFor="appliedDate">Tanggal melamar</label>
          <input
            id="appliedDate"
            ref={dateRef}
            type="date"
            value={appliedDate}
            onChange={(event) => setAppliedDate(event.target.value)}
          />
        </>
      )}

      <button type="submit">Tambah Lamaran</button>
    </form>
  );
}