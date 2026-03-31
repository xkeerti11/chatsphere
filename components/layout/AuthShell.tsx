export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="gradient-brand hidden rounded-[2rem] p-8 text-white shadow-2xl lg:flex lg:flex-col lg:justify-between">
          <div>
            <p className="font-display text-4xl font-bold">ChatSphere</p>
            <p className="mt-3 max-w-md text-white/80">
              Browser-first messaging for friends, stories, and shared moments.
            </p>
          </div>
          <div className="space-y-4">
            <div className="rounded-[1.5rem] bg-white/12 p-5">
              <p className="font-semibold">Real-time chat</p>
              <p className="mt-1 text-sm text-white/75">Instant text, media, and seen updates.</p>
            </div>
            <div className="rounded-[1.5rem] bg-white/12 p-5">
              <p className="font-semibold">Stories in 24 hours</p>
              <p className="mt-1 text-sm text-white/75">Quick updates for your active circle.</p>
            </div>
          </div>
        </section>

        <section className="app-card rounded-[2rem] p-6 sm:p-8">
          <div className="mb-8">
            <p className="font-display text-3xl font-bold">{title}</p>
            <p className="mt-2 text-sm text-[var(--muted)]">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}
