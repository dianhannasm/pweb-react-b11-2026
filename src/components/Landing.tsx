export interface LandingProps {
  onStart: () => void;
}

export function Landing({ onStart }: LandingProps) {
  return (
    <section className="landing" aria-label="Beranda — Aku Mw Magang">
      <div className="landing-hero">
        <h1 className="landing-title">Aku Mw Magang</h1>
        <p className="landing-desc">
          Aplikasi mandiri untuk melacak skill Kapten, eksplorasi lowongan,
          dan perjalanan lamaran magangmu — dari pencarian hingga tawaran
          kerja.
        </p>
        <button type="button" className="landing-cta" onClick={onStart}>
          Mulai Eksplorasi
        </button>
      </div>
    </section>
  );
}
