import { Dialog } from 'radix-ui'
import { useState } from 'react'

import { CloseIcon, SearchIcon } from '@/components/icons/icons'
import { BackButton } from '@/components/layout/back-button'
import type { NftDetail, NftSummary } from '@/contracts/nfts'
import { FavoriteButton } from '@/features/favorites/components/favorite-button'
import { cn } from '@/lib/utils'

function galleryOf({ image, gallery }: NftDetail) {
  return [image, ...gallery.filter(({ url }) => url !== image.url)]
}

function ZoomDialog({ nft, url, alt }: { nft: NftSummary; url: string; alt: string }) {
  return (
    <Dialog.Root>
      <Dialog.Trigger
        aria-label={`Ampliar imagem de ${nft.name}`}
        className="absolute top-4 right-4 hidden size-7.5 items-center justify-center rounded-full border border-border bg-surface-raised md:flex"
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

export function NftGallery({ nft }: { nft: NftDetail }) {
  const images = galleryOf(nft)
  const [activeIndex, setActiveIndex] = useState(0)
  const active = images[activeIndex] ?? nft.image

  return (
    <section
      aria-label={`Imagens de ${nft.name}`}
      className="relative bg-gradient-surface px-7 pt-6 pb-16 md:mx-auto md:grid md:w-full md:max-w-143.25 md:grid-cols-[6.25rem_minmax(0,1fr)] md:gap-7 md:bg-none md:p-0 xl:mx-0"
    >
      <div className="mb-2 flex justify-between md:hidden">
        <BackButton />
        <FavoriteButton nft={nft} />
      </div>

      <ul className="hidden flex-col gap-4 md:flex">
        {images.map(({ thumbnailUrl, url }, index) => (
          <li key={url}>
            <button
              type="button"
              aria-label={`Ver imagem ${(index + 1).toString()} de ${images.length.toString()}`}
              aria-pressed={index === activeIndex}
              className={cn(
                'block overflow-hidden rounded-lg border',
                index === activeIndex ? 'border-primary' : 'border-transparent',
              )}
              onClick={() => {
                setActiveIndex(index)
              }}
            >
              <img src={thumbnailUrl} alt="" width={100} height={100} loading="lazy" />
            </button>
          </li>
        ))}
      </ul>

      <div className="relative aspect-square md:rounded-md md:bg-card md:p-5">
        {/* Main LCP candidate: reserved box, eager and high priority. */}
        <img
          src={active.url}
          alt={active.alt}
          width={404}
          height={404}
          fetchPriority="high"
          className="size-full rounded-3xl object-cover"
        />
        <ZoomDialog nft={nft} url={active.url} alt={active.alt} />
      </div>

      <div className="absolute inset-x-0 bottom-14 flex justify-center gap-1.5 md:hidden">
        {images.map(({ url }, index) => (
          <button
            key={url}
            type="button"
            aria-label={`Ver imagem ${(index + 1).toString()} de ${images.length.toString()}`}
            aria-pressed={index === activeIndex}
            className="flex h-6 items-center"
            onClick={() => {
              setActiveIndex(index)
            }}
          >
            <span
              className={cn(
                'block h-1.75 rounded-full bg-primary',
                index === activeIndex ? 'w-7' : 'w-1.75',
              )}
            />
          </button>
        ))}
      </div>
    </section>
  )
}
