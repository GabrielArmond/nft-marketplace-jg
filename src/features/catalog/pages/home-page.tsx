import { Skeleton } from '@/components/ui/skeleton'

const PLACEHOLDER_CARDS = ['first', 'second', 'third', 'fourth']

/** Provisional page: validates tokens, font and routing until the real home arrives. */
export function HomePage() {
  return (
    <main className="page-container flex flex-col gap-10 py-12 md:py-20">
      <header className="flex flex-col gap-4">
        <p className="text-sm font-bold tracking-wide">KURIO</p>
        <h1 className="text-3xl font-bold uppercase md:text-4xl xl:text-display">
          Seja dono do futuro da arte digital
        </h1>
        <p className="max-w-prose text-sm text-content-secondary">
          Descubra NFTs selecionados de criadores emergentes e consagrados.
        </p>
      </header>

      <section
        aria-busy="true"
        aria-label="Catálogo em preparação"
        className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4"
      >
        {PLACEHOLDER_CARDS.map((card) => (
          <div key={card} className="flex flex-col gap-3 rounded-2xl bg-card p-3 shadow-card">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </section>
    </main>
  )
}
