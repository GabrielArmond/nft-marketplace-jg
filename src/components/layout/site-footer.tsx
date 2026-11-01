import { Link } from '@tanstack/react-router'
import { useState, type ComponentProps, type ComponentType } from 'react'

import {
  FacebookIcon,
  InstagramIcon,
  LinkedinIcon,
  TwitterIcon,
  YoutubeIcon,
} from '@/components/icons/icons'
import { Input } from '@/components/ui/input'

const FEATURES = [
  {
    letter: 'W',
    title: 'Segurança da carteira',
    text: 'Proteja sua carteira e colecione arte digital verificada com confiança.',
  },
  {
    letter: 'C',
    title: 'Criadores em destaque',
    text: 'Conheça artistas, estúdios e comunidades que moldam a cultura digital na rede.',
  },
  {
    letter: 'D',
    title: 'Alertas de lançamentos',
    text: 'Receba calendários de cunhagem, novidades de listas de acesso e análises do mercado.',
  },
]

/** Editorial pages are out of scope: they read as text, never as links that lead nowhere. */
const INFO_COLUMNS = [
  {
    title: 'Central de ajuda',
    items: [
      'Central de ajuda',
      'Como comprar NFTs',
      'Carteira e segurança',
      'Política do mercado',
      'Denunciar item',
    ],
  },
  {
    title: 'Coleções',
    items: ['Arte digital', 'Fotografia', 'Música', 'Arte 3D', 'Utilidade'],
  },
]

type Icon = ComponentType<ComponentProps<'svg'>>

const SOCIAL_LINKS: { label: string; href: string; icon: Icon; className: string }[] = [
  { label: 'Facebook', href: 'https://www.facebook.com', icon: FacebookIcon, className: 'h-4 w-2' },
  { label: 'Instagram', href: 'https://www.instagram.com', icon: InstagramIcon, className: 'size-4' },
  { label: 'Twitter', href: 'https://x.com', icon: TwitterIcon, className: 'h-3.5 w-4' },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: LinkedinIcon, className: 'size-4' },
  { label: 'YouTube', href: 'https://www.youtube.com', icon: YoutubeIcon, className: 'h-3.5 w-4.75' },
]

function Newsletter() {
  const [notice, setNotice] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg leading-4 font-bold">Antecipe-se ao próximo lançamento</h2>
      <form
        className="flex"
        onSubmit={(event) => {
          event.preventDefault()
          setNotice(true)
        }}
      >
        <label htmlFor="newsletter-email" className="sr-only">
          E-mail
        </label>
        <Input
          id="newsletter-email"
          type="email"
          placeholder="digite seu e-mail..."
          className="h-10 rounded-none rounded-l-xs border-none bg-surface-dark text-sm"
        />
        <button
          type="submit"
          className="rounded-r-xs bg-primary px-4 text-lg font-medium text-primary-foreground"
        >
          Enviar
        </button>
      </form>
      {notice ? (
        <p role="status" className="text-caption text-content-secondary">
          A assinatura de novidades não está disponível nesta demonstração.
        </p>
      ) : (
        <p className="text-caption text-content-secondary">
          Receba lançamentos selecionados, histórias de criadores e novidades do mercado.
        </p>
      )}
    </div>
  )
}

export function SiteFooter() {
  return (
    <footer className="page-container mt-16 pb-36 md:pb-0">
      <div className="grid gap-8 bg-card p-6 md:grid-cols-2 xl:grid-cols-[16rem_16rem_16rem_1fr] xl:gap-6 xl:p-8">
        {FEATURES.map(({ letter, title, text }) => (
          <div key={letter} className="flex flex-col gap-3 xl:border-r xl:border-primary xl:pr-4">
            <span
              aria-hidden="true"
              className="flex size-18.5 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground"
            >
              {letter}
            </span>
            <h2 className="text-lg font-bold">{title}</h2>
            <p className="text-sm text-content-secondary">{text}</p>
          </div>
        ))}
        <Newsletter />
      </div>

      <div className="grid gap-2 bg-surface-dark px-6 py-6 md:grid-cols-2 xl:grid-cols-4 xl:px-8 xl:py-8">
        <p className="text-sm font-bold tracking-wide">KURIO</p>
        <p className="text-sm">Feito para colecionadores, criadores e cultura</p>
        <a href="mailto:contato@email.com" className="text-sm">
          contato@email.com
        </a>
        <a href="tel:+551140028922" className="text-sm">
          +55 11 4002 8922
        </a>
      </div>

      <div className="grid gap-8 bg-card p-6 md:grid-cols-2 xl:grid-cols-4 xl:p-8">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg leading-4 font-bold">Meu perfil</h2>
          <ul className="flex flex-col text-sm leading-7.5">
            <li>
              <Link to="/perfil">Meu perfil</Link>
            </li>
            <li>
              <Link to="/favoritos">Lista de interesse</Link>
            </li>
            <li>
              <Link to="/carrinho">Carrinho</Link>
            </li>
          </ul>
        </div>

        {INFO_COLUMNS.map(({ title, items }) => (
          <div key={title} className="flex flex-col gap-2">
            <h2 className="text-lg leading-4 font-bold">{title}</h2>
            <ul className="flex flex-col text-sm leading-7.5">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ))}

        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-5">
            <h2 className="text-lg leading-4 font-bold">Redes sociais</h2>
            <ul className="flex gap-2.5">
              {SOCIAL_LINKS.map(({ label, href, icon: SocialIcon, className }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${label} (abre em nova aba)`}
                    className="flex size-7.5 items-center justify-center rounded-sm border border-primary text-primary"
                  >
                    <SocialIcon className={className} />
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-col gap-3">
            <h2 className="text-lg leading-4 font-bold">Carteiras compatíveis</h2>
            <p className="w-fit rounded-md border border-border-soft bg-surface-dark px-2.5 py-1.5 text-micro font-bold tracking-micro text-content-accent">
              METAMASK • WALLETCONNECT • COINBASE
            </p>
          </div>
        </div>
      </div>

      <p className="py-2 text-center text-sm leading-7.5">
        © 2026 Kurio. Propriedade digital para todos.
      </p>
    </footer>
  )
}
