interface TiltIndicatorProps {
  tiltX: number; // -180 to 180 degrees
  tiltY: number;
  external?: boolean; // When true, renders without absolute positioning
}

export const TiltIndicator = ({ tiltX, tiltY, external = false }: TiltIndicatorProps) => {
  const isLevel = Math.abs(tiltX) < 5 && Math.abs(tiltY) < 5;

  const content = (
    <div className="p-2 rounded-lg bg-background/90 backdrop-blur-md border border-border/50 shadow-lg">
      <div className="w-12 h-12 rounded-full border-2 border-muted relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-px bg-primary/20" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-px h-full bg-primary/20" />
        </div>
        <div
          className={`absolute w-3 h-3 rounded-full transition-all duration-200 ${isLevel ? "bg-success" : "bg-warning"}`}
          style={{
            left: `calc(50% + ${Math.min(Math.max(tiltX, -20), 20)}% - 6px)`,
            top: `calc(50% + ${Math.min(Math.max(tiltY, -20), 20)}% - 6px)`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-4 h-4 rounded-full border-2 ${isLevel ? "border-success" : "border-muted"}`}
          />
        </div>
      </div>
      <span
        className={`text-[8px] block text-center mt-1 ${isLevel ? "text-success" : "text-warning"}`}
      >
        {isLevel ? "LEVEL" : "TILT"}
      </span>
    </div>
  );

  if (external) return content;
  return <div className="absolute right-2 bottom-24 z-10">{content}</div>;
};
