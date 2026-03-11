import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'STELAR | The Social Architect System',
    short_name: 'STELAR',
    description: 'Personal Social Midia by Tobias Estivalete',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#000000',
    icons: [
      {
        src: '/icon.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  }
}
