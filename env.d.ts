/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_STRATZ_API_KEY: string
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
