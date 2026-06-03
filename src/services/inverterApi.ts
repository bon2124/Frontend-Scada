import api from './config'
import type { InverterData, HistoryParams, TimeSeriesParams, TimeSeriesResponse } from './types'

// Inverter APIs
export const inverterApi = {
  // Get all inverters
  getAll: () => api.get<InverterData[]>('/inverters'),
  
  // Get single inverter
  getById: (inverterId: string) => api.get<InverterData>(`/inverters/${inverterId}`),
  
  // Get all inverters history
  getAllHistory: (params?: HistoryParams) => api.get<InverterData[]>('/inverters/history', { params }),
  
  // Get single inverter history
  getHistory: (inverterId: string, params?: HistoryParams) => 
    api.get<InverterData[]>(`/inverters/${inverterId}/history`, { params }),
  
  // Get time-series data for charts
  getTimeSeries: (inverterId: string, params: Omit<TimeSeriesParams, 'deviceId'>) => {
    const timeSeriesParams = {
      deviceId: inverterId,
      ...params
    }
    return api.get<TimeSeriesResponse>('/timeseries/data', { params: timeSeriesParams })
  }
}
