<script setup lang="ts">
/**
 * The only page. "/" is the blank generator; "/<template>" is the same page with a ready-made
 * slip, "/<tool>" opens that tool first. Each variant has its own title and description.
 */
import { findTemplate, referenceRule } from '~/data/templates'
import { findInfoPage } from '~/data/pages'
import { FAQ, TOOLS, findTool } from '~/data/tools'
import PrivacyPolicy from '~/components/PrivacyPolicy.vue'

// A fresh page per URL, so everything below is set up once for its slug. The language prefix is not
// part of the key: switching language keeps the page, and with it the slip being edited.
definePageMeta({ key: route => splitLangPrefix(route.path).path })

const route = useRoute()
const { t, localeProperties } = useI18n()
const pageUrl = usePageUrl()
const l = useLocalized()

const slug = String(route.params.slug ?? '')
const template = slug ? findTemplate(slug) : undefined
const tool = slug ? findTool(slug) : undefined
const info = slug ? findInfoPage(slug) : undefined
const INFO_COMPONENTS = { PrivacyPolicy }
if (slug && !template && !tool && !info) throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

const active = ref(template?.payments[0]?.id ?? '')
const payment = computed(() => template?.payments.find(p => p.id === active.value))

const title = () => (template ? l(template.title) : tool ? t(`${tool.prefix}.title`) : info ? t(`${info.prefix}.title`) : t('hero.title'))

usePageSeo({
  // The "| IPS QR" suffix only where there is a slip (portal-only documents keep the plain title)
  // and only while the title stays within ~60 characters, which is what search results show.
  title: () => {
    if (!template) return tool ? t(`${tool.prefix}.metaTitle`) : info ? t(`${info.prefix}.metaTitle`) : t('meta.title')
    const plain = l(template.title)
    const full = t('templatesPage.metaTitle', { title: plain })
    return template.payments.length && full.length <= 60 ? full : plain
  },
  description: () => (template ? l(template.metaDescription) : tool ? t(`${tool.prefix}.metaDescription`) : info ? t(`${info.prefix}.metaDescription`) : t('meta.description')),
  breadcrumb: slug ? title : undefined,
})

const faq = tool
  ? tool.faq.map(k => ({ q: `${tool.prefix}.faq.${k}.q`, a: `${tool.prefix}.faq.${k}.a` }))
  : template || info ? [] : FAQ.map(k => ({ q: `faq.${k}.q`, a: `faq.${k}.a` }))

useSchemaOrg([
  defineWebPage({ '@type': faq.length ? ['WebPage', 'FAQPage'] : 'WebPage' }),
  ...(slug
    ? []
    : [defineSoftwareApp({
        name: () => t('meta.appName'),
        description: () => t('meta.description'),
        url: () => pageUrl(splitLangPrefix(route.path).code, '/'),
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: () => localeProperties.value.language,
        isAccessibleForFree: true,
        offers: { price: 0, priceCurrency: 'RSD' },
        author: { '@id': `${useSiteUrl()}/#author` },
      })]),
  ...faq.map(f => defineQuestion({ name: () => t(f.q), acceptedAnswer: () => t(f.a) })),
])
</script>

<template>
  <div class="container page">
    <header class="no-print intro">
      <p
        v-if="template"
        class="back"
      >
        <LangLink to="/">
          ← {{ t('templatesPage.blank') }}
        </LangLink>
      </p>
      <h1>{{ title() }}</h1>
      <p
        v-if="tool"
        class="lead"
      >
        {{ t(`${tool.prefix}.lead`) }}
      </p>
      <template v-else-if="!template && !info">
        <p class="lead">
          {{ t('hero.lead') }}
        </p>
        <p class="blank">
          <a href="#generator">{{ t('hero.blankLink') }}</a>
        </p>
      </template>
    </header>

    <component
      :is="INFO_COMPONENTS[info.component]"
      v-if="info"
      class="no-print"
    />

    <template v-else>
      <ToolSection
        v-if="tool"
        class="no-print"
        :tool="tool"
        focus
      />
      <!-- Tool pages: both slots right below the tool's result card. -->
      <template v-if="tool">
        <AdSlot name="after-slip" />
        <AdSlot name="content" />
      </template>

      <TemplatePicker
        v-if="!template"
        class="no-print"
      />

      <TemplateDetails
        v-if="template"
        v-model="active"
        class="no-print"
        :template="template"
      />

      <SlipGenerator
        v-if="!template || payment"
        id="generator"
        :preset="payment?.preset"
        :reference-rule="referenceRule(payment)"
        :persist="!template"
        :ads="!tool"
      />

      <SlipHowTo
        v-if="template"
        class="no-print"
        :template="template"
      />

      <TemplateSources
        v-if="template"
        class="no-print"
        :template="template"
      />

      <AdSlot
        v-if="!tool"
        name="content"
      />

      <TemplatePicker
        v-if="template"
        class="no-print"
        :current="template.slug"
        more
      />

      <div class="tools card no-print">
        <ToolSection
          v-for="other in TOOLS.filter(x => x !== tool)"
          :key="other.slug"
          :tool="other"
        />
      </div>

      <SlipHowTo
        v-if="!slug"
        class="no-print"
      />

      <FaqSection
        v-if="!slug"
        class="no-print"
        :keys="FAQ"
      />
    </template>
  </div>
</template>

<style scoped>
.intro > :last-child { margin-bottom: 0; }
.intro .lead { margin: 0; }
.back { margin: 0 0 var(--s-2); font-size: var(--fs-sm); }
.blank { margin: var(--s-3) 0 0; }
.back a, .blank a { display: inline-flex; align-items: center; min-height: 24px; }
</style>
