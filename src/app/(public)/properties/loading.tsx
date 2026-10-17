/** Skeleton shown while the catalogue loads. Replaced by real results; never shown indefinitely. */
export default function Loading() {
  return (
    <div className="mx-auto grid max-w-content gap-8 px-5 py-10 md:px-8 lg:grid-cols-[320px_1fr]" aria-busy="true">
      <p className="sr-only" role="status">Loading properties…</p>
      <div className="card h-96 skeleton" aria-hidden="true" />
      <ul className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="card overflow-hidden">
            <div className="aspect-[4/3] skeleton" />
            <div className="space-y-3 p-5">
              <div className="h-4 w-1/3 skeleton rounded" />
              <div className="h-5 w-4/5 skeleton rounded" />
              <div className="h-4 w-2/3 skeleton rounded" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
