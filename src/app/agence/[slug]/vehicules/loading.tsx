export default function PublicCatalogLoading() {
  return (
    <div className="mx-auto max-w-7xl animate-pulse px-5 py-20 lg:px-8">
      <div className="h-12 w-64 rounded-xl bg-black/10" />
      <div className="mt-10 h-48 rounded-[var(--agency-radius)] bg-black/5" />
      <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-96 rounded-[var(--agency-radius)] bg-black/5" />
        ))}
      </div>
    </div>
  );
}
