import { Link } from '@tanstack/react-router'

import { ArrowRightIcon } from '@/components/icons/icons'
import { Button } from '@/components/ui/button'
import type { CatalogSearch } from '@/features/catalog/search-params'

interface Promo {
  title: string
  text: string
  image: string
  search: CatalogSearch
}

const PROMOS: Promo[] = [
  {
    title: 'Lançamentos gênesis de edição limitada',
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/nft/emerald-640.webp',
    search: { tab: 'new' },
  },
  {
    title: 'Arte digital selecionada e muito mais',
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/nft/baron-640.webp',
    search: { categories: ['digital-art'] },
  },
]

/** The journal is out of scope: the cards are shown, but nothing pretends to open an article. */
const POSTS = [
  {
    date: '12 de setembro  |  Leitura de 6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/nft/baron-640.webp',
  },
  {
    date: '13 de setembro  |  Leitura de 2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: '/nft/emerald-640.webp',
  },
  {
    date: '15 de setembro  |  Leitura de 3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/nft/nomad-640.webp',
  },
  {
    date: '15 de setembro  |  Leitura de 2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/nft/golden-640.webp',
  },
]

export function HomePromos() {
  return (
    <section aria-label="Coleções em destaque" className="mt-20 grid gap-7 lg:grid-cols-2">
      {PROMOS.map(({ title, text, image, search }) => (
        <article
          key={title}
          className="relative flex flex-col overflow-hidden rounded-lg bg-card sm:h-62.5 sm:flex-row"
        >
          <img
            src={image}
            alt=""
            width={292}
            height={250}
            loading="lazy"
            className="h-52 w-full rounded-2xl object-cover sm:h-full sm:w-1/2"
          />
          <div className="relative flex flex-1 flex-col items-end gap-2 p-6 text-right sm:justify-center sm:p-5">
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-sm leading-6 text-content-secondary">{text}</p>
            <Button asChild size="sm" className="mt-1 h-10 w-35 gap-1 text-md font-medium">
              <Link to="/" hash="catalogo" search={search}>
                Explorar
                <ArrowRightIcon className="size-4.5" />
              </Link>
            </Button>
          </div>
        </article>
      ))}
    </section>
  )
}

export function HomeJournal() {
  return (
    <section aria-labelledby="diario-titulo" className="mt-24">
      <div className="flex flex-col gap-3 text-center">
        <h2 id="diario-titulo" className="text-3xl font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-sm leading-4.5 text-content-secondary">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </div>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        {POSTS.map(({ date, title, text, image }) => (
          <article key={title} className="overflow-hidden rounded-lg bg-card">
            <img
              src={image}
              alt=""
              width={268}
              height={195}
              loading="lazy"
              className="h-48.75 w-full object-cover object-top"
            />
            <div className="flex flex-col gap-2 px-4 pt-3 pb-4">
              <p className="text-xs font-medium text-content-secondary">{date}</p>
              <h3 className="text-base font-bold">{title}</h3>
              <p className="text-xs font-medium text-content-secondary">{text}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
