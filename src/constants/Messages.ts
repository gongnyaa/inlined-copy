export const MESSAGE_KEYS = {
  COPY_SUCCESS: 'copy.success',
  TEXT_NOT_FOUND: 'error.textNotFound',
  UNEXPECTED_ERROR: 'error.unexpected',
  LOG_PREFIX: 'log.prefix',
  LOG_WARN_PREFIX: 'log.warnPrefix',
  LOG_ERROR_PREFIX: 'log.errorPrefix',
} as const;

export type MessageKey = (typeof MESSAGE_KEYS)[keyof typeof MESSAGE_KEYS];

/**
 * ログメッセージの定数
 * 注: 多言語化対応のため、実際の使用時は t 関数を使用すること
 */
export const LOG_PREFIX = '[Inlined Copy]';
export const LOG_WARN_PREFIX = `${LOG_PREFIX} WARN`;
export const LOG_ERROR_PREFIX = `${LOG_PREFIX} ERROR`;
