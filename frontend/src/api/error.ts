export const errorCatch = (error: {
  response?: { data?: { message?: string | string[] } }
  message?: string
}): string => {
  const message = error?.response?.data?.message

  return message
    ? typeof error.response.data.message === 'object'
      ? (message as string[])[0]
      : message
    : error.message ?? ''
}
