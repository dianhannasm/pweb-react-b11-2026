import type { JobListing } from "../types/job";
import { calculateSkillMatch } from "../utils/skillMatch";

interface JobCardProps {
  job: JobListing;
  kaptenSkills: string[];
  isSaved: boolean;
  onSave: (job: JobListing) => void;
}

export function JobCard({
  job,
  kaptenSkills,
  isSaved,
  onSave,
}: JobCardProps) {
  const match = calculateSkillMatch(
    kaptenSkills,
    job.tags,
  );

  const scoreColor =
    match.score >= 70
      ? "match-high"
      : match.score >= 40
        ? "match-medium"
        : "match-low";

  return (
    <article className="job-card">
      <div className="job-card-header">
        <div>
          <h3>{job.title}</h3>
          <p className="job-company">{job.company_name}</p>
        </div>

        <span className={`match-badge ${scoreColor}`}>
          {match.score}% Match
        </span>
      </div>

      <div className="job-card-info">
        <p>
          <strong>Kategori:</strong> {job.category}
        </p>
        <p>
          <strong>Lokasi:</strong>{" "}
          {job.candidate_required_location}
        </p>
        <p>
          <strong>Gaji:</strong> {job.salary || "Tidak dicantumkan"}
        </p>
      </div>

      <div className="job-skills">
        <p>
          <strong>Skill cocok:</strong>
        </p>
        {match.matchedSkills.length > 0 ? (
          <div className="skill-list">
            {match.matchedSkills.map((skill) => (
              <span className="skill-tag skill-matched" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="skill-empty">Belum ada skill yang cocok.</p>
        )}
      </div>

      <div className="job-skills">
        <p>
          <strong>Missing skills:</strong>
        </p>
        {match.missingSkills.length > 0 ? (
          <div className="skill-list">
            {match.missingSkills.map((skill) => (
              <span className="skill-tag skill-missing" key={skill}>
                {skill}
              </span>
            ))}
          </div>
        ) : (
          <p className="skill-empty">
            Semua skill yang dibutuhkan sudah cocok!
          </p>
        )}
      </div>

      <button
        type="button"
        className="save-job-button"
        disabled={isSaved}
        onClick={() => onSave(job)}
      >
        {isSaved ? "Sudah Dilamar" : "Simpan ke Wishlist"}
      </button>
    </article>
  );
}