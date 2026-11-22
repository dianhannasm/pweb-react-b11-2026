import { useMemo } from "react";
import type { Application } from "../types/application";

interface StatisticsProps {
  applications: Application[];
}

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function isGhostingRisk(app: Application): boolean {
  if (app.status === "GHOSTED") {
    return true;
  }

  if (app.status !== "APPLIED" && app.status !== "SCREENING") {
    return false;
  }

  const updatedTime = Date.parse(app.appliedDate || app.lastUpdatedAt);
  if (Number.isNaN(updatedTime)) {
    return false;
  }

  return Date.now() - updatedTime > FOURTEEN_DAYS_MS;
}

function toPercent(part: number, total: number): number {
  return total === 0 ? 0 : Math.round((part / total) * 100);
}

export function Statistics({ applications }: StatisticsProps) {
  const stats = useMemo(() => {
    const totalApplications = applications.length;
    const activePipeline = applications.filter(
      (app) => app.status !== "OFFER" && app.status !== "REJECTED",
    ).length;

    const sentCount = applications.filter(
      (app) => app.status !== "WISHLIST",
    ).length;

    const respondedCount = applications.filter(
      (app) =>
        app.status === "SCREENING" ||
        app.status === "INTERVIEW" ||
        app.status === "OFFER" ||
        app.status === "REJECTED",
    ).length;

    const interviewedCount = applications.filter(
      (app) => app.status === "INTERVIEW" || app.status === "OFFER",
    ).length;

    const ghostingRiskCount = applications.filter(isGhostingRisk).length;
    const offerCount = applications.filter(
      (app) => app.status === "OFFER",
    ).length;

    return {
      totalApplications,
      activePipeline,
      sentCount,
      respondedCount,
      interviewedCount,
      responseRate: toPercent(respondedCount, sentCount),
      interviewRate: toPercent(interviewedCount, sentCount),
      ghostingRiskCount,
      offerCount,
    };
  }, [applications]);

  const cards = [
    {
      label: "Total Lamaran",
      value: String(stats.totalApplications),
      hint: `${stats.activePipeline} aktif di pipeline`,
    },
    {
      label: "Response Rate",
      value: `${stats.responseRate}%`,
      hint: `${stats.respondedCount} dari ${stats.sentCount} diproses`,
    },
    {
      label: "Interview Rate",
      value: `${stats.interviewRate}%`,
      hint: `${stats.interviewedCount} masuk wawancara`,
    },
    {
      label: "Rawan Ghosting",
      value: String(stats.ghostingRiskCount),
      hint: "> 14 hari tanpa kabar",
    },
    {
      label: "Total Offer",
      value: String(stats.offerCount),
      hint: "Siap dibandingkan",
    },
  ];

  return (
    <section className="statistics" aria-label="Statistik lamaran">
      <div className="stat-grid">
        {cards.map((card) => (
          <article key={card.label} className="stat-card">
            <span className="stat-label">{card.label}</span>
            <strong className="stat-value">{card.value}</strong>
            <small className="stat-hint">{card.hint}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
