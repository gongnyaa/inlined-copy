export const MESSAGE_KEYS = {
  COPY_SUCCESS: 'copy.success',
  TEXT_NOT_FOUND: 'error.textNotFound',
  UNEXPECTED_ERROR: 'error.unexpected',
} as const;

export type MessageKey = (typeof MESSAGE_KEYS)[keyof typeof MESSAGE_KEYS];
