import api from './config'
import type { PowerMeterData, HistoryParams } from './types'

// Power Meter APIs
export const powerMeterApi = {
  // Get latest power meter data
  get: () => api.get<PowerMeterData>('/power-meter'),
  
  // Get power meter history
  getHistory: (params?: HistoryParams) => api.get<PowerMeterData[]>('/power-meter/history', { params }),
}
