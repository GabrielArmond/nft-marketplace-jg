import { Link } from '@tanstack/react-router'
import { useState } from 'react'

import { ArrowRightIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const SLIDES = [
  {
    nftId: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    url: '/nft/emerald-640.webp',
    alt: 'Macaco de óculos redondos e jaqueta verde de colégio',
  },
  {
    nftId: 'sage-nomad-009',
    name: 'Sage Nomad #009',
    url: '/nft/nomad-640.webp',
    alt: 'Gorila grisalho de chapéu verde e moletom lilás',
  },
  {
    nftId: 'golden-beat-207',
    name: 'Golden Beat #207',
    url: '/nft/golden-640.webp',
    alt: 'Orangotango dourado de fones verdes e jaqueta creme',
  },
]

interface HeroDotsProps {
  active: number
  onSelect: (index: number) => void
  className?: string
}

function HeroDots({ active, onSelect, className }: HeroDotsProps) {
  return (
    <div className={cn('flex', className)}>
      {SLIDES.map(({ nftId }, index) => (
        <button
          key={nftId}
          type="button"
          aria-label={`Destaque ${(index + 1).toString()} de ${SLIDES.length.toString()}`}
          aria-pressed={index === active}
          className="flex size-4 items-center justify-center"
          onClick={() => {
            onSelect(index)
          }}
        >
          <span
            className={cn(
              'size-2 rounded-full border border-primary',
              index === active && 'bg-primary',
            )}
          />
        </button>
      ))}
    </div>
  )
}

export function HomeHero() {
  const [active, setActive] = useState(0)
  const slide = SLIDES[active] ?? SLIDES[0]
  if (!slide) return null

  return (
    <>
      {/* Mobile banner */}
      <section
        aria-label="Destaques"
        className="relative overflow-hidden rounded-[1.875rem] bg-linear-134 from-primary/20 to-primary/10 py-4 pr-2 pl-4 md:hidden"
      >
        <span
          aria-hidden="true"
          className="absolute -top-8 -left-20 size-62 rounded-full bg-linear-160 from-primary-light/43 to-primary/4"
        />
        <span
          aria-hidden="true"
          className="absolute -top-2.5 left-18 size-62 rounded-full bg-linear-160 from-primary-light/37 to-transparent"
        />
        <div className="relative flex items-center gap-2">
          <div className="flex min-w-0 flex-1 flex-col">
            <p className="text-xs font-medium">Bem-vindo à Kurio</p>
            <h1 className="mt-1.5 text-lg leading-7.25 font-bold whitespace-nowrap">
              SEJA DONO DA
              <br />
              CULTURA DIGITAL
            </h1>
            <p className="mt-1.5 text-xs leading-4.5 text-content-secondary">
              Descubra NFTs selecionados de criadores do mundo todo.
            </p>
            <Link
              to="/"
              hash="catalogo"
              className="mt-1 flex items-center gap-2 py-1 text-xs leading-3.5 font-bold text-content-accent"
            >
              EXPLORAR
              <ArrowRightIcon className="size-4.5" />
            </Link>
          </div>
          <Link
            to="/nft/$id"
            params={{ id: slide.nftId }}
            aria-label={`Ver ${slide.name}`}
            className="shrink-0"
          >
            <img
              src={slide.url}
              alt={slide.alt}
              width={160}
              height={160}
              fetchPriority="high"
              className="size-29 rounded-2xl min-[23rem]:size-33 min-[25rem]:size-40"
            />
          </Link>
        </div>
        <HeroDots active={active} onSelect={setActive} className="relative justify-center top-3" />
      </section>

      {/* Desktop and tablet */}
      <section
        aria-label="Destaques"
        className="hidden items-center gap-8 md:mt-8 md:grid md:grid-cols-2 lg:pl-10 xl:grid-cols-[1fr_28.125rem] xl:gap-27.5"
      >
        <div className="flex flex-col">
          <p className="text-sm leading-4 font-medium tracking-wide">Bem-vindo à Kurio</p>
          <h1 className="mt-2 text-2xl leading-10 font-bold lg:text-3xl lg:leading-12 xl:text-display xl:leading-17.5">
            SEJA DONO DO FUTURO
            <br />
            DA ARTE DIGITAL
          </h1>
          <p className="mt-1 max-w-139 text-sm leading-6 text-content-secondary">
            Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte digital
            rara, apoie artistas e tenha uma parte da cultura da internet.
          </p>
          <Button asChild size="sm" className="mt-8 h-10 w-35">
            <Link to="/" hash="catalogo">
              EXPLORAR
            </Link>
          </Button>
          <HeroDots active={active} onSelect={setActive} className="mt-6 justify-end" />
        </div>
        <Link
          to="/nft/$id"
          params={{ id: slide.nftId }}
          aria-label={`Ver ${slide.name}`}
          className="block"
        >
          <img
            src={slide.url}
            alt={slide.alt}
            width={450}
            height={450}
            fetchPriority="high"
            className="aspect-square w-full rounded-[1.5rem]"
          />
        </Link>
      </section>
    </>
  )
}
