// Invite links: https://<the site>/?join=K7Q2MX
// Someone opening one may need to sign up first, so the code is remembered in the browser until
// they reach the "Join a crew" step.
const KEY = 'hwr-invite'

export function inviteLink(code: string) {
  return `${window.location.origin}/?join=${code}`
}

// Call once when the page loads: picks the code out of the address bar and tidies the address.
export function captureInviteCode() {
  const params = new URLSearchParams(window.location.search)
  const code = params.get('join')
  if (!code) return
  try {
    localStorage.setItem(KEY, code.toUpperCase())
  } catch {
    /* fine: they can type it in */
  }
  params.delete('join')
  const rest = params.toString()
  window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''))
}

export function readInviteCode() {
  try {
    return localStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

export function clearInviteCode() {
  try {
    localStorage.removeItem(KEY)
  } catch {
    /* nothing to clear */
  }
}
