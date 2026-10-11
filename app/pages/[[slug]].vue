<script setup lang="ts">
/**
 * The only page. "/" is the blank generator; "/<template>" is the same page with a ready-made
 * slip, "/<tool>" opens that tool first. Each variant has its own title and description.
 */
import { findTemplate } from '~/data/templates'
import { FAQ, TOOLS, findTool } from '~/data/tools'

// A fresh page per URL, so everything below is set up once for its slug. The language prefix is not
// part of the key: switching language keeps the page, and with it the slip being edited.
definePageMeta({ key: route => splitLangPrefix(route.path).path })

const route = useRoute()
const { t, locale } = useI18n()
const l = useLocalized()

const slug = String(route.params.slug ?? '')
const template = slug ? findTemplate(slug) : undefined
const tool = slug ? findTool(slug) : undefined
if (slug && !template && !tool) throw createError({ statusCode: 404, statusMessage: 'Not found', fatal: true })

const active = ref(template?.payments[0]?.id ?? '')
const payment = computed(() => template?.payments.find(p => p.id === active.value))

const title = () => (template ? l(template.title) : tool ? t(`${tool.prefix}.title`) : t('hero.title'))

usePageSeo({
  // "Filled slip with IPS QR" only where there is a slip; portal-only documents keep the plain title.
  title: () => (template
    ? template.payments.length ? t('templatesPage.metaTitle', { title: l(template.title) }) : l(template.title)
    : tool ? t(`${tool.prefix}.metaTitle`) : t('meta.title')),
  description: () => (template ? l(template.metaDescription) : tool ? t(`${tool.prefix}.metaDescription`) : t('meta.description')),
  breadcrumb: slug ? [{ name: title }] : undefined,
})

const faq = tool
  ? tool.faq.map(k => ({ q: `${tool.prefix}.faq.${k}.q`, a: `${tool.prefix}.faq.${k}.a` }))
  : template ? [] : FAQ.map(k => ({ q: `faq.${k}.q`, a: `faq.${k}.a` }))

useSchemaOrg([
  defineWebPage({ '@type': faq.length ? ['WebPage', 'FAQPage'] : 'WebPage' }),
  ...(slug
    ? []
    : [defineSoftwareApp({
        name: () => t('meta.appName'),
        applicationCategory: 'FinanceApplication',
        operatingSystem: 'Web',
        inLanguage: () => locale.value,
        offers: { price: 0, priceCurrency: 'RSD' },
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
      <template v-else-if="!template">
        <p class="lead">
          {{ t('hero.lead') }}
        </p>
        <p class="blank">
          <a href="#generator">{{ t('hero.blankLink') }}</a>
        </p>
      </template>
    </header>

    <ToolSection
      v-if="tool"
      class="no-print"
      :tool="tool"
      focus
    />

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
      :persist="!template"
    />

    <TemplateSources
      v-if="template"
      class="no-print"
      :template="template"
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

    <FaqSection
      v-if="!slug"
      class="no-print"
      :keys="FAQ"
    />
  </div>
</template>

<style scoped>
.intro > :last-child { margin-bottom: 0; }
.intro .lead { margin: 0; }
.back { margin: 0 0 var(--s-2); font-size: var(--fs-sm); }
.blank { margin: var(--s-3) 0 0; }
.back a, .blank a { display: inline-flex; align-items: center; min-height: 24px; }
</style>
