import axios from 'axios'
import { API_BASE_URL } from './config'

const api = axios.create({ baseURL: API_BASE_URL, timeout: 60000 })

api.interceptors.request.use(config => {
  if (config.method === 'get') {
    config.params = config.params || {}
    config.params['_t'] = Date.now()
  }
  return config
})

export const getApplicants = () => api.get('/applicants').then(r => r.data)
export const getApplicant = (id) => api.get(`/applicants/${id}`).then(r => r.data)
export const getScore = (id) => api.get(`/score/${id}`).then(r => r.data)
export const simulate = (id, feature_name, new_value) =>
  api.post(`/simulate/${id}`, { feature_name, new_value }).then(r => r.data)
export const explain = (id) => api.get(`/explain/${id}`).then(r => r.data)
export const explainOwner = (id) => api.get(`/explain-owner/${id}`).then(r => r.data)
export const chat = (applicant_id, question, history = []) =>
  api.post('/chat', { applicant_id, question, history }).then(r => r.data)
export const getPortfolio = () => api.get('/portfolio').then(r => r.data)
export const consent = (id) => api.post(`/consent/${id}`).then(r => r.data)
export const loanApply = (id) => api.post(`/loan-apply/${id}`).then(r => r.data)
export const getAudit = (id) => api.get(`/audit/${id}`).then(r => r.data)
export const getTrend = (id) => api.get(`/trend/${id}`).then(r => r.data)
export const getRewind = (id) => api.get(`/rewind/${id}`).then(r => r.data)
export const getMonteCarlo = (id) => api.get(`/montecarlo/${id}`).then(r => r.data)
export const getCommittee = (id) => api.get(`/committee/${id}`).then(r => r.data)

export default api
