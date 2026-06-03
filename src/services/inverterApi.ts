import api from './config'
import type { InverterData, HistoryParams, TimeSeriesParams, TimeSeriesResponse } from './types'
import { USE_MOCK, mockInverters, mockInverterHistory, mockTimeSeriesResponse } from './mockData'

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

export const inverterApi = {
  getAll: async () => {
    if (USE_MOCK) {
      await delay()
      return { data: mockInverters }
    }
    return api.get<InverterData[]>('/inverters')
  },

  getById: async (inverterId: string) => {
    if (USE_MOCK) {
      await delay()
      const inv = mockInverters.find(i => i.inverter_id === inverterId) || mockInverters[0]
      return { data: inv }
    }
    return api.get<InverterData>(`/inverters/${inverterId}`)
  },

  getAllHistory: async (params?: HistoryParams) => {
    if (USE_MOCK) {
      await delay()
      return { data: mockInverterHistory('INV1') }
    }
    return api.get<InverterData[]>('/inverters/history', { params })
  },

  getHistory: async (inverterId: string, params?: HistoryParams) => {
    if (USE_MOCK) {
      await delay()
      return { data: mockInverterHistory(inverterId) }
    }
    return api.get<InverterData[]>(`/inverters/${inverterId}/history`, { params })
  },

  getTimeSeries: async (inverterId: string, params: Omit<TimeSeriesParams, 'deviceId'>) => {
    if (USE_MOCK) {
      await delay()
      return mockTimeSeriesResponse(inverterId) as { data: TimeSeriesResponse }
    }
    const timeSeriesParams = { deviceId: inverterId, ...params }
    return api.get<TimeSeriesResponse>('/timeseries/data', { params: timeSeriesParams })
  },
}