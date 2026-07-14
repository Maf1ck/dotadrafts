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
  type LucideIcon,
} from '@lucide/vue'

const { t } = useI18n()

useHead(computed(() => ({
  title: t('seo.about.title'),
  meta: [{ name: 'description', content: t('seo.about.description') }]
})))

const features: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Zap,
    title: 'Live Draft Engine',
    desc: 'Real-time win probability calculation as you draft heroes. Every pick shifts the advantage meter instantly.',
  },
  {
    icon: Brain,
    title: 'Smart Recommendations',
    desc: 'AI-powered hero suggestions based on synergy, counters, role coverage, and current meta performance.',
  },
  {
    icon: BarChart3,
    title: 'Meta Statistics',
    desc: 'Up-to-date win rates, pick rates and tier lists sourced from millions of Immortal and Divine bracket matches.',
  },
  {
    icon: Target,
    title: 'Counter Analysis',
    desc: 'Identify critical threats in the enemy lineup and find the optimal picks to neutralise them.',
  },
  {
    icon: Layers,
    title: 'Hero Pool Filter',
    desc: 'Restrict recommendations to your personal hero pool — practice only the heroes you actually know.',
  },
  {
    icon: Globe,
    title: 'Multilingual',
    desc: 'Full support for English, Ukrainian, and Russian — switch language any time from the header.',
  },
]

const techStack = [
  { name: 'Vue 3', color: '#42b883' },
  { name: 'TypeScript', color: '#3178c6' },
  { name: 'Pinia', color: '#f7c948' },
  { name: 'Vue Router', color: '#ef4444' },
  { name: 'Vite', color: '#a78bfa' },
  { name: 'OpenDota API', color: '#e5b53b' },
]
</script>

<template lang="pug">
.about-page
  //- ── Hero Banner ──
  .about-hero
    .about-hero-inner
      span.subtitle-tag ABOUT THE PROJECT
      h1.hero-title DOTA DRAFTS
      p.hero-lead
        | The ultimate open-source Dota 2 draft assistant — analyse team compositions,
        | calculate win probability and get intelligent hero recommendations in real time.
      a.cta-btn(href="/" )
        span Open Draft Simulator
        ArrowRight(:size="16" :stroke-width="2.5")

  //- ── Feature Grid ──
  .section
    .section-header
      h2.section-title WHAT IT DOES
      p.section-sub A toolkit built for Dota 2 players who take drafting seriously.

    .features-grid
      .feature-card(v-for="f in features" :key="f.title")
        .feature-icon
          component(:is="f.icon" :size="22" :stroke-width="2")
        .feature-body
          h3.feature-title {{ f.title }}
          p.feature-desc {{ f.desc }}

  //- ── How It Works ──
  .section
    .section-header
      h2.section-title HOW IT WORKS
    .steps
      .step
        .step-num 01
        .step-body
          h3.step-title Set Up the Draft
          p.step-desc Pick heroes for both Radiant and Dire using the interactive draft board. Add bans, choose positions and fill in whatever is already known.
      .step
        .step-num 02
        .step-body
          h3.step-title Read the Prediction
          p.step-desc The engine instantly evaluates synergies, counter-matchups, role fitness and meta win rates to calculate a live win probability.
      .step
        .step-num 03
        .step-body
          h3.step-title Follow Recommendations
          p.step-desc The Recommendation Panel lists the highest-scored next picks for the advising team. One click to add any suggestion to the board.
      .step
        .step-num 04
        .step-body
          h3.step-title Explore Meta
          p.step-desc Head to the Heroes or Meta pages to study tier lists, individual hero stats and critical counter relationships.

  //- ── Tech Stack ──
  .section
    .section-header
      h2.section-title BUILT WITH
    .tech-chips
      .tech-chip(v-for="t in techStack" :key="t.name" :style="{ borderColor: t.color + '44', color: t.color, background: t.color + '11' }")
        span {{ t.name }}

  //- ── Author Card ──
  .section
    .author-card
      .author-avatar @
      .author-info
        p.author-by Developed by
        h3.author-handle @zxcmaf1ck
        p.author-desc Open-source Dota 2 tooling enthusiast. Pull requests and issue reports welcome on GitHub.
      .author-links
        a.author-link(href="https://github.com" target="_blank" rel="noopener")
          svg(width="20" height="20" viewBox="0 0 24 24" fill="currentColor")
            path(d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z")

  //- ── Footer ──
  footer.about-footer
    .footer-logo
      span.logo-dota DOTA
      span.logo-drafts DRAFTS
    p.footer-copy © 2026 DOTADRAFTS. All rights reserved.
</template>

<style lang="scss" scoped>
.about-page {
  color: var(--dd-text);
  font-family: var(--dd-font, 'Outfit', sans-serif);
}

// ── Hero Banner
.about-hero {
  min-height: 60vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99, 102, 241, 0.12) 0%, transparent 70%),
              radial-gradient(ellipse 40% 40% at 80% 30%, rgba(229, 181, 59, 0.06) 0%, transparent 60%),
              var(--dd-bg, #080b10);
  border-bottom: 1px solid var(--dd-border, rgba(255,255,255,0.06));
  padding: 80px 24px 60px;
}

.about-hero-inner {
  max-width: 680px;
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
  font-size: clamp(42px, 8vw, 72px);
  font-weight: 900;
  letter-spacing: -2px;
  margin: 0 0 16px;
  background: linear-gradient(135deg, #ffffff 0%, #a5b4fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.05;
}

.hero-lead {
  font-size: 17px;
  line-height: 1.7;
  color: var(--dd-text-dim, #9ca3af);
  max-width: 580px;
  margin: 0 auto 32px;
}

.cta-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #e5b53b, #d4a82a);
  color: #000;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.04em;
  border-radius: 8px;
  text-decoration: none;
  transition: transform 0.15s, box-shadow 0.15s;
  box-shadow: 0 0 30px rgba(229,181,59,0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(229,181,59,0.35);
  }
}

// ── Sections
.section {
  max-width: 1100px;
  margin: 0 auto;
  padding: 72px 24px;
  border-bottom: 1px solid rgba(255,255,255,0.04);

  &:last-of-type {
    border-bottom: none;
  }
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
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

// ── Features
.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.feature-card {
  display: flex;
  gap: 16px;
  padding: 24px;
  background: var(--dd-bg-card, #0f151f);
  border: 1px solid var(--dd-border, rgba(255,255,255,0.07));
  border-radius: 12px;
  transition: border-color 0.2s, transform 0.2s;

  &:hover {
    border-color: rgba(229,181,59,0.3);
    transform: translateY(-3px);
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

// ── Steps
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
  color: rgba(229,181,59,0.18);
  line-height: 1;
  flex-shrink: 0;
  font-family: 'Outfit', sans-serif;
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

// ── Tech Chips
.tech-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
}

.tech-chip {
  padding: 10px 22px;
  border-radius: 40px;
  border: 1px solid;
  font-weight: 700;
  font-size: 14px;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.05);
  }
}

// ── Author Card
.author-card {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 32px;
  background: var(--dd-bg-card, #0f151f);
  border: 1px solid var(--dd-border, rgba(255,255,255,0.07));
  border-radius: 16px;
  flex-wrap: wrap;
}

.author-avatar {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #a855f7);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 900;
  color: #fff;
  flex-shrink: 0;
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
}

.author-links {
  display: flex;
  gap: 12px;
}

.author-link {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--dd-text-dim, #9ca3af);
  transition: color 0.15s, border-color 0.15s, background 0.15s;

  &:hover {
    color: #fff;
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.07);
  }
}

// ── Footer
.about-footer {
  max-width: 1100px;
  margin: 0 auto;
  padding: 40px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  border-top: 1px solid rgba(255,255,255,0.04);
}

.footer-logo {
  display: flex;
  align-items: baseline;
  gap: 2px;
  font-weight: 900;
  font-size: 18px;
  letter-spacing: 1px;
}

.logo-dota {
  color: var(--dd-gold, #e5b53b);
}

.logo-drafts {
  color: #fff;
}

.footer-copy {
  font-size: 12px;
  color: var(--dd-text-muted, #6b7280);
  margin: 0;
}
</style>
