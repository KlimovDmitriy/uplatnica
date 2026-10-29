/**
 * Replaces the WebSite/WebPage defaults of nuxt-schema-org (turned off in nuxt.config.ts).
 * Its i18n variant builds WebSite.workTranslation / translationOfWork from localePath('index'),
 * which is "/" for every language in our no_prefix setup, so the same @id was listed three
 * times (and on /en pages the site was a translation of itself). The language versions are
 * linked with hreflang in usePageSeo.ts instead.
 */
export default defineNuxtPlugin({
  name: 'uplatnica:schema-website',
  dependsOn: ['nuxt-schema-org:init', 'nuxt-schema-org:meta'],
  setup(nuxtApp) {
    const siteConfig = useSiteConfig()
    const siteUrl = useSiteUrl()
    const origin = () => siteUrl
    const websiteId = () => `${origin()}/#website`

    useSchemaOrg([
      defineWebSite({
        '@id': websiteId,
        'url': () => `${origin()}/`,
        'name': () => toValue(siteConfig.name) || '',
        'inLanguage': () => nuxtApp.$i18n.localeProperties.value.language || '',
      }),
      defineWebPage({
        isPartOf: { '@id': websiteId },
      }),
    ])
  },
})
