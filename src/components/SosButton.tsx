import { useEffect, useRef, useState } from "react";
import { CheckCircle2, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const HOLD_MS = 5000;

type Status =
  | { phase: "idle" }
  | { phase: "gathering"; progress: number }
  | { phase: "verifying"; progress: number; coords: GeolocationCoordinates }
  | { phase: "acquired"; coords: GeolocationCoordinates }
  | { phase: "error"; message: string };

export function SosButton() {
  const [status, setStatus] = useState<Status>({ phase: "idle" });
  const [holding, setHolding] = useState(false);
  const [progress, setProgress] = useState(0);

  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const coordsRef = useRef<GeolocationCoordinates | null>(null);
  const completedRef = useRef(false);

  const cleanup = () => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (watchIdRef.current !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }
    watchIdRef.current = null;
    startRef.current = null;
    coordsRef.current = null;
    completedRef.current = false;
  };

  useEffect(() => () => cleanup(), []);

  const start = () => {
    if (holding || status.phase === "acquired") return;
    setStatus({ phase: "gathering", progress: 0 });
    setProgress(0);
    setHolding(true);
    completedRef.current = false;
    coordsRef.current = null;
    startRef.current = performance.now();

    if (!navigator.geolocation) {
      setStatus({ phase: "error", message: "Geolocation not supported by this browser." });
      setHolding(false);
      return;
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        coordsRef.current = pos.coords;
      },
      (err) => {
        setStatus({ phase: "error", message: err.message || "Unable to get location." });
        setHolding(false);
        cleanup();
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    const tick = (now: number) => {
      if (startRef.current === null) return;
      const elapsed = now - startRef.current;
      const pct = Math.min(elapsed / HOLD_MS, 1);
      setProgress(pct);

      if (elapsed < 3000) {
        setStatus({ phase: "gathering", progress: pct });
      } else if (elapsed < HOLD_MS) {
        if (coordsRef.current) {
          setStatus({ phase: "verifying", progress: pct, coords: coordsRef.current });
        } else {
          setStatus({ phase: "gathering", progress: pct });
        }
      }

      if (elapsed >= HOLD_MS) {
        if (coordsRef.current) {
          completedRef.current = true;
          setStatus({ phase: "acquired", coords: coordsRef.current });
          setHolding(false);
          cleanup();
          return;
        }
        // wait a bit more for coords
        setStatus({ phase: "gathering", progress: 1 });
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const cancel = () => {
    if (completedRef.current) return;
    if (status.phase === "acquired") return;
    setHolding(false);
    setProgress(0);
    setStatus({ phase: "idle" });
    cleanup();
  };

  const reset = () => {
    setProgress(0);
    setStatus({ phase: "idle" });
    cleanup();
  };

  const label = (() => {
    switch (status.phase) {
      case "gathering":
        return "Gathering data…";
      case "verifying":
        return "Verifying location…";
      case "acquired":
        return "Location acquired";
      case "error":
        return status.message;
      default:
        return "Press and hold for 5 seconds";
    }
  })();

  const barPct = status.phase === "acquired" ? 100 : Math.round(progress * 100);

  return (
    <div className="w-full flex flex-col items-center gap-8">
      {/* Progress */}
      <div className="w-full space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-foreground font-medium">
            {status.phase === "acquired" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            ) : status.phase === "gathering" || status.phase === "verifying" ? (
              <Loader2 className="h-4 w-4 animate-spin text-destructive" />
            ) : (
              <MapPin className="h-4 w-4 text-muted-foreground" />
            )}
            <span>{label}</span>
          </div>
          <span className="text-muted-foreground tabular-nums">{barPct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full transition-all duration-100 ease-linear",
              status.phase === "acquired" ? "bg-emerald-500" : "bg-destructive"
            )}
            style={{ width: `${barPct}%` }}
          />
        </div>
      </div>

      {/* Button */}
      <button
        type="button"
        aria-label="SOS — press and hold"
        onMouseDown={start}
        onMouseUp={cancel}
        onMouseLeave={() => holding && cancel()}
        onTouchStart={(e) => {
          e.preventDefault();
          start();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          cancel();
        }}
        onContextMenu={(e) => e.preventDefault()}
        className={cn(
          "relative h-56 w-56 rounded-full select-none touch-none",
          "bg-gradient-to-b from-red-500 to-red-700",
          "text-white text-4xl font-black tracking-widest",
          "shadow-[0_20px_60px_-15px_rgba(220,38,38,0.7)]",
          "ring-8 ring-red-500/20",
          "transition-transform duration-150 active:scale-95",
          holding && "scale-95 ring-red-500/40"
        )}
      >
        <span className="absolute inset-0 flex items-center justify-center drop-shadow-md">
          SOS
        </span>
        {holding && (
          <span className="pointer-events-none absolute inset-0 rounded-full animate-ping bg-red-500/40" />
        )}
      </button>

      {/* Result */}
      {status.phase === "acquired" && (
        <div className="w-full rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-semibold">
            <CheckCircle2 className="h-5 w-5" />
            Location acquired
          </div>
          <div className="text-sm text-foreground space-y-1 font-mono">
            <div>Lat: {status.coords.latitude.toFixed(6)}</div>
            <div>Lng: {status.coords.longitude.toFixed(6)}</div>
            <div className="text-muted-foreground">
              Accuracy: ±{Math.round(status.coords.accuracy)} m
            </div>
          </div>
          <a
            href={`https://www.google.com/maps?q=${status.coords.latitude},${status.coords.longitude}`}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-sm text-emerald-700 underline underline-offset-4"
          >
            Open in Google Maps →
          </a>
          <div>
            <button
              onClick={reset}
              className="mt-2 text-xs text-muted-foreground underline underline-offset-4"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {status.phase === "error" && (
        <div className="w-full rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {status.message}
        </div>
      )}
    </div>
  );
}