import type { WeatherData, InverterData, PowerMeterData, TimeSeriesResponse } from './types'

// ============================================================
// Đặt USE_MOCK = false khi đã kết nối backend thật
// ============================================================
export const USE_MOCK = true

// ---- Helper ----
const rand = (min: number, max: number) => parseFloat((Math.random() * (max - min) + min).toFixed(2))

// ---- Weather / Environmental ----
export const mockWeatherData: WeatherData = {
  Irradiance: 754.3,
  Ambient_Temp: 32.5,
  Module_Temp: 51.2,
  time: new Date().toISOString(),
}

export const mockWeatherHistory: WeatherData[] = Array.from({ length: 24 }, (_, hour) => {
  const isDay = hour >= 6 && hour <= 18
  const irradiance = isDay
    ? parseFloat(Math.max(0, 950 - Math.abs(hour - 12) * 80 + rand(-20, 20)).toFixed(1))
    : 0
  return {
    Irradiance: irradiance,
    Ambient_Temp: parseFloat((28 + Math.sin((hour / 24) * Math.PI * 2) * 6 + rand(-1, 1)).toFixed(1)),
    Module_Temp: parseFloat((irradiance > 0 ? 45 + irradiance / 40 + rand(-2, 2) : 28).toFixed(1)),
    time: new Date(new Date().setHours(hour, 0, 0, 0)).toISOString(),
  }
})

// ---- Inverters ----
const makeInverter = (id: string, acPowerKw: number): InverterData => ({
  inverter_id: id,
  DC_Voltage_MPPT1: rand(370, 400),
  DC_Current_MPPT1: rand(7.5, 9.5),
  DC_Power_MPPT1: acPowerKw * 1000 * 1.05,
  AC_Power: acPowerKw * 1000,
  AC_Voltage: rand(226, 233),
  AC_Frequency: rand(49.95, 50.05),
  Control_Enable_Status: 1,
  Control_WMax_Limit: 5000,
  time: new Date().toISOString(),
})

export const mockInverters: InverterData[] = [
  makeInverter('INV1', 3.8),
  makeInverter('INV2', 4.1),
  makeInverter('INV3', 3.6),
  makeInverter('INV4', 3.9),
]

export const mockInverterHistory = (inverterId: string): InverterData[] =>
  Array.from({ length: 24 }, (_, hour) => {
    const isDay = hour >= 6 && hour <= 18
    const power = isDay
      ? Math.max(0, 4000 - Math.abs(hour - 12) * 320 + rand(-100, 100))
      : 0
    return {
      inverter_id: inverterId,
      DC_Voltage_MPPT1: power > 0 ? rand(370, 400) : 0,
      DC_Current_MPPT1: power > 0 ? rand(7.5, 9.5) : 0,
      DC_Power_MPPT1: power * 1.05,
      AC_Power: power,
      AC_Voltage: power > 0 ? rand(226, 233) : 0,
      AC_Frequency: power > 0 ? rand(49.95, 50.05) : 0,
      Control_Enable_Status: 1,
      Control_WMax_Limit: 5000,
      time: new Date(new Date().setHours(hour, 0, 0, 0)).toISOString(),
    }
  })

// ---- Power Meter ----
export const mockPowerMeterData: PowerMeterData = {
  Voltage_U1: 229.4,
  Voltage_U2: 230.1,
  Voltage_U3: 228.8,
  Current_I1: 5.6,
  Current_I2: 5.9,
  Current_I3: 5.4,
  Power_P1: 1283,
  Power_P2: 1357,
  Power_P3: 1235,
  Total_Power_P: 3875,
  Frequency_F: 50.01,
  time: new Date().toISOString(),
}

export const mockPowerMeterHistory: PowerMeterData[] = Array.from({ length: 24 }, (_, hour) => {
  const isDay = hour >= 6 && hour <= 18
  const total = isDay
    ? Math.max(0, 3800 - Math.abs(hour - 12) * 300 + rand(-100, 100))
    : 0
  const perPhase = total / 3
  return {
    Voltage_U1: rand(228, 232),
    Voltage_U2: rand(228, 232),
    Voltage_U3: rand(228, 232),
    Current_I1: total > 0 ? rand(4.5, 6.5) : 0,
    Current_I2: total > 0 ? rand(4.5, 6.5) : 0,
    Current_I3: total > 0 ? rand(4.5, 6.5) : 0,
    Power_P1: perPhase,
    Power_P2: perPhase,
    Power_P3: perPhase,
    Total_Power_P: total,
    Frequency_F: rand(49.97, 50.03),
    time: new Date(new Date().setHours(hour, 0, 0, 0)).toISOString(),
  }
})

// ---- Time Series (dùng cho chart history) ----
export const mockTimeSeriesResponse = (deviceId: string): { data: TimeSeriesResponse } => {
  const data = Array.from({ length: 24 }, (_, hour) => {
    const isDay = hour >= 6 && hour <= 18
    const irr = isDay ? Math.max(0, 950 - Math.abs(hour - 12) * 80 + rand(-20, 20)) : 0
    const power = isDay ? Math.max(0, 4000 - Math.abs(hour - 12) * 320 + rand(-100, 100)) : 0
    return {
      timestamp: new Date(new Date().setHours(hour, 0, 0, 0)).toISOString(),
      Irradiance: parseFloat(irr.toFixed(1)),
      Ambient_Temp: parseFloat((28 + Math.sin((hour / 24) * Math.PI * 2) * 6).toFixed(1)),
      Module_Temp: parseFloat((irr > 0 ? 45 + irr / 40 : 28).toFixed(1)),
      AC_Power: parseFloat(power.toFixed(1)),
      AC_Voltage: power > 0 ? rand(226, 233) : 0,
      AC_Frequency: power > 0 ? rand(49.95, 50.05) : 0,
      Total_Power_P: parseFloat((power * 3.5).toFixed(1)),
    }
  })
  return {
    data: {
      deviceId,
      metricsRequested: ['Irradiance', 'Ambient_Temp', 'Module_Temp', 'AC_Power', 'AC_Voltage', 'AC_Frequency', 'Total_Power_P'],
      data,
    }
  }
}