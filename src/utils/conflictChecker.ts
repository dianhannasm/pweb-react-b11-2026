
import type { Application } from "../types/application";

export interface InterviewConflict {
  firstApplication: Application;
  secondApplication: Application;
}

export function checkInterviewConflicts(
  applications: Application[],
): InterviewConflict[] {
  const interviews = applications.filter(
    (application) =>
      application.status === "INTERVIEW" &&
      application.interviewDateTime,
  );

  const conflicts: InterviewConflict[] = [];

  for (let i = 0; i < interviews.length; i++) {
    for (let j = i + 1; j < interviews.length; j++) {
      const first = interviews[i];
      const second = interviews[j];

      const firstStart = new Date(
        first.interviewDateTime!,
      ).getTime();

      const secondStart = new Date(
        second.interviewDateTime!,
      ).getTime();

      const duration = 60 * 60 * 1000;

      const firstEnd = firstStart + duration;
      const secondEnd = secondStart + duration;

      const isConflict =
        firstStart < secondEnd &&
        secondStart < firstEnd;

      if (isConflict) {
        conflicts.push({
          firstApplication: first,
          secondApplication: second,
        });
      }
    }
  }

  return conflicts;
}
