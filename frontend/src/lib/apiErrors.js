/** Turn axios API errors into a single user-facing message. */
export function getApiError(err, fallback = 'Request failed') {
  const data = err?.response?.data
  if (data?.errors?.length) {
    return data.errors.map((e) => e.msg || e.message).filter(Boolean).join('. ')
  }
  return data?.error || fallback
}
