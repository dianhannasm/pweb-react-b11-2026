import type { Application } from "../types/application";
import { OfferComparator } from "./OfferComparator";
import { Statistics } from "./Statistics";

interface DashboardProps {
  applications: Application[];
  kaptenSkills: string[];
}

export function Dashboard({ applications, kaptenSkills }: DashboardProps) {
  return (
    <section className="dashboard" aria-label="Dashboard statistik dan offer">
      <Statistics applications={applications} />
      <OfferComparator
        applications={applications}
        kaptenSkills={kaptenSkills}
      />
    </section>
  );
}
