import api from './config'
import type { PowerMeterData, HistoryParams } from './types'
import { USE_MOCK, mockPowerMeterData, mockPowerMeterHistory } from './mockData'

const delay = (ms = 300) => new Promise(res => setTimeout(res, ms))

export const powerMeterApi = {
  get: async () => {
    if (USE_MOCK) {
      await delay()
      return { data: { ...mockPowerMeterData, time: new Date().toISOString() } }
    }
    return api.get<PowerMeterData>('/power-meter')
  },

  getHistory: async (params?: HistoryParams) => {
    if (USE_MOCK) {
      await delay()
      return { data: mockPowerMeterHistory }
    }
    return api.get<PowerMeterData[]>('/power-meter/history', { params })
  },
}