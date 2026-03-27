const OWNER_HINTS = ['owner', 'dueno', 'dueño', 'admin', 'duena', 'dueña']
const KITCHEN_HINTS = ['cook', 'cocinero', 'cocina', 'kitchen', 'chef']

function parseEmails(value) {
  if (!value) return []
  return value
    .split(',')
    .map(email => email.trim().toLowerCase())
    .filter(Boolean)
}

const OWNER_EMAILS = parseEmails(import.meta.env.VITE_OWNER_EMAILS)
const COOK_EMAILS = parseEmails(import.meta.env.VITE_COOK_EMAILS)

function normalizeRole(user) {
  const role =
    user?.app_metadata?.role ||
    user?.user_metadata?.role ||
    user?.user_metadata?.rol ||
    ''

  return String(role).trim().toLowerCase()
}

function hasRoleHint(role, hints) {
  return hints.some(hint => role.includes(hint))
}

function hasListedEmail(user, list) {
  const email = user?.email?.toLowerCase()
  return Boolean(email && list.includes(email))
}

export function isOwner(user) {
  const role = normalizeRole(user)
  return hasRoleHint(role, OWNER_HINTS) || hasListedEmail(user, OWNER_EMAILS)
}

export function isCook(user) {
  const role = normalizeRole(user)
  return hasRoleHint(role, KITCHEN_HINTS) || hasListedEmail(user, COOK_EMAILS)
}

export function canAccessKitchen(user) {
  return isOwner(user) || isCook(user)
}

export function canAccessOwner(user) {
  return isOwner(user)
}
