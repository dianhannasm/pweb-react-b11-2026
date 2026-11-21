import type { JobListing } from "../types/job";

const REMOTIVE_API =
  "https://remotive.com/api/remote-jobs?category=software-dev&limit=30";

type JobSource = "remote" | "local";

interface RemotiveJob {
  id: number;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  salary: string;
  tags: string[];
}

interface RemotiveResponse {
  jobs: RemotiveJob[];
}

export async function fetchJobs(
  source: JobSource,
  signal?: AbortSignal,
): Promise<JobListing[]> {
  const url =
    source === "remote"
      ? REMOTIVE_API
      : "/magang-fallback.json";

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(
      `Gagal mengambil data lowongan (${response.status})`,
    );
  }

  if (source === "local") {
    const jobs: JobListing[] = await response.json();
    return jobs;
  }

  const data: RemotiveResponse = await response.json();

  return data.jobs.map((job) => ({
    id: job.id,
    title: job.title,
    company_name: job.company_name,
    category: job.category,
    candidate_required_location:
      job.candidate_required_location,
    salary: job.salary || "Tidak dicantumkan",
    tags: job.tags ?? [],
  }));
}