/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'on' to read pasted lists with Claude via /api/parse-order. Anything else: rule-based only. */
  readonly VITE_AI_PARSING?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
