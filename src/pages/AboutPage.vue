<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { useHead } from '@vueuse/head'
import {
  Zap,
  Brain,
  BarChart3,
  Target,
  Layers,
  Globe,
  ArrowRight,
  Package,
} from '@lucide/vue'

const { t } = useI18n()

useHead(
  computed(() => ({
    title: t('seo.about.title'),
    meta: [{ name: 'description', content: t('seo.about.description') }],
  })),
)

const featureKeys = [
  { icon: Zap, key: 'draft' },
  { icon: Brain, key: 'recs' },
  { icon: Package, key: 'builds' },
  { icon: BarChart3, key: 'meta' },
  { icon: Target, key: 'counters' },
  { icon: Layers, key: 'pool' },
  { icon: Globe, key: 'i18n' },
] as const
</script>

<template lang="pug">
.about-page
  .about-hero
    .about-hero-inner
      span.subtitle-tag {{ t('about.tag') }}
      h1.hero-title DOTA DRAFTS
      p.hero-lead {{ t('about.lead') }}
      .cta-row
        router-link.cta-btn(to="/draft")
          span {{ t('about.ctaDraft') }}
          ArrowRight(:size="16" :stroke-width="2.5")
        router-link.cta-btn.secondary(to="/sandbox")
          span {{ t('about.ctaBuilds') }}

  .section
    .section-header
      h2.section-title {{ t('about.whatTitle') }}
      p.section-sub {{ t('about.whatSub') }}
    .story
      p {{ t('about.story1') }}
      p {{ t('about.story2') }}
      p {{ t('about.story3') }}

  .section
    .section-header
      h2.section-title {{ t('about.featuresTitle') }}
      p.section-sub {{ t('about.featuresSub') }}
    .features-grid
      .feature-card(v-for="f in featureKeys" :key="f.key")
        .feature-icon
          component(:is="f.icon" :size="22" :stroke-width="2")
        .feature-body
          h3.feature-title {{ t(`about.feat.${f.key}.title`) }}
          p.feature-desc {{ t(`about.feat.${f.key}.desc`) }}

  .section
    .section-header
      h2.section-title {{ t('about.howTitle') }}
    .steps
      .step(v-for="n in 4" :key="n")
        .step-num {{ String(n).padStart(2, '0') }}
        .step-body
          h3.step-title {{ t(`about.step${n}.title`) }}
          p.step-desc {{ t(`about.step${n}.desc`) }}

  .section
    .author-card
      a.author-avatar(
        href="https://t.me/zxcmaf1ck"
        target="_blank"
        rel="noopener"
        :aria-label="t('about.telegram')"
      )
        svg(width="32" height="32" viewBox="0 0 24 24" fill="currentColor")
          path(d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z")
      .author-info
        p.author-by {{ t('about.developedBy') }}
        h3.author-handle @zxcmaf1ck
        p.author-desc {{ t('about.authorDesc') }}
      .author-links
        a.author-link(
          href="https://t.me/zxcmaf1ck"
          target="_blank"
          rel="noopener"
          :title="t('about.telegram')"
        )
          svg(width="20" height="20" viewBox="0 0 24 24" fill="currentColor")
            path(d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z")
        a.author-link(href="https://github.com" target="_blank" rel="noopener" title="GitHub")
          svg(width="20" height="20" viewBox="0 0 24 24" fill="currentColor")
            path(d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z")
</template>

<style lang="scss" scoped>
.about-page {
  color: var(--dd-text);
  font-family: var(--dd-font, 'Outfit', sans-serif);
}

.about-hero {
  min-height: 52vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(ellipse 70% 55% at 50% 0%, rgba(229, 181, 59, 0.1) 0%, transparent 65%),
    radial-gradient(ellipse 35% 40% at 85% 40%, rgba(61, 214, 140, 0.05) 0%, transparent 55%),
    var(--dd-bg, #080b10);
  border-bottom: 1px solid var(--dd-border, rgba(255, 255, 255, 0.06));
  padding: 72px 24px 56px;
}

.about-hero-inner {
  max-width: 720px;
  text-align: center;
}

.subtitle-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 2px;
  color: var(--dd-gold, #e5b53b);
  text-transform: uppercase;
  margin-bottom: 16px;
}

.hero-title {
  font-size: clamp(40px, 8vw, 68px);
  font-weight: 900;
  letter-spacing: -2px;
  margin: 0 0 16px;
  background: linear-gradient(135deg, #ffffff 0%, #e5b53b 120%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.05;
}

.hero-lead {
  font-size: 17px;
  line-height: 1.7;
  color: var(--dd-text-dim, #9ca3af);
  max-width: 600px;
  margin: 0 auto 28px;
}

.cta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #e5b53b, #d4a82a);
  color: #000;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.04em;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 0 28px rgba(229, 181, 59, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 28px rgba(229, 181, 59, 0.35);
  }

  &.secondary {
    background: transparent;
    color: var(--dd-text);
    border: 1px solid var(--dd-border);
    box-shadow: none;

    &:hover {
      border-color: rgba(229, 181, 59, 0.45);
      color: var(--dd-gold);
    }
  }
}

.section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 64px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);

  &:last-of-type {
    border-bottom: none;
  }
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-title {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 3px;
  color: var(--dd-gold, #e5b53b);
  text-transform: uppercase;
  margin: 0 0 8px;
}

.section-sub {
  font-size: 15px;
  color: var(--dd-text-dim, #9ca3af);
  margin: 0;
}

.story {
  max-width: 720px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 14px;

  p {
    margin: 0;
    font-size: 15px;
    line-height: 1.7;
    color: var(--dd-text-muted, #b0b7c3);
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.feature-card {
  display: flex;
  gap: 16px;
  padding: 22px;
  background: var(--dd-bg-card, #0f151f);
  border: 1px solid var(--dd-border, rgba(255, 255, 255, 0.07));
  border-radius: 12px;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    border-color: rgba(229, 181, 59, 0.3);
    transform: translateY(-2px);
  }
}

.feature-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(229, 181, 59, 0.12);
  color: var(--dd-gold, #e5b53b);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.feature-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.feature-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--dd-text-dim, #9ca3af);
  margin: 0;
}

.steps {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 24px;
}

.step {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.step-num {
  font-size: 36px;
  font-weight: 900;
  color: rgba(229, 181, 59, 0.18);
  line-height: 1;
  flex-shrink: 0;
}

.step-title {
  font-size: 15px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 6px;
}

.step-desc {
  font-size: 13px;
  line-height: 1.6;
  color: var(--dd-text-dim, #9ca3af);
  margin: 0;
}

.author-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 28px;
  background: var(--dd-bg-card, #0f151f);
  border: 1px solid var(--dd-border, rgba(255, 255, 255, 0.07));
  border-radius: 16px;
  flex-wrap: wrap;
}

.author-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #2aabee, #229ed9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
  text-decoration: none;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.04);
  }
}

.author-info {
  flex: 1;
  min-width: 200px;
}

.author-by {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--dd-text-muted, #6b7280);
  margin: 0 0 2px;
  text-transform: uppercase;
}

.author-handle {
  font-size: 22px;
  font-weight: 800;
  color: #fff;
  margin: 0 0 6px;
}

.author-desc {
  font-size: 13px;
  color: var(--dd-text-dim, #9ca3af);
  margin: 0;
  line-height: 1.5;
}

.author-links {
  display: flex;
  gap: 12px;
}

.author-link {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dd-text-dim, #9ca3af);
  transition: color 0.15s, border-color 0.15s, background 0.15s;

  &:hover {
    color: #fff;
    border-color: rgba(42, 171, 238, 0.45);
    background: rgba(42, 171, 238, 0.12);
  }
}
</style>
