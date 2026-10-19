import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
})

// Holdings
export const getHoldings = () => api.get('/holdings/')
export const addHolding = (data) => api.post('/holdings/', data)
export const updateHolding = (id, data) => api.put(`/holdings/${id}`, data)
export const deleteHolding = (id) => api.delete(`/holdings/${id}`)

// Funds
export const getFundDetail = (code) => api.get(`/funds/${code}`)
export const getFundHistory = (code, period) => api.get(`/funds/${code}/history`, { params: { period } })
export const getFundPredictions = (code) => api.get(`/funds/${code}/predictions`)
export const getTopFunds = () => api.get('/funds/screener/top')

// Stocks
export const getStockDetail = (code) => api.get(`/stocks/${code}`)
export const getStockHistory = (code, period) => api.get(`/stocks/${code}/history`, { params: { period } })
export const getStockPredictions = (code) => api.get(`/stocks/${code}/predictions`)

// News
export const getNews = (code) => api.get('/news/', { params: code ? { code } : {} })
export const getRelatedNews = (codes) => api.get('/news/related', { params: { codes: codes.join(',') } })
export const getNewsAccuracy = () => api.get('/news/accuracy')

// Skills
export const getSkills = () => api.get('/skills/')
export const getSkillDetail = (name) => api.get(`/skills/${name}`)
export const toggleSkill = (name) => api.put(`/skills/${name}/toggle`)
export const toggleSubSkill = (name, subName) => api.put(`/skills/${name}/sub-skills/${subName}/toggle`)

// Alerts
export const getAlerts = () => api.get('/alerts/')
export const createAlert = (data) => api.post('/alerts/', data)
export const updateAlert = (id, data) => api.put(`/alerts/${id}`, data)
export const deleteAlert = (id) => api.delete(`/alerts/${id}`)

// Watchlist
export const getWatchlist = () => api.get('/watchlist/')
export const addWatch = (data) => api.post('/watchlist/', data)
export const convertToHolding = (id) => api.put(`/watchlist/${id}/convert`)
export const removeWatch = (id) => api.delete(`/watchlist/${id}`)

// DCA
export const calculateDca = (params) => api.post('/dca/calculate', params)

export default api