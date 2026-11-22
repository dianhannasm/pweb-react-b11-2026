import { useMemo, useState } from "react";
import type { Application, WorkMode } from "../types/application";
import { calculateSkillMatch } from "../utils/skillMatch";

interface OfferComparatorProps {
  applications: Application[];
  kaptenSkills: string[];
}

const WORK_MODE_SCORES: Record<WorkMode, number> = {
  Remote: 100,
  Hybrid: 75,
  Onsite: 50,
};

function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface OfferScoreResult {
  salary: number;
  salaryWeighted: number;
  modeScore: number;
  modeWeighted: number;
  skillMatchPercent: number;
  matchedCount: number;
  totalRequired: number;
  skillWeighted: number;
  totalScore: number;
}

function evaluateOffer(
  offer: Application,
  maxSalary: number,
  kaptenSkills: string[],
): OfferScoreResult {
  const salary = offer.salaryOffer ?? 0;
  const salaryNorm = maxSalary > 0 ? (salary / maxSalary) * 100 : 0;
  const salaryWeighted = salaryNorm * 0.5;

  const modeScore = WORK_MODE_SCORES[offer.workMode];
  const modeWeighted = modeScore * 0.25;

  const match = calculateSkillMatch(kaptenSkills, offer.requiredSkills);
  const skillWeighted = match.score * 0.25;

  return {
    salary,
    salaryWeighted,
    modeScore,
    modeWeighted,
    skillMatchPercent: match.score,
    matchedCount: match.matchedSkills.length,
    totalRequired: offer.requiredSkills.length,
    skillWeighted,
    totalScore: salaryWeighted + modeWeighted + skillWeighted,
  };
}

export function OfferComparator({
  applications,
  kaptenSkills,
}: OfferComparatorProps) {
  const offers = useMemo(
    () => applications.filter((app) => app.status === "OFFER"),
    [applications],
  );

  const [selectedIdA, setSelectedIdA] = useState("");
  const [selectedIdB, setSelectedIdB] = useState("");

  if (offers.length < 2) {
    return (
      <section className="offer-comparator">
        <h2>Bandingkan Offer Magang</h2>
        <p className="empty-state">
          Butuh minimal 2 lamaran berstatus <strong>OFFER</strong> untuk
          menggunakan Offer Comparator (saat ini baru ada {offers.length}).
        </p>
      </section>
    );
  }

  const offerA = offers.find((o) => o.id === selectedIdA) ?? offers[0];
  const offerB =
    offers.find((o) => o.id === selectedIdB && o.id !== offerA.id) ??
    offers.find((o) => o.id !== offerA.id) ??
    offers[1];

  const maxSalary = Math.max(offerA.salaryOffer ?? 0, offerB.salaryOffer ?? 0);
  const scoreA = evaluateOffer(offerA, maxSalary, kaptenSkills);
  const scoreB = evaluateOffer(offerB, maxSalary, kaptenSkills);

  const diff = scoreA.totalScore - scoreB.totalScore;
  const winnerId =
    Math.abs(diff) < 0.05 ? null : diff > 0 ? offerA.id : offerB.id;

  const comparisons = [
    { key: "A", offer: offerA, score: scoreA },
    { key: "B", offer: offerB, score: scoreB },
  ];

  const rankedOffers =
    offers.length > 2
      ? offers
          .map((item) => {
            const maxAllSalary = Math.max(
              ...offers.map((o) => o.salaryOffer ?? 0),
            );
            return {
              offer: item,
              score: evaluateOffer(item, maxAllSalary, kaptenSkills),
            };
          })
          .sort((a, b) => b.score.totalScore - a.score.totalScore)
      : [];

  function handleSelectTopTwo() {
    if (rankedOffers.length < 2) return;
    setSelectedIdA(rankedOffers[0].offer.id);
    setSelectedIdB(rankedOffers[1].offer.id);
  }

  return (
    <section className="offer-comparator" aria-label="Bandingkan Offer Magang">
      <div className="comparator-header">
        <div>
          <h2>Bandingkan Offer Magang</h2>
          <p>
            Bobot penilaian: Uang Saku 50% + Mode Kerja 25% + Kecocokan Skill 25%
          </p>
        </div>

        <div className="comparator-selectors">
          <select
            aria-label="Pilih Offer A"
            value={offerA.id}
            onChange={(e) => setSelectedIdA(e.target.value)}
          >
            {offers.map((item) => (
              <option key={item.id} value={item.id}>
                Offer A: {item.company}
              </option>
            ))}
          </select>

          <span className="comparator-vs">vs</span>

          <select
            aria-label="Pilih Offer B"
            value={offerB.id}
            onChange={(e) => setSelectedIdB(e.target.value)}
          >
            {offers.map((item) => (
              <option key={item.id} value={item.id}>
                Offer B: {item.company}
              </option>
            ))}
          </select>
        </div>
      </div>

      {rankedOffers.length > 2 && (
        <div className="offer-ranking" aria-label="Peringkat semua offer">
          <div className="offer-ranking-head">
            <div>
              <strong>Peringkat Semua Offer ({rankedOffers.length})</strong>
              <p>Urutan otomatis dari skor berbobot tertinggi untuk memudahkan pilihan.</p>
            </div>
            <button
              type="button"
              className="ranking-top-button"
              onClick={handleSelectTopTwo}
            >
              Bandingkan Top 2
            </button>
          </div>

          <div className="offer-ranking-list">
            {rankedOffers.map(({ offer, score }, index) => (
              <div
                key={offer.id}
                className={`ranking-chip ${index === 0 ? "ranking-chip-top" : ""}`}
              >
                <span className="ranking-pos">#{index + 1}</span>
                <div className="ranking-info">
                  <strong>{offer.company}</strong>
                  <small>{offer.role}</small>
                </div>
                <span className="ranking-score">
                  {score.totalScore.toFixed(1)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="comparator-grid">
        {comparisons.map(({ key, offer, score }) => {
          const isWinner = winnerId === offer.id;
          return (
            <article
              key={`${key}-${offer.id}`}
              className={`offer-card ${isWinner ? "offer-winner" : ""}`}
            >
              <div className="offer-card-head">
                <div>
                  <h3>{offer.company}</h3>
                  <p className="offer-role">{offer.role}</p>
                </div>
                {isWinner && (
                  <span className="winner-badge">Rekomendasi Terbaik</span>
                )}
              </div>

              <div className="offer-metrics">
                <div className="offer-row">
                  <span>Uang Saku / Bulan</span>
                  <strong>{formatRupiah(score.salary)}</strong>
                  <span>{score.salaryWeighted.toFixed(1)} / 50</span>
                </div>
                <div className="offer-row">
                  <span>Mode Kerja</span>
                  <strong>
                    {offer.workMode} ({score.modeScore})
                  </strong>
                  <span>{score.modeWeighted.toFixed(1)} / 25</span>
                </div>
                <div className="offer-row">
                  <span>Kecocokan Skill</span>
                  <strong>
                    {score.skillMatchPercent}% ({score.matchedCount} dari{" "}
                    {score.totalRequired} skill)
                  </strong>
                  <span>{score.skillWeighted.toFixed(1)} / 25</span>
                </div>
              </div>

              <div className="offer-total">
                <span>TOTAL SKOR BERBOBOT</span>
                <strong>{score.totalScore.toFixed(1)}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
