import { useEffect, useState, type RefObject } from 'react'

import { scrollBehavior } from '@/lib/motion'

/** Fully visible items and the distance between two of them, read from the layout. */
function measure(row: HTMLElement) {
  const [first, second] = row.children
  if (!first || !second) return null

  const itemWidth = first.getBoundingClientRect().width
  const step = second.getBoundingClientRect().left - first.getBoundingClientRect().left
  const gap = step - itemWidth

  return { step, perPage: Math.max(1, Math.round((row.clientWidth + gap) / step)) }
}

/**
 * Splits a horizontal scroller into pages of whole items. Everything is derived
 * from the scroll position, so touch, wheel and keyboard all report the same page.
 * `itemCount` remeasures when the items change without the row being resized.
 */
export function useScrollPages(row: RefObject<HTMLElement | null>, itemCount: number) {
  const [pages, setPages] = useState(0)
  const [page, setPage] = useState(0)

  useEffect(() => {
    const element = row.current
    if (!element) return undefined

    function sync(target: HTMLElement) {
      const layout = measure(target)
      if (!layout) {
        setPages(0)
        return
      }

      const total = Math.ceil(itemCount / layout.perPage)
      const atEnd = target.scrollLeft >= target.scrollWidth - target.clientWidth - 1
      // The last page may be partial: its offset would never be reached.
      const current = Math.round(target.scrollLeft / (layout.perPage * layout.step))
      setPages(total)
      setPage(atEnd ? total - 1 : current)
    }

    const onChange = () => {
      sync(element)
    }

    sync(element)
    element.addEventListener('scroll', onChange, { passive: true })
    const observer = new ResizeObserver(onChange)
    observer.observe(element)

    return () => {
      element.removeEventListener('scroll', onChange)
      observer.disconnect()
    }
  }, [row, itemCount])

  function goTo(target: number) {
    const element = row.current
    const layout = element && measure(element)
    if (!element || !layout) return

    element.scrollTo({
      left: target * layout.perPage * layout.step,
      behavior: scrollBehavior(),
    })
  }

  return { pages, page, goTo }
}
