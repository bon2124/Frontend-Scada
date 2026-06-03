import api from './config'
import type { WeatherData, HistoryParams, TimeSeriesParams, TimeSeriesResponse } from './types'

// Weather Station APIs
export const weatherApi = {
  // Get latest weather data
  get: () => api.get<WeatherData>('/weather'),
  
  // Get weather history
  getHistory: (params?: HistoryParams) => api.get<WeatherData[]>('/weather/history', { params }),
  
  // Get time-series data for charts (NEW)
  getTimeSeries: (params: Omit<TimeSeriesParams, 'deviceId'> & { deviceId?: string }) => {
    const timeSeriesParams = {
      deviceId: 'weather',
      ...params
    }
    return api.get<TimeSeriesResponse>('/timeseries/data', { params: timeSeriesParams })
  }
}
