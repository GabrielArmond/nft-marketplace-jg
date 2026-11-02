import type { QuoteLine } from '@/contracts/cart'
import { formatEth } from '@/lib/money/eth'

/** Also used by the receipt, so it reads only the frozen copy of each line. */
export function OrderLines({ lines }: { lines: readonly QuoteLine[] }) {
  return (
    <ul className="flex flex-col gap-3">
      {lines.map(({ editionId, name, tokenId, image, quantity, lineTotalEth }) => (
        <li key={editionId} className="flex items-center gap-2 bg-card p-1 pr-3 md:pr-2">
          <img
            src={image.thumbnailUrl}
            alt=""
            width={70}
            height={70}
            className="size-15 shrink-0 rounded-lg object-cover md:size-17.5"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-4 font-bold md:text-base md:leading-4">{name}</p>
            <p className="mt-1.5 truncate text-xs leading-4 text-content-subtle md:text-sm md:leading-4">
              ID do token: {tokenId}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1 md:flex-row md:items-center md:gap-2">
            <span className="text-sm leading-4 text-content-secondary">(x {quantity})</span>
            <span className="text-base leading-4 font-bold text-content-accent md:text-lg md:leading-4">
              {formatEth(lineTotalEth)} ETH
            </span>
          </div>
        </li>
      ))}
    </ul>
  )
}
