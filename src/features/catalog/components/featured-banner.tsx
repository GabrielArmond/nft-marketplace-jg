import { Link } from '@tanstack/react-router'

export function FeaturedBanner() {
  return (
    <section
      aria-label="NFT em destaque"
      className="bg-linear-180 from-primary/10 to-primary/3 pt-6 pb-1"
    >
      <h2 className="px-5 text-2xl leading-8 font-bold text-content-accent">NFT EM DESTAQUE</h2>
      <p className="mt-4 px-5 text-center text-title leading-4 font-bold">OFERTA LIMITADA</p>
      <Link to="/nft/$id" params={{ id: 'sage-nomad-009' }} className="mt-4 block">
        <span className="sr-only">Ver Sage Nomad #009</span>
        <img
          src="/nft/nomad-640.webp"
          alt="Gorila grisalho de chapéu verde e moletom lilás"
          width={310}
          height={368}
          loading="lazy"
          className="h-92 w-full rounded-[1.375rem] object-cover"
        />
      </Link>
    </section>
  )
}
