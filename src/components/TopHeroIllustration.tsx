const PARTICLES = [
  { className: "top-hero-particle particle-a" },
  { className: "top-hero-particle particle-b" },
  { className: "top-hero-particle particle-c" },
  { className: "top-hero-particle particle-d" },
];

export function TopHeroIllustration() {
  return (
    <div className="top-hero-illustration" aria-hidden="true">
      <div className="top-hero-aura top-hero-aura-left" />
      <div className="top-hero-aura top-hero-aura-right" />

      <div className="top-hero-orbit-shell">
        {PARTICLES.map((particle) => (
          <div key={particle.className} className={particle.className} />
        ))}
      </div>
    </div>
  );
}
