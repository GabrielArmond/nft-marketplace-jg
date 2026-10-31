import { createCn } from 'cn/config'

/*
 * Tokens outside Tailwind's defaults must be registered here. Unknown `text-*`
 * values are read as colours, so `text-caption text-foreground` would silently
 * drop the font size. Keep in sync with @theme in src/styles/globals.css.
 */
export const cn = createCn({
  extend: {
    theme: {
      text: ['micro', 'tiny', 'caption', 'md', 'body-lg', 'title-sm', 'title', 'display'],
      radius: ['control', 'pill'],
      shadow: ['card', 'card-lg', 'ambient', 'ambient-lg', 'float', 'drop', 'sheet'],
      tracking: ['micro'],
    },
    classGroups: {
      'bg-image': [{ bg: ['gradient-primary', 'gradient-surface'] }],
    },
  },
})
