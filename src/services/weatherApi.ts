import api from './config'
import type { WeatherData, HistoryParams, TimeSeriesParams, TimeSeriesResponse } from './types'
import { USE_MOCK, mockWeatherData, mockWeatherHistory, mockTimeSeriesResponse } from './mockData'

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

export const weatherApi = {
  get: async () => {
    if (USE_MOCK) {
      await delay()
      return { data: { ...mockWeatherData, time: new Date().toISOString() } }
    }
    return api.get<WeatherData>('/weather')
  },

  getHistory: async (params?: HistoryParams) => {
    if (USE_MOCK) {
      await delay()
      return { data: mockWeatherHistory }
    }
    return api.get<WeatherData[]>('/weather/history', { params })
  },

  getTimeSeries: async (params: Omit<TimeSeriesParams, 'deviceId'> & { deviceId?: string }) => {
    if (USE_MOCK) {
      await delay()
      return mockTimeSeriesResponse(params.deviceId || 'weather') as { data: TimeSeriesResponse }
    }
    const timeSeriesParams = { deviceId: 'weather', ...params }
    return api.get<TimeSeriesResponse>('/timeseries/data', { params: timeSeriesParams })
  },
}