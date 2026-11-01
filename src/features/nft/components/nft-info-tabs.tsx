import { Tabs } from 'radix-ui'

import type { NftDetail } from '@/contracts/nfts'
import { NETWORK_LABELS } from '@/features/catalog/search-params'

const TAB =
  'border-b-2 border-transparent pb-2 text-base md:text-lg data-[state=active]:border-primary data-[state=active]:font-bold data-[state=active]:text-content-accent'
const LABEL = 'text-sm leading-6 font-bold'
const TEXT = 'text-sm leading-6 text-content-secondary'

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

/** Figma swaps the "Contrato" and "Direitos autorais" texts: each sits under its own label here. */
export function NftInfoTabs({ nft }: { nft: NftDetail }) {
  const { name, network, contractAddress, royaltyPercent, reviewCount, description } = nft

  return (
    <Tabs.Root defaultValue="detalhes" className="px-6 md:px-0">
      <Tabs.List
        aria-label="Informações do NFT"
        className="flex gap-6 border-b border-primary/30 md:gap-8"
      >
        <Tabs.Trigger value="detalhes" className={TAB}>
          Detalhes do NFT
        </Tabs.Trigger>
        <Tabs.Trigger value="avaliacoes" className={TAB}>
          Avaliações de colecionadores ({reviewCount})
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="detalhes" className="flex flex-col gap-3 pt-3">
        <p className={TEXT}>{description}</p>
        <div>
          <h3 className={LABEL}>Rede:</h3>
          <p className={TEXT}>
            Cunhado na {NETWORK_LABELS[network]} com procedência imutável e metadados armazenados no
            IPFS.
          </p>
        </div>
        <div>
          <h3 className={LABEL}>Contrato:</h3>
          <p className={TEXT}>
            {shortAddress(contractAddress)} • Contrato inteligente ERC-721 verificado.
          </p>
        </div>
        <div>
          <h3 className={LABEL}>Direitos autorais:</h3>
          <p className={TEXT}>
            Direitos autorais do criador: {royaltyPercent}% nas vendas secundárias, pagos
            automaticamente pelos mercados compatíveis.
          </p>
        </div>
      </Tabs.Content>

      <Tabs.Content value="avaliacoes" className="pt-3">
        <p className={TEXT}>
          {name} tem {reviewCount} avaliações. Os comentários dos colecionadores não estão
          disponíveis.
        </p>
      </Tabs.Content>
    </Tabs.Root>
  )
}
