/**
 * Central logging — no raw console.log in app code.
 * 统一日志封装；开发环境输出 debug，错误始终上报。
 */

const DEV = import.meta.env.DEV

export const logger = {
  /**
   * 调试信息（仅开发环境）/ Debug logs (development only)
   */
  debug: (...args: unknown[]) => {
    if (DEV) {
      console.debug('[shopify-html-builder]', ...args)
    }
  },

  /**
   * 错误信息 / Error logs
   */
  error: (...args: unknown[]) => {
    console.error('[shopify-html-builder]', ...args)
  },
}
