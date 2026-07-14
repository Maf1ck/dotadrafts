import type { MetaStatRow } from '../types/draft'

const META_UA: Record<string, { label: string; hint: string }> = {
  Matchups: {
    label: 'Матчапи',
    hint: 'Скільки пар героїв виграють протистояння',
  },
  Synergy: {
    label: 'Синергія',
    hint: 'Наскільки добре герої працюють разом у команді',
  },
  Composition: {
    label: 'Склад',
    hint: 'Повнота ролей і стилю гри (пуш, тімфайт тощо)',
  },
  'Meta Score': {
    label: 'Мета',
    hint: 'Середній винрейт піків відносно патчу',
  },
  'Item Builds': {
    label: 'Білди',
    hint: 'Вплив предметів зі sandbox на шанс перемоги',
  },
}

export function metaLabelUa(key: string): string {
  return META_UA[key]?.label ?? key
}

export function metaHintUa(key: string): string {
  return META_UA[key]?.hint ?? ''
}

export function translateMetaRows(rows: MetaStatRow[]) {
  return rows.map((row) => ({
    ...row,
    labelUa: metaLabelUa(row.label),
    hintUa: metaHintUa(row.label),
  }))
}
