
import type { ApplicationStatus } from "../types/application";

const allowedTransitions: Record<
  ApplicationStatus,
  ApplicationStatus[]
> = {
  WISHLIST: ["APPLIED"],

  APPLIED: [
    "SCREENING",
    "INTERVIEW",
    "REJECTED",
    "GHOSTED",
  ],

  SCREENING: [
    "INTERVIEW",
    "REJECTED",
    "GHOSTED",
  ],

  INTERVIEW: [
    "OFFER",
    "REJECTED",
    "GHOSTED",
  ],

  OFFER: [],

  REJECTED: [],

  GHOSTED: [],
};

export function canTransitionStatus(
  currentStatus: ApplicationStatus,
  nextStatus: ApplicationStatus,
): boolean {
  return allowedTransitions[currentStatus].includes(nextStatus);
}

export function getAllowedNextStatuses(
  currentStatus: ApplicationStatus,
): ApplicationStatus[] {
  return allowedTransitions[currentStatus];
}
