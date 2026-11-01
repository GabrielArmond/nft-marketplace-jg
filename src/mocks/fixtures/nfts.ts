import { NETWORKS, type Network, type NftImage } from '@/contracts/common'
import { NFT_CATEGORIES, type Edition, type NftCategory } from '@/contracts/nfts'
import { applyBasisPoints, fromWei, toWei } from '@/lib/money/eth'
import type { NftRecord } from '@/mocks/db/types'

type Art = 'emerald' | 'nomad' | 'baron' | 'golden'

const ART_ORDER: readonly Art[] = ['emerald', 'nomad', 'baron', 'golden']

const ART_ALT: Record<Art, string> = {
  emerald: 'Macaco de óculos redondos e jaqueta verde de colégio',
  nomad: 'Gorila grisalho de chapéu verde e moletom lilás',
  baron: 'Gorila preto de blazer creme e gola alta verde',
  golden: 'Orangotango dourado de fones verdes e jaqueta creme',
}

const ART_NOUN: Record<Art, string> = {
  emerald: 'Ape',
  nomad: 'Nomad',
  baron: 'Baron',
  golden: 'Beat',
}

const ART_ATTRIBUTES: Record<Art, readonly string[]> = {
  emerald: ['Óculos', 'Esmeralda'],
  nomad: ['Chapéu', 'Moletom'],
  baron: ['Blazer', 'Gola alta'],
  golden: ['Fones', 'Jaqueta'],
}

const EXTRA_TRAITS = [
  'Fundo creme',
  'Fundo sálvia',
  'Corrente dourada',
  'Brinco',
  'Pelagem clara',
  'Olhar sereno',
  'Sorriso discreto',
] as const

const ART_CREATOR: Record<Art, string> = {
  emerald: 'Nova Sato',
  nomad: 'Iris Moreau',
  baron: 'Dante Reis',
  golden: 'Lia Tavares',
}

const ART_THEME: Record<Art, string> = {
  emerald: 'A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.',
  nomad: 'A obra explora memória, calma e pertencimento em paisagens digitais em transição.',
  baron: 'A obra explora presença, elegância e poder em retratos da cultura digital.',
  golden: 'A obra explora som, ritmo e energia na fronteira entre música e imagem.',
}

const NETWORK_NAMES: Record<Network, string> = {
  ethereum: 'Ethereum',
  polygon: 'Polygon',
  solana: 'Solana',
}

const GALLERY_SIZE = 4
const ROYALTY_PERCENT = 5

const ADJECTIVES = [
  'Amber',
  'Copper',
  'Lunar',
  'Solar',
  'Cedar',
  'Onyx',
  'Coral',
  'Jade',
  'Velvet',
  'Rust',
] as const

/** The cards drawn in the Figma file, with their exact names and prices. */
const FIGMA_NFTS = [
  ['Emerald Ape #042', '0042', 'emerald', '1.19', null, 'digital-art', 'ethereum', true],
  ['Sage Nomad #009', '0009', 'nomad', '1.69', null, 'digital-art', 'ethereum', false],
  ['Neon Vessel #552', '0552', 'baron', '1.99', '2.29', 'collectibles', 'polygon', true],
  ['Cosmic Bloom #118', '0118', 'nomad', '1.29', null, 'generative', 'ethereum', false],
  ['Violet Nomad #314', '0314', 'nomad', '1.39', null, 'digital-art', 'solana', false],
  ['Ivory Baron #088', '0088', 'baron', '1.79', null, '3d-art', 'ethereum', false],
  ['Golden Beat #207', '0207', 'golden', '0.99', null, 'music', 'polygon', false],
  ['Golden Signal #160', '0160', 'golden', '0.39', null, 'music', 'solana', false],
] as const satisfies readonly (readonly [
  string,
  string,
  Art,
  string,
  string | null,
  NftCategory,
  Network,
  boolean,
])[]

const GENERATED_COUNT = 40
const LOWEST_PRICE_CENTS = 2
const HIGHEST_PRICE_CENTS = 1230
const FIRST_LISTED_AT_MS = Date.UTC(2026, 8, 1)
const DAY_MS = 86_400_000
const SOLD_OUT_EVERY = 13

function image(art: Art, alt: string): NftImage {
  return { url: `/nft/${art}-640.webp`, thumbnailUrl: `/nft/${art}-320.webp`, alt }
}

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-$/, '')
}

function ethFromCents(cents: number): string {
  return fromWei((toWei('0.01') * BigInt(cents)))
}

function buildEditions(nftId: string, priceEth: string, index: number, soldOut: boolean): Edition[] {
  const editions: Edition[] = [
    {
      id: `${nftId}:1-1`,
      label: '1/1',
      supply: 1,
      available: soldOut || index % 5 === 0 ? 0 : 1,
      priceEth: applyBasisPoints(priceEth, 40_000),
    },
    {
      id: `${nftId}:1-10`,
      label: '1/10',
      supply: 10,
      available: soldOut ? 0 : (index % 4) * 3 + 1,
      priceEth: applyBasisPoints(priceEth, 15_000),
    },
    {
      id: `${nftId}:1-50`,
      label: '1/50',
      supply: 50,
      available: soldOut ? 0 : 5 + ((index * 3) % 40),
      priceEth,
    },
  ]
  if (soldOut) return editions

  return [
    ...editions,
    {
      id: `${nftId}:open`,
      label: 'ABERTA',
      supply: null,
      available: 999,
      priceEth: applyBasisPoints(priceEth, 5_000),
    },
  ]
}

interface NftSeed {
  name: string
  tokenId: string
  art: Art
  priceEth: string
  compareAtPriceEth: string | null
  category: NftCategory
  network: Network
  isRare: boolean
  soldOut: boolean
}

/** Deterministic: the first NFT keeps the Figma list, and the rest vary by position. */
function attributesOf({ art, isRare }: NftSeed, index: number): string[] {
  const trait = EXTRA_TRAITS[index % EXTRA_TRAITS.length]

  return [
    ...ART_ATTRIBUTES[art],
    ...(index > 0 && trait ? [trait] : []),
    isRare ? 'Raro' : 'Comum',
  ]
}

function buildNft(seed: NftSeed, index: number): NftRecord {
  const id = slug(seed.name)
  const alt = ART_ALT[seed.art]
  const editions = buildEditions(id, seed.priceEth, index, seed.soldOut)
  const network = NETWORK_NAMES[seed.network]
  const creator = ART_CREATOR[seed.art]
  const contractAddress = `0x7A42${seed.tokenId.padStart(32, '0')}19E8`

  return {
    id,
    tokenId: `#${seed.tokenId}`,
    name: seed.name,
    category: seed.category,
    collection: 'Kurio Apes',
    network: seed.network,
    image: image(seed.art, alt),
    priceEth: seed.priceEth,
    compareAtPriceEth: seed.compareAtPriceEth,
    isRare: seed.isRare,
    soldOut: seed.soldOut,
    listedAt: new Date(FIRST_LISTED_AT_MS - index * DAY_MS).toISOString(),
    version: 1,
    description: `${seed.name} é um colecionável digital finalizado à mão da coleção Kurio Editions, verificado e pronto para a sua carteira.`,
    creator,
    story: [
      `${seed.name} é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na ${network}. ${ART_THEME[seed.art]}`,
      `A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. ${creator} recebe ${ROYALTY_PERCENT.toString()}% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.`,
    ],
    networkNote: `Cunhado na ${network} com procedência imutável e metadados armazenados no IPFS.`,
    contractNote: `${contractAddress.slice(0, 6)}...${contractAddress.slice(-4)} • Contrato inteligente ERC-721 verificado.`,
    royaltyNote: `Direitos autorais do criador: ${ROYALTY_PERCENT.toString()}% nas vendas secundárias, pagos automaticamente pelos mercados compatíveis.`,
    attributes: attributesOf(seed, index),
    // The same artwork on every slide, as in the Figma detail frame.
    gallery: Array.from({ length: GALLERY_SIZE }, () => image(seed.art, alt)),
    defaultEditionId: `${id}:1-50`,
    editions,
    contractAddress,
    royaltyPercent: ROYALTY_PERCENT,
    rating: 4 + (index % 10) / 10,
    reviewCount: 19 + index,
    trendingScore: (index * 17) % 53,
  }
}

function generatedSeed(index: number): NftSeed {
  const art = ART_ORDER[index % ART_ORDER.length] ?? 'emerald'
  const adjective = ADJECTIVES[index % ADJECTIVES.length] ?? 'Amber'
  const tokenId = (600 + index * 7).toString().padStart(4, '0')
  const isLast = index === GENERATED_COUNT - 1
  const cents = isLast ? HIGHEST_PRICE_CENTS : LOWEST_PRICE_CENTS + (index * 311) % 1229

  return {
    name: `${adjective} ${ART_NOUN[art]} #${tokenId.slice(1)}`,
    tokenId,
    art,
    priceEth: ethFromCents(cents),
    compareAtPriceEth: index % 6 === 0 ? ethFromCents(cents + 40) : null,
    category: NFT_CATEGORIES[index % NFT_CATEGORIES.length] ?? 'digital-art',
    network: NETWORKS[index % NETWORKS.length] ?? 'ethereum',
    isRare: index % 7 === 0,
    soldOut: index % SOLD_OUT_EVERY === SOLD_OUT_EVERY - 1,
  }
}

/** 48 deterministic NFTs: the same output on every run, with no randomness. */
export function createNftFixtures(): NftRecord[] {
  const figmaSeeds = FIGMA_NFTS.map<NftSeed>(
    ([name, tokenId, art, priceEth, compareAtPriceEth, category, network, isRare]) => ({
      name,
      tokenId,
      art,
      priceEth,
      compareAtPriceEth,
      category,
      network,
      isRare,
      soldOut: false,
    }),
  )
  const generated = Array.from({ length: GENERATED_COUNT }, (_, index) => generatedSeed(index))

  return [...figmaSeeds, ...generated].map(buildNft)
}
