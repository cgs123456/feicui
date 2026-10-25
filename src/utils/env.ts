/**
 * 运行模式开关：VITE_USE_MOCK 未设置或 'true' 时走本地 mock（localStorage + 内存），
 * 显式设为 'false' 时走 server/ 后端（需要 VITE_API_BASE_URL=/api + vite proxy 或同源部署）。
 * 默认 mock 保证现有开发/测试/e2e 行为零变化。
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'
