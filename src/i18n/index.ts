import { createI18n } from 'vue-i18n'
import en from './locales/en'
import uk from './locales/uk'
import ru from './locales/ru'

const STORAGE_KEY = 'dd-locale'

const savedLocale = localStorage.getItem(STORAGE_KEY)
const defaultLocale =
  savedLocale && ['en', 'uk', 'ru'].includes(savedLocale) ? savedLocale : 'uk'

const i18n = createI18n({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: { en, uk, ru },
})

export function setLocale(lang: 'en' | 'uk' | 'ru') {
  i18n.global.locale.value = lang
  localStorage.setItem(STORAGE_KEY, lang)
  document.documentElement.lang = lang
}

export type AppLocale = 'en' | 'uk' | 'ru'
export const LOCALES: { code: AppLocale; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'uk', label: 'UK' },
  { code: 'ru', label: 'RU' },
]

export default i18n
