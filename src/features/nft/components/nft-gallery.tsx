import { Dialog } from 'radix-ui'
import { useRef, useState } from 'react'

import { CloseIcon, SearchIcon } from '@/components/icons/icons'
import { BackButton } from '@/components/layout/back-button'
import type { NftDetail, NftSummary } from '@/contracts/nfts'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { scrollBehavior } from '@/lib/motion'
import { cn } from '@/lib/utils'

function ZoomDialog({ nft, url, alt }: { nft: NftSummary; url: string; alt: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={`Ampliar imagem de ${nft.name}`}
        className="absolute top-4 right-4 z-10 hidden size-7.5 items-center justify-center rounded-full border border-border bg-surface-raised md:flex"
      >
        <SearchIcon className="size-4" />
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/70" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed top-1/2 left-1/2 z-50 w-[min(90vw,40rem)] -translate-x-1/2 -translate-y-1/2"
        >
          <Dialog.Title className="sr-only">{nft.name}</Dialog.Title>
          <img src={url} alt={alt} width={640} height={640} className="w-full rounded-3xl" />
          <Dialog.Close
            aria-label="Fechar imagem"
            className="absolute top-3 right-3 flex size-8 items-center justify-center rounded-full bg-surface-raised text-primary"
          >
            <CloseIcon className="size-4.5" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

/**
 * The slides are a scroll-snap row: the browser handles the swipe, keeps vertical
 * page scrolling untouched and moves the photo even though all of them are alike.
 */
export function NftGallery({ nft }: { nft: NftDetail }) {
  const images = [nft.image, ...nft.gallery.slice(1)]
  const total = images.length.toString()
  const slides = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? nft.image

  function goTo(index: number) {
    const row = slides.current
    row?.scrollTo({ left: index * row.clientWidth, behavior: scrollBehavior() })
  }

  function photoLabel(index: number) {
    return `Ver foto ${(index + 1).toString()} de ${total}`
  }

  return (
    <section
      aria-label={`Fotos de ${nft.name}`}
      className="relative bg-gradient-surface px-7 pt-6 pb-16 md:mx-auto md:grid md:w-full md:max-w-143.25 md:grid-cols-[6.25rem_minmax(0,1fr)] md:gap-7 md:bg-none md:p-0 xl:mx-0"
    >
      <div className="mb-2 flex justify-between md:hidden">
        <BackButton />
        <FavoriteButton nft={nft} />
      </div>

      <ul className="hidden flex-col gap-4 md:flex">
        {images.map(({ thumbnailUrl }, index) => (
          <li key={index.toString()}>
            <button
              type="button"
              aria-label={photoLabel(index)}
              aria-pressed={index === activeIndex}
              className={cn(
                'block overflow-hidden rounded-lg border',
                index === activeIndex ? 'border-primary' : 'border-transparent',
              )}
              onClick={() => {
                goTo(index)
              }}
            >
              <img src={thumbnailUrl} alt="" width={100} height={100} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative aspect-square md:rounded-md md:bg-card md:p-5">
        <div
          ref={slides}
          tabIndex={0}
          role="group"
          aria-roledescription="carrossel"
          aria-label={`Fotos de ${nft.name}, use as setas para navegar`}
          className="flex size-full snap-x snap-mandatory overflow-x-auto rounded-3xl [scrollbar-width:none]"
          onScroll={({ currentTarget: { scrollLeft, clientWidth } }) => {
            setActiveIndex(Math.round(scrollLeft / clientWidth))
          }}
        >
          {images.map(({ url, alt }, index) => (
            <img
              key={index.toString()}
              src={url}
              alt={index === 0 ? alt : `${alt}, foto ${(index + 1).toString()}`}
              width={404}
              height={404}
              // The first slide is the LCP candidate: reserved box, eager and high priority.
              fetchPriority={index === 0 ? 'high' : 'auto'}
              draggable={false}
              className="size-full shrink-0 snap-center rounded-3xl object-cover"
            />
          ))}
        </div>
        <ZoomDialog nft={nft} url={active.url} alt={active.alt} />
      </div>

      <p aria-live="polite" className="sr-only">
        Foto {activeIndex + 1} de {total}
      </p>

      <div className="absolute inset-x-0 bottom-14 flex justify-center gap-1.5 md:hidden">
        {images.map((_image, index) => (
          <button
            key={index.toString()}
            type="button"
            aria-label={photoLabel(index)}
            aria-pressed={index === activeIndex}
            className="flex h-6 items-center"
            onClick={() => {
              goTo(index)
            }}
          >
            <span
              className={cn(
                'block h-1.75 rounded-full bg-primary transition-all',
                index === activeIndex ? 'w-7' : 'w-1.75',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
