<script setup lang="ts">
import { computed } from 'vue'
import { useDraftsMainStore } from '../../stores/draftsMain'
import type { Hero } from '../../types/draft'
const props = defineProps<{
  hero: Hero
  allies: Hero[]
  enemies: Hero[]
}>()

const store = useDraftsMainStore()

const heroId = computed(() => props.hero.id)
const winRate = computed(() => store.heroWinRates.get(heroId.value) ?? 50)
const benchmarks = computed(() => store.heroBenchmarksCache[heroId.value])
const detail = computed(() => store.heroDetailCache[heroId.value] ?? null)

const heroRoleClass = computed(() => {
  const roles = props.hero.roles
  const name = props.hero.name.replace(/^npc_dota_hero_/, '')
  
  if (roles.includes('Carry')) return 'carry'
  if (name.includes('shaker') || name.includes('rubick') || name.includes('crystal_maiden') || name.includes('witch_doctor') || roles.includes('Support')) return 'support'
  if (name.includes('storm') || name.includes('puck') || name.includes('invoker') || name.includes('queen') || name.includes('zuus')) return 'mid'
  if (name.includes('axe') || name.includes('tide') || name.includes('centaur') || name.includes('legion') || roles.includes('Initiator')) return 'offlane'
  return 'core'
})

const laningTip = computed(() => {
  const role = heroRoleClass.value
  if (role === 'carry') {
    return `Focus purely on last-hits. Secure your lane farm, buy cheap stat items (Bracer/Wraith Band) and basic boots. Avoid early trades.`
  }
  if (role === 'mid') {
    return `Secure early Bottle, control active runes, and use spells to secure ranged creeps while harassing the opponent. Hit level 6 ASAP.`
  }
  if (role === 'offlane') {
    return `Harass the enemy carry, contest pull camps, and prevent easy farm. Buy early armor/aura components (Bracer, Helm, Phase Boots).`
  }
  return `Harass enemies with auto-attacks and spells. Stack and pull camps, block enemy pulls, and secure active runes for your midlaner.`
})

const midgameTip = computed(() => {
  const role = heroRoleClass.value
  if (role === 'carry') {
    return `Aim to finish your farming item (Battle Fury / Maelstrom / Diffusal) by 14-16 minutes. Move to jungle if the lane is unsafe.`
  }
  if (role === 'mid') {
    return `Time your first major active item (Blink, Orchid, or Witch Blade) by 12-15 minutes. Control power runes and lead smoke ganks.`
  }
  if (role === 'offlane') {
    return `Get your core initiation/aura item (Blink or Pipe/Vanguard) by 12-14 minutes. Group up with supports to take the safe lane tower.`
  }
  return `Obtain utility items (Arcane Boots, Glimmer, or Force Staff) by 15-18 minutes. Keep key map zones warded and stay behind cores.`
})

const endgameTip = computed(() => {
  const role = heroRoleClass.value
  if (role === 'carry') {
    return `Aim for critical combat items (BKB, Manta, or Daedalus) by 25-30 minutes. Always secure Roshan/Aegis before pushing high ground.`
  }
  if (role === 'mid') {
    return `Buy BKB, Linken's, or Shiva's to survive in fights. Focus down enemy backline supports and control teamfight tempo.`
  }
  if (role === 'offlane') {
    return `Buy team aurashields or extensions (Shiva's, BKB, Assault Cuirass) by 25-30 minutes. Lead sieges, soak damage, and lock down targets.`
  }
  return `Secure late-game survival (Aeon Disk, Lotus, or Eul's). Stay out of enemy vision, use smokes, and control vision around Roshan.`
})

// Item build from OpenDota popularity
const itemBuild = computed(() => {
  const pop = store.itemPopularityByHero[heroId.value]
  const consts = store.openDotaItems
  if (pop && Object.keys(consts).length > 0) {
    const map = (buckets: { itemId: number; count: number }[], limit = 6) =>
      buckets.slice(0, limit)
        .map(b => consts[b.itemId])
        .filter(Boolean)
        .map(i => ({ name: i!.displayName, img: i!.imageUrl, cost: i!.cost }))
    const starting = map(pop.starting, 6)
    const early = map(pop.early, 6)
    const core = map(pop.mid, 6)
    const late = map(pop.late, 5)
    if (starting.length + core.length > 0) return { starting, early, core, late }
  }
  // Static fallback
  const CDN = (s: string) => `https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/items/${s}.png`
  const r = props.hero.roles
  if (r.includes('Carry')) return {
    starting: [{ name: 'Tango', img: CDN('tango'), cost: 90 }, { name: 'Quelling Blade', img: CDN('quelling_blade'), cost: 200 }, { name: 'Wraith Band', img: CDN('wraith_band'), cost: 525 }],
    early: [{ name: 'Power Treads', img: CDN('power_treads'), cost: 1400 }],
    core: [{ name: 'Battle Fury', img: CDN('bfury'), cost: 4100 }, { name: 'Manta Style', img: CDN('manta'), cost: 4000 }, { name: 'BKB', img: CDN('black_king_bar'), cost: 4050 }],
    late: [{ name: 'Butterfly', img: CDN('butterfly'), cost: 4975 }, { name: 'Abyssal Blade', img: CDN('abyssal_blade'), cost: 6250 }],
  }
  if (r.includes('Support')) return {
    starting: [{ name: 'Tango', img: CDN('tango'), cost: 90 }, { name: 'Salve', img: CDN('flask'), cost: 100 }, { name: 'Clarity', img: CDN('clarity'), cost: 50 }],
    early: [{ name: 'Boots', img: CDN('boots'), cost: 500 }],
    core: [{ name: 'Arcane Boots', img: CDN('arcane_boots'), cost: 1300 }, { name: 'Glimmer Cape', img: CDN('glimmer_cape'), cost: 1950 }, { name: 'Force Staff', img: CDN('force_staff'), cost: 2200 }],
    late: [{ name: 'Scythe of Vyse', img: CDN('sheepstick'), cost: 5675 }, { name: "Aghs", img: CDN('ultimate_scepter'), cost: 4200 }],
  }
  return {
    starting: [{ name: 'Tango', img: CDN('tango'), cost: 90 }, { name: 'Bracer', img: CDN('bracer'), cost: 525 }],
    early: [{ name: 'Phase Boots', img: CDN('phase_boots'), cost: 1500 }],
    core: [{ name: 'Blink Dagger', img: CDN('blink'), cost: 2250 }, { name: 'BKB', img: CDN('black_king_bar'), cost: 4050 }, { name: 'Blade Mail', img: CDN('blade_mail'), cost: 2200 }],
    late: [{ name: "Shiva's Guard", img: CDN('shivas_guard'), cost: 4750 }, { name: 'Heart', img: CDN('heart'), cost: 5000 }],
  }
})

// Impact metrics from roles
const metrics = computed(() => {
  const r = props.hero.roles
  const a = props.hero.primaryAttr
  return {
    survivability: r.includes('Durable') ? 90 : a === 'str' ? 70 : 40,
    lane: r.includes('Pusher') || r.includes('Nuker') ? 80 : 50,
    teamfight: r.includes('Initiator') || r.includes('Disabler') ? 85 : 55,
    scaling: r.includes('Carry') ? 95 : r.includes('Support') ? 30 : 60,
    burst: r.includes('Nuker') ? 90 : 40,
  }
})

// Radar chart
const radarPoints = computed(() => {
  const m = metrics.value
  const vals = [m.survivability, m.scaling, m.burst, m.teamfight, m.lane]
  return vals.map((v, i) => {
    const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2
    const dist = (v / 100) * 38
    return `${50 + dist * Math.cos(angle)},${50 + dist * Math.sin(angle)}`
  }).join(' ')
})

const strokeDasharray = computed(() => {
  const c = Math.PI * 2 * 45
  return `${(winRate.value / 100) * c} ${c}`
})

const attrLabel = (a: string) => ({ str: 'STR', agi: 'AGI', int: 'INT' }[a] ?? 'UNI')
</script>

<template>
<div class="hbv">
  <!-- LEFT: Hero info -->
  <div class="hbv-left">
    <div class="hero-portrait-wrap">
      <img :src="hero.imageUrl" :alt="hero.localizedName" class="hero-portrait-img" />
      <div class="hero-portrait-gradient" />
      <div class="hero-name-over">
        <div class="hero-localized">{{ hero.localizedName }}</div>
        <div class="hero-attr-row">
          <span class="role-tag" :class="hero.primaryAttr">{{ attrLabel(hero.primaryAttr) }}</span>
          <span class="role-tag" v-for="r in hero.roles.slice(0,2)" :key="r">{{ r }}</span>
        </div>
      </div>
    </div>

    <div class="info-block timings-block">
      <div class="info-label">GAMEPLAY TIMINGS</div>
      <div class="timing-stage">
        <div class="stage-title laning">Laning Stage <span class="stage-time">0–10m</span></div>
        <div class="stage-desc">{{ laningTip }}</div>
      </div>
      <div class="timing-stage">
        <div class="stage-title midgame">Mid Game Spike <span class="stage-time">10–25m</span></div>
        <div class="stage-desc">{{ midgameTip }}</div>
      </div>
      <div class="timing-stage">
        <div class="stage-title endgame">Late Game Execution <span class="stage-time">25m+</span></div>
        <div class="stage-desc">{{ endgameTip }}</div>
      </div>
    </div>
  </div>

  <!-- CENTER: Item build -->
  <div class="hbv-center">
    <div class="section-hdr">
      <div class="section-line" /><h2 class="section-ttl">ITEM BUILD</h2>
    </div>

    <div class="build-card">
      <div class="build-phase" v-if="itemBuild.starting.length">
        <div class="phase-hdr">STARTING</div>
        <div class="item-row">
          <div class="item-box" v-for="it in itemBuild.starting" :key="it.name" :title="it.name">
            <img :src="it.img" :alt="it.name" />
            <div class="item-cost">{{ it.cost }}g</div>
          </div>
        </div>
      </div>

      <div class="build-phase" v-if="itemBuild.early.length">
        <div class="phase-hdr">EARLY GAME <span class="phase-time">6–14 min</span></div>
        <div class="item-row">
          <div class="item-box" v-for="it in itemBuild.early" :key="it.name" :title="it.name">
            <img :src="it.img" :alt="it.name" />
            <div class="item-cost">{{ it.cost }}g</div>
          </div>
        </div>
      </div>

      <div class="build-phase" v-if="itemBuild.core.length">
        <div class="phase-hdr">CORE <span class="phase-time">20–30 min</span></div>
        <div class="item-row">
          <div class="item-box" v-for="it in itemBuild.core" :key="it.name" :title="it.name">
            <img :src="it.img" :alt="it.name" />
            <div class="item-cost">{{ it.cost }}g</div>
          </div>
        </div>
      </div>

      <div class="build-phase" v-if="itemBuild.late.length">
        <div class="phase-hdr">LATE GAME <span class="phase-time">35+ min</span></div>
        <div class="item-row">
          <div class="item-box" v-for="it in itemBuild.late" :key="it.name" :title="it.name">
            <img :src="it.img" :alt="it.name" />
            <div class="item-cost">{{ it.cost }}g</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- RIGHT: Build Impact -->
  <div class="hbv-right">
    <div class="section-hdr right-align">
      <h2 class="section-ttl">BUILD IMPACT</h2>
    </div>

    <div class="impact-card">
      <div class="donut-wrap">
        <svg viewBox="0 0 100 100" class="donut-svg">
          <circle cx="50" cy="50" r="45" fill="none" stroke="#1e293b" stroke-width="8" />
          <circle cx="50" cy="50" r="45" fill="none" stroke="#eab308" stroke-width="8"
            stroke-linecap="round" :stroke-dasharray="strokeDasharray"
            stroke-dashoffset="0" transform="rotate(-90 50 50)" />
        </svg>
        <div class="donut-txt">
          <div class="donut-val">{{ winRate.toFixed(0) }}%</div>
          <div class="donut-lbl">WIN RATE</div>
        </div>
      </div>

      <div class="bench-row" v-if="benchmarks">
        <div class="bench-item"><div class="bench-val">{{ benchmarks.gpm }}</div><div class="bench-lbl">GPM</div></div>
        <div class="bench-item"><div class="bench-val">{{ benchmarks.xpm }}</div><div class="bench-lbl">XPM</div></div>
        <div class="bench-item"><div class="bench-val">{{ benchmarks.kda }}</div><div class="bench-lbl">KDA</div></div>
      </div>

      <div class="metrics-block">
        <div class="metrics-ttl">IMPACT METRICS</div>
        <div class="metric-row" v-for="[key, label, color] in [['survivability','Survivability','#22c55e'],['lane','Lane Pressure','#3b82f6'],['teamfight','Teamfight','#a855f7'],['scaling','Late-game Scaling','#eab308'],['burst','Burst Damage','#ef4444']]" :key="key">
          <span class="metric-lbl">{{ label }}</span>
          <div class="metric-bar"><div class="metric-fill" :style="{ width: metrics[key as keyof typeof metrics] + '%', background: color }" /></div>
          <span class="metric-val" :style="{ color }">{{ metrics[key as keyof typeof metrics] }}</span>
        </div>
      </div>

      <div class="radar-block">
        <div class="radar-ttl">PROFILE OVERVIEW</div>
        <svg viewBox="0 0 100 100" class="radar-svg">
          <polygon :points="[0,1,2,3,4].map(i => { const a=(Math.PI*2*i)/5-Math.PI/2; return `${50+38*Math.cos(a)},${50+38*Math.sin(a)}` }).join(' ')" fill="none" stroke="#1e293b" stroke-width="1" />
          <polygon :points="radarPoints" fill="rgba(234,179,8,0.2)" stroke="#eab308" stroke-width="1.5" />
          <text x="50" y="6" text-anchor="middle" font-size="6" fill="#64748b">Win Rate</text>
          <text x="97" y="38" text-anchor="end" font-size="6" fill="#64748b">Scaling</text>
          <text x="82" y="95" text-anchor="end" font-size="6" fill="#64748b">Burst</text>
          <text x="18" y="95" text-anchor="start" font-size="6" fill="#64748b">Teamfight</text>
          <text x="3" y="38" text-anchor="start" font-size="6" fill="#64748b">Lane</text>
        </svg>
      </div>
    </div>
  </div>
</div>
</template>

<style scoped lang="scss">
.hbv {
  display: grid;
  grid-template-columns: 220px 1fr 260px;
  gap: 16px;
  min-height: 0;
}

.hbv-left { display: flex; flex-direction: column; gap: 12px; }
.hero-portrait-wrap { position: relative; border-radius: 10px; overflow: hidden; aspect-ratio: 1/1.1; }
.hero-portrait-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.hero-portrait-gradient { position: absolute; inset: 0; background: linear-gradient(to top, #0a0e1a 30%, transparent); }
.hero-name-over { position: absolute; bottom: 10px; left: 12px; right: 12px; }
.hero-localized { font-size: 16px; font-weight: 800; color: #fff; }
.hero-attr-row { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 4px; }
.role-tag { padding: 2px 7px; border-radius: 4px; font-size: 10px; font-weight: 700; background: rgba(255,255,255,0.1); color: #94a3b8;
  &.str { background: rgba(239,68,68,0.2); color: #ef4444; }
  &.agi { background: rgba(34,197,94,0.2); color: #22c55e; }
  &.int { background: rgba(59,130,246,0.2); color: #60a5fa; }
}

.info-block { background: var(--dd-bg-card); border: 1px solid var(--dd-border); border-radius: 8px; padding: 10px 12px; }
.info-label { font-size: 10px; font-weight: 700; color: var(--dd-text-dim); letter-spacing: 0.06em; margin-bottom: 8px; }
.info-dim { font-size: 12px; color: var(--dd-text-dim); }
.timings-block {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.timing-stage {
  border-bottom: 1px solid rgba(255,255,255,0.05);
  padding-bottom: 8px;
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
}
.stage-title {
  font-size: 11px;
  font-weight: 700;
  margin-bottom: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  &.laning { color: #60a5fa; }
  &.midgame { color: #eab308; }
  &.endgame { color: #ef4444; }
}
.stage-time {
  font-size: 9px;
  background: rgba(255,255,255,0.06);
  padding: 1px 4px;
  border-radius: 3px;
  color: var(--dd-text-dim);
}
.stage-desc {
  font-size: 11px;
  line-height: 1.4;
  color: var(--dd-text-muted);
}


.hbv-center { display: flex; flex-direction: column; gap: 12px; min-width: 0; }
.section-hdr { display: flex; align-items: center; gap: 10px; &.right-align { justify-content: flex-end; } }
.section-line { flex: 1; height: 1px; background: var(--dd-border); }
.section-ttl { margin: 0; font-size: 12px; font-weight: 800; letter-spacing: 0.1em; color: var(--dd-gold); white-space: nowrap; }

.build-card { background: var(--dd-bg-card); border: 1px solid var(--dd-border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 16px; }
.build-phase {}
.phase-hdr { font-size: 11px; font-weight: 700; color: var(--dd-text-dim); letter-spacing: 0.08em; margin-bottom: 10px; }
.phase-time { color: var(--dd-gold); margin-left: 8px; font-weight: 600; }
.item-row { display: flex; flex-wrap: wrap; gap: 8px; }
.item-box { width: 56px; height: 42px; border-radius: 6px; overflow: hidden; position: relative; border: 1px solid rgba(255,255,255,0.08); cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  img { width: 100%; height: 100%; object-fit: cover; display: block; }
  &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(234,179,8,0.3); border-color: rgba(234,179,8,0.4); }
}
.item-cost { position: absolute; bottom: 1px; right: 3px; font-size: 8px; color: #eab308; font-weight: 700; text-shadow: 0 1px 2px #000; }

.hbv-right { display: flex; flex-direction: column; gap: 12px; }
.impact-card { background: var(--dd-bg-card); border: 1px solid var(--dd-border); border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.donut-wrap { position: relative; width: 120px; height: 120px; margin: 0 auto; }
.donut-svg { width: 100%; height: 100%; }
.donut-txt { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.donut-val { font-size: 22px; font-weight: 800; color: #eab308; }
.donut-lbl { font-size: 9px; color: var(--dd-text-dim); letter-spacing: 0.06em; }

.bench-row { display: flex; justify-content: space-around; }
.bench-item { text-align: center; }
.bench-val { font-size: 16px; font-weight: 700; color: var(--dd-text); }
.bench-lbl { font-size: 9px; color: var(--dd-text-dim); }

.metrics-block { display: flex; flex-direction: column; gap: 8px; }
.metrics-ttl { font-size: 10px; font-weight: 700; color: var(--dd-text-dim); letter-spacing: 0.06em; }
.metric-row { display: flex; align-items: center; gap: 6px; }
.metric-lbl { font-size: 11px; color: var(--dd-text-muted); width: 110px; flex-shrink: 0; }
.metric-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.05); border-radius: 2px; overflow: hidden; }
.metric-fill { height: 100%; border-radius: 2px; transition: width 0.4s ease; }
.metric-val { font-size: 11px; font-weight: 700; width: 28px; text-align: right; flex-shrink: 0; }

.radar-block { }
.radar-ttl { font-size: 10px; font-weight: 700; color: var(--dd-text-dim); letter-spacing: 0.06em; margin-bottom: 8px; }
.radar-svg { width: 100%; height: 140px; }
</style>
