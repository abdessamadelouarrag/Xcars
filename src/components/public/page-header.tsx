export function PublicPageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string | null;
}) {
  return (
    <header className="bg-[color-mix(in_srgb,var(--agency-primary)_7%,var(--agency-background))]">
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        {eyebrow ? (
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-[var(--agency-primary)]">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="font-agency-heading mt-3 max-w-4xl text-4xl font-bold sm:text-5xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-sm leading-7 opacity-60">
            {description}
          </p>
        ) : null}
      </div>
    </header>
  );
}
