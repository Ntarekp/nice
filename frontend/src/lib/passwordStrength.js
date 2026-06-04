export function getPasswordRules(password) {
  return {
    length12: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    digit: /\d/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  }
}

export function getPasswordStrength(password) {
  const rules = getPasswordRules(password)
  const score = [rules.length12, rules.uppercase, rules.digit, rules.special].filter(Boolean).length
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  return {
    score,
    label: labels[Math.max(0, score - 1)] || 'Weak',
    rules,
  }
}
