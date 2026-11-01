const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp']
const AVATAR_SIZE = 256

export const AVATAR_ACCEPT = ACCEPTED_TYPES.join(',')

/** A square thumbnail: any ordinary photo fits the size the API accepts. */
export async function toAvatarDataUrl(file: File): Promise<string> {
  if (!ACCEPTED_TYPES.includes(file.type)) throw new Error('Use uma imagem PNG, JPEG ou WebP.')

  const bitmap = await createImageBitmap(file).catch(() => {
    throw new Error('Não foi possível ler esta imagem.')
  })
  const side = Math.min(bitmap.width, bitmap.height)
  const canvas = document.createElement('canvas')
  canvas.width = AVATAR_SIZE
  canvas.height = AVATAR_SIZE
  canvas
    .getContext('2d')
    ?.drawImage(
      bitmap,
      (bitmap.width - side) / 2,
      (bitmap.height - side) / 2,
      side,
      side,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE,
    )
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.85)
}
