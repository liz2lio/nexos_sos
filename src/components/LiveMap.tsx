import { useEffect, useState } from "react";
import { Radio } from "lucide-react";

type Props = {
  lat: number;
  lng: number;
  accuracy: number;
};

export function LiveMap({ lat, lng, accuracy }: Props) {
  const [live, setLive] = useState({ lat, lng, accuracy });
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());

  useEffect(() => {
    setLive({ lat, lng, accuracy });
    setUpdatedAt(Date.now());
  }, [lat, lng, accuracy]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    const id = navigator.geolocation.watchPosition(
      (pos) => {
        setLive({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setUpdatedAt(Date.now());
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(id);
  }, []);

  // ~150m bbox around the point
  const d = 0.0015;
  const bbox = `${live.lng - d},${live.lat - d},${live.lng + d},${live.lat + d}`;
  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${live.lat},${live.lng}`;

  const secsAgo = Math.max(0, Math.floor((Date.now() - updatedAt) / 1000));

  return (
    <div className="mt-2 overflow-hidden rounded-lg border border-emerald-500/30">
      <div className="flex items-center justify-between gap-2 bg-emerald-500/10 px-3 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-medium text-emerald-700">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <Radio className="h-3 w-3" />
          Live
        </div>
        <span className="font-mono text-muted-foreground">
          {live.lat.toFixed(5)}, {live.lng.toFixed(5)} · {secsAgo}s ago
        </span>
      </div>
      <iframe
        key={`${live.lat.toFixed(5)}-${live.lng.toFixed(5)}`}
        title="Live location map"
        src={src}
        className="h-56 w-full border-0"
        loading="lazy"
      />
    </div>
  );
}