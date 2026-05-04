import { createFileRoute } from "@tanstack/react-router";
import { SosButton } from "@/components/SosButton";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md flex flex-col items-center gap-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Emergency SOS</h1>
          <p className="text-muted-foreground text-sm">
            Press and hold the button for 5 seconds to share your location
          </p>
        </div>
        <SosButton />
      </div>
    </main>
  );
}
