const configuredBase = (import.meta.env.VITE_API_BASE_URL || '').trim()
export const API_BASE_URL = configuredBase ? configuredBase.replace(/\/$/, '') : '/api'
