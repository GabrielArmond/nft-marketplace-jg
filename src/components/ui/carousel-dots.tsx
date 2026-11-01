import { cn } from '@/lib/utils'

interface CarouselDotsProps {
  label: string
  pages: number
  page: number
  onSelect: (page: number) => void
}

/** The active dot is filled and the others hollow, so color alone never tells them apart. */
export function CarouselDots({ label, pages, page, onSelect }: CarouselDotsProps) {
  if (pages < 2) return null

  return (
    <nav aria-label={`Páginas de ${label}`} className="mt-1 flex justify-center md:mt-3">
      {Array.from({ length: pages }, (_item, index) => (
        <button
          key={index}
          type="button"
          aria-label={`Ir para a página ${(index + 1).toString()} de ${pages.toString()}`}
          aria-current={index === page ? 'true' : undefined}
          // The dot is 12px; the button gives it a comfortable target on touch screens.
          className="flex h-11 w-8 items-center justify-center md:h-6 md:w-5"
          onClick={() => {
            onSelect(index)
          }}
        >
          <span
            className={cn(
              'size-3 rounded-full border-[1.3px] border-primary transition-colors',
              index === page && 'bg-primary',
            )}
          />
        </button>
      ))}
    </nav>
  )
}
