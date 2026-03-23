type AuthHeaderShape = {
  uid: string
  email?: string
  displayName?: string
}

function sanitizeHeader(value: string | null): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

export function getAuthHeaders(request: Request): AuthHeaderShape | null {
  const uid = sanitizeHeader(request.headers.get("x-firebase-uid"))
  if (!uid) return null

  return {
    uid,
    email: sanitizeHeader(request.headers.get("x-firebase-email")),
    displayName: sanitizeHeader(request.headers.get("x-firebase-display-name")),
  }
}
