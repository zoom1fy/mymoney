// Extracts the first error message from an Axios error (message may be string or string[])
export const catchError = (error: unknown): string => {
  const apiError = error as { response?: { data?: { message?: string | string[] } }; message?: string }
  const message = apiError?.response?.data?.message

  return message
    ? typeof message === 'object'
      ? message[0]
      : message
    : apiError?.message ?? ''
}
