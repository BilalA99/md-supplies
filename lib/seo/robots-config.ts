import type { MetadataRoute } from 'next'
import { SITE_URL } from './constants'
import { STAGING_GUARD } from './robots'

export function getRobotsConfig(isStaging: boolean = STAGING_GUARD): MetadataRoute.Robots {
  if (isStaging) {
    return { rules: { userAgent: '*', disallow: '/' } }
  }
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/account/', '/cart', '/search', '/internal/'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
