
import type { Application } from "../types/application";

const GHOSTING_THRESHOLD_DAYS = 15;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

export function isGhostingRisk(app: Application): boolean {
  if (app.status === "GHOSTED") {
    return true;
  }

  if (app.status !== "APPLIED" && app.status !== "SCREENING") {
    return false;
  }

  const updatedTime = Date.parse(app.lastUpdatedAt);
  if (Number.isNaN(updatedTime)) {
    return false;
  }

  return Date.now() - updatedTime > FOURTEEN_DAYS_MS;
}

export function detectGhostedApplications(
  applications: Application[],
  referenceDate: Date,
): Application[] {
  const pendingApplications = applications.filter(
    (application) =>
      application.status === "APPLIED" ||
      application.status === "SCREENING",
  );

  return pendingApplications.filter((application) => {
    const startDate = new Date(
      application.appliedDate || application.lastUpdatedAt,
    );

    if (Number.isNaN(startDate.getTime())) {
      return false;
    }

    const elapsedTime =
      referenceDate.getTime() - startDate.getTime();

    const elapsedDays = Math.floor(
      elapsedTime / (1000 * 60 * 60 * 24),
    );

    return elapsedDays >= GHOSTING_THRESHOLD_DAYS;
  });
}
