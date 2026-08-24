export default function RootLoading() {
  return (
    <div className="flex min-h-[60vh] flex-1 items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-xs">
        <div className="loading-spinner" />
        <p className="text-caption text-foreground/50">Loading Invera…</p>
      </div>
    </div>
  );
}