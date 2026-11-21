export interface JobListing {
  id: number;
  title: string;
  company_name: string;
  category: string;
  candidate_required_location: string;
  salary: string;
  tags: string[];
}

export interface SkillMatch {
  score: number;
  matchedSkills: string[];
  missingSkills: string[];
}