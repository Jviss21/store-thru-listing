export default function Loading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-48 rounded-[1.75rem] bg-ink/10" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-24 rounded-2xl bg-ink/5" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-ink/5" />
    </div>
  );
}
