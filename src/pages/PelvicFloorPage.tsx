import { useEffect } from "react";
import RouteTopNav from "@/components/navigation/RouteTopNav";
import PelvicFloorHub from "@/components/PelvicFloorHub";

export default function PelvicFloorPage(): JSX.Element {
  useEffect(() => {
    document.title = "Kegels & Pelvic Floor - MorphoScan";
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <RouteTopNav title="Kegels & Pelvic Floor" badge="Education" showFullNavigation />
      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <PelvicFloorHub />
      </main>
    </div>
  );
}
