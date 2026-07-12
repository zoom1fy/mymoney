export const errorCatch = (error: unknown): string => {
  const err = error as { response?: { data?: { message?: string | string[] } }; message?: string }
  const message = err?.response?.data?.message

  return message
    ? typeof message === 'object'
      ? message[0]
      : message
    : err.message ?? ''
}
