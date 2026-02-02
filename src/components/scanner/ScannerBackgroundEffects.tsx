import { MeshGradient, ParticleField } from "@/components/premium";

export function ScannerBackgroundEffects({
  premiumMesh,
  premiumParticles,
  paused = false,
}: {
  premiumMesh: boolean;
  premiumParticles: boolean;
  paused?: boolean;
}) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {premiumMesh && <MeshGradient variant="scanner" intensity="default" />}
      {premiumParticles && (
        <ParticleField
          className="opacity-50"
          density={0.00006}
          connectDistance={120}
          speed={1}
          maxParticles={110}
          paused={paused}
        />
      )}
      <div
        className={`absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl ${paused ? "" : "animate-pulse-glow"}`}
      />
      <div
        className={`absolute bottom-20 left-10 w-96 h-96 bg-accent/5 rounded-full blur-3xl ${paused ? "" : "animate-pulse-glow"}`}
        style={{ animationDelay: "1s" }}
      />
    </div>
  );
}
