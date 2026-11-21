import { useEffect, useMemo, useState } from "react";
import type { JobListing } from "../types/job";
import { fetchJobs } from "../services/jobService";
import { useDebounce } from "../hooks/useDebounce";
import { calculateSkillMatch } from "../utils/skillMatch";
import { JobCard } from "./JobCard";

interface SavedApplication {
  company: string;
  role: string;
}

interface JobExplorerProps {
  kaptenSkills: string[];
  applications: SavedApplication[];
  onSaveJob: (job: JobListing) => void;
}

type JobSource = "remote" | "local";

export function JobExplorer({
  kaptenSkills,
  applications,
  onSaveJob,
}: JobExplorerProps) {
  const [jobs, setJobs] = useState<JobListing[]>([]);
  const [source, setSource] = useState<JobSource>("remote");
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("all");
  const [sortByMatch, setSortByMatch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const debouncedKeyword = useDebounce(keyword, 400);

  useEffect(() => {
    const controller = new AbortController();

    async function loadJobs() {
      setLoading(true);
      setError("");

      try {
        const data = await fetchJobs(source, controller.signal);
        setJobs(data);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return;
        }

        setJobs([]);
        setError(
          err instanceof Error
            ? err.message
            : "Terjadi kesalahan saat mengambil lowongan.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadJobs();

    return () => {
      controller.abort();
    };
  }, [source, retryCount]);

  const categories = useMemo(() => {
    return Array.from(
      new Set(jobs.map((job) => job.category).filter(Boolean)),
    ).sort();
  }, [jobs]);

  const filteredJobs = useMemo(() => {
    const searchText = debouncedKeyword.trim().toLowerCase();

    const filtered = jobs.filter((job) => {
      const matchesSearch =
        searchText === "" ||
        job.title.toLowerCase().includes(searchText) ||
        job.company_name.toLowerCase().includes(searchText) ||
        job.tags.some((tag) =>
          tag.toLowerCase().includes(searchText),
        );

      const matchesCategory =
        category === "all" || job.category === category;

      return matchesSearch && matchesCategory;
    });

    if (sortByMatch) {
      filtered.sort((a, b) => {
        const scoreA = calculateSkillMatch(
          kaptenSkills,
          a.tags,
        ).score;

        const scoreB = calculateSkillMatch(
          kaptenSkills,
          b.tags,
        ).score;

        return scoreB - scoreA;
      });
    }

    return filtered;
  }, [jobs, debouncedKeyword, category, sortByMatch, kaptenSkills]);

  function isAlreadySaved(job: JobListing): boolean {
    return applications.some(
      (application) =>
        application.company.trim().toLowerCase() ===
          job.company_name.trim().toLowerCase() &&
        application.role.trim().toLowerCase() ===
          job.title.trim().toLowerCase(),
    );
  }

  function retryFetch() {
    setRetryCount((count) => count + 1);
  }

  function useLocalFallback() {
    setSource("local");
  }

  return (
    <section className="job-explorer">
      <header className="explorer-heading">
        <div>
          <h2>Eksplorasi Lowongan</h2>
          <p>Temukan lowongan yang cocok dengan skill Kapten.</p>
        </div>
      </header>

      <div className="explorer-controls">
        <input
          type="search"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
          placeholder="Cari posisi, perusahaan, atau skill..."
          aria-label="Cari lowongan"
        />

        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          aria-label="Filter kategori"
        >
          <option value="all">Semua kategori</option>
          {categories.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <label className="sort-control">
          <input
            type="checkbox"
            checked={sortByMatch}
            onChange={(event) =>
              setSortByMatch(event.target.checked)
            }
          />
          Skill Match tertinggi
        </label>
      </div>

      <div className="source-controls">
        <span>
          Sumber data: {source === "remote" ? "Remotive API" : "Fallback lokal"}
        </span>

        {source === "remote" ? (
          <button type="button" onClick={useLocalFallback}>
            Gunakan Fallback Lokal
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setSource("remote")}
          >
            Gunakan Remotive API
          </button>
        )}
      </div>

      {loading && (
        <p className="explorer-state" role="status">
          Memuat lowongan...
        </p>
      )}

      {!loading && error && (
        <div className="explorer-state error-state" role="alert">
          <p>Gagal mengambil data: {error}</p>
          <button type="button" onClick={retryFetch}>
            Coba Lagi
          </button>
          {source === "remote" && (
            <button type="button" onClick={useLocalFallback}>
              Fallback Lokal
            </button>
          )}
        </div>
      )}

      {!loading && !error && filteredJobs.length === 0 && (
        <p className="explorer-state">
          Tidak ada lowongan yang cocok dengan pencarianmu.
        </p>
      )}

      {!loading && !error && filteredJobs.length > 0 && (
        <>
          <p className="job-count">
            Menampilkan {filteredJobs.length} lowongan
          </p>

          <div className="job-grid">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                kaptenSkills={kaptenSkills}
                isSaved={isAlreadySaved(job)}
                onSave={onSaveJob}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}