import { useEffect, useState } from "react";
import { MapPin, ShieldCheck, ShieldAlert, ShieldX, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type PermState = "unknown" | "prompt" | "granted" | "denied" | "unsupported" | "requesting";

export function LocationPermission() {
  const [state, setState] = useState<PermState>("unknown");

  const refresh = async () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setState("unsupported");
      return;
    }
    if (!navigator.permissions?.query) {
      setState("prompt");
      return;
    }
    try {
      const status = await navigator.permissions.query({ name: "geolocation" as PermissionName });
      setState(status.state as PermState);
      status.onchange = () => setState(status.state as PermState);
    } catch {
      setState("prompt");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const request = () => {
    if (!navigator.geolocation) {
      setState("unsupported");
      return;
    }
    setState("requesting");
    navigator.geolocation.getCurrentPosition(
      () => {
        setState("granted");
      },
      (err) => {
        setState(err.code === err.PERMISSION_DENIED ? "denied" : "prompt");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const meta = (() => {
    switch (state) {
      case "granted":
        return {
          icon: <ShieldCheck className="h-4 w-4 text-emerald-500" />,
          label: "Location access granted",
          tone: "border-emerald-500/30 bg-emerald-500/5",
        };
      case "denied":
        return {
          icon: <ShieldX className="h-4 w-4 text-destructive" />,
          label: "Location blocked — enable it in your browser settings",
          tone: "border-destructive/30 bg-destructive/5",
        };
      case "unsupported":
        return {
          icon: <ShieldX className="h-4 w-4 text-destructive" />,
          label: "Geolocation not supported on this device",
          tone: "border-destructive/30 bg-destructive/5",
        };
      case "requesting":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin text-foreground" />,
          label: "Requesting permission…",
          tone: "border-border bg-muted/40",
        };
      default:
        return {
          icon: <ShieldAlert className="h-4 w-4 text-amber-500" />,
          label: "Location permission required",
          tone: "border-amber-500/30 bg-amber-500/5",
        };
    }
  })();

  return (
    <div className={cn("w-full rounded-xl border p-3 flex items-center gap-3", meta.tone)}>
      <MapPin className="h-5 w-5 text-foreground shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground flex items-center gap-2">
          {meta.icon}
          <span className="truncate">{meta.label}</span>
        </div>
        <div className="text-xs text-muted-foreground">Settings · Location access</div>
      </div>
      {(state === "prompt" || state === "unknown") && (
        <button
          onClick={request}
          className="rounded-md bg-foreground px-3 py-1.5 text-xs font-semibold text-background hover:opacity-90"
        >
          Allow
        </button>
      )}
      {state === "denied" && (
        <button
          onClick={refresh}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
        >
          Recheck
        </button>
      )}
    </div>
  );
}