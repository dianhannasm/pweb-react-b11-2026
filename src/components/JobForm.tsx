
import { useRef, useState } from "react";
import type {
  ApplicationStatus,
  WorkMode,
} from "../types/application";

export type { ApplicationStatus, WorkMode };

export interface ManualApplicationData {
  company: string;
  role: string;
  workMode: WorkMode;
  status: ApplicationStatus;
  requiredSkills: string[];
  cvVersion?: string;
  appliedDate?: string;
  interviewDateTime?: string;
  salaryOffer?: number;
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
  const interviewRef = useRef<HTMLInputElement>(null);
  const salaryRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [workMode, setWorkMode] = useState<WorkMode>("Remote");
  const [status, setStatus] = useState<ApplicationStatus>("WISHLIST");
  const [skills, setSkills] = useState("");
  const [cvVersion, setCvVersion] = useState("");
  const [appliedDate, setAppliedDate] = useState("");
  const [interviewDateTime, setInterviewDateTime] = useState("");
  const [salaryOffer, setSalaryOffer] = useState("");
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

    if (status === "INTERVIEW" && !interviewDateTime) {
      setError("Jadwal interview wajib diisi.");
      interviewRef.current?.focus();
      return;
    }

    if (
      status === "OFFER" &&
      (!salaryOffer.trim() || Number.isNaN(Number(salaryOffer)) || Number(salaryOffer) <= 0)
    ) {
      setError("Uang saku (salary offer > 0) wajib diisi untuk status OFFER.");
      salaryRef.current?.focus();
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

    if (status === "INTERVIEW") {
      data.interviewDateTime = interviewDateTime;
    }

    if (status === "OFFER") {
      data.salaryOffer = Number(salaryOffer);
    }

    onSubmit(data);

    setCompany("");
    setRole("");
    setWorkMode("Remote");
    setStatus("WISHLIST");
    setSkills("");
    setCvVersion("");
    setAppliedDate("");
    setInterviewDateTime("");
    setSalaryOffer("");
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
        <option value="SCREENING">Screening</option>
        <option value="INTERVIEW">Interview</option>
        <option value="OFFER">Offer</option>
        <option value="REJECTED">Rejected</option>
        <option value="GHOSTED">Ghosted</option>
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

      {status === "INTERVIEW" && (
        <>
          <label htmlFor="interviewDateTime">
            Jadwal Interview
          </label>
          <input
            id="interviewDateTime"
            ref={interviewRef}
            type="datetime-local"
            value={interviewDateTime}
            onChange={(event) =>
              setInterviewDateTime(event.target.value)
            }
          />
        </>
      )}

      {status === "OFFER" && (
        <>
          <label htmlFor="salaryOffer">Uang Saku / Salary Offer (Rp)</label>
          <input
            id="salaryOffer"
            ref={salaryRef}
            type="number"
            min={1}
            step={100000}
            value={salaryOffer}
            onChange={(event) => setSalaryOffer(event.target.value)}
            placeholder="Contoh: 5500000"
          />
        </>
      )}

      <button type="submit">Tambah Lamaran</button>
    </form>
  );
}
