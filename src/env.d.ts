/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}

declare module '*.json' {
  const value: unknown
  export default value
}

interface ImportMetaEnv {
  /** 构建模式：development / production */
  readonly MODE: string
  /** 是否生产构建 */
  readonly PROD: boolean
  /** 是否开发构建 */
  readonly DEV: boolean
  /** 应用基础路径（vite base） */
  readonly BASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
