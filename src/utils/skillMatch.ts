import type { SkillMatch } from "../types/job";

export function calculateSkillMatch(
  kaptenSkills: string[],
  requiredSkills: string[],
): SkillMatch {
  if (requiredSkills.length === 0) {
    return {
      score: 0,
      matchedSkills: [],
      missingSkills: [],
    };
  }

  const normalizedKaptenSkills = kaptenSkills.map((skill) =>
    skill.trim().toLowerCase(),
  );

  const matchedSkills = requiredSkills.filter((skill) =>
    normalizedKaptenSkills.includes(skill.trim().toLowerCase()),
  );

  const missingSkills = requiredSkills.filter(
    (skill) =>
      !normalizedKaptenSkills.includes(skill.trim().toLowerCase()),
  );

  const score = Math.round(
    (matchedSkills.length / requiredSkills.length) * 100,
  );

  return {
    score,
    matchedSkills,
    missingSkills,
  };
}