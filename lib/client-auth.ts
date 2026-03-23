import { auth } from "@/lib/firebase"

export function withFirebaseUserHeaders(headersInit?: HeadersInit): Headers {
  const headers = new Headers(headersInit)
  const currentUser = auth?.currentUser

  if (currentUser?.uid) {
    headers.set("x-firebase-uid", currentUser.uid)
  }
  if (currentUser?.email) {
    headers.set("x-firebase-email", currentUser.email)
  }
  if (currentUser?.displayName) {
    headers.set("x-firebase-display-name", currentUser.displayName)
  }

  return headers
}
