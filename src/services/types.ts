// API Response Types

export interface InverterData {
  inverter_id: string
  AC_Power: number
  AC_Voltage: number
  AC_Frequency: number
  DC_Power_MPPT1: number
  DC_Voltage_MPPT1: number
  DC_Current_MPPT1: number
  Control_WMax_Limit: number
  Control_Enable_Status: number
  time: string
}

export interface PowerMeterData {
  Voltage_U1: number
  Voltage_U2: number
  Voltage_U3: number
  Current_I1: number
  Current_I2: number
  Current_I3: number
  Power_P1: number
  Power_P2: number
  Power_P3: number
  Total_Power_P: number
  Frequency_F: number
  time: string
}

export interface WeatherData {
  Ambient_Temp: number
  Irradiance: number
  Module_Temp: number
  time: string
}

// History Query Parameters
export interface HistoryParams {
  start?: string  // Default: -1h
  stop?: string   // Default: now()
  limit?: number  // Default: 100, Max: 1000
}

// Time-Series API Parameters
export interface TimeSeriesParams {
  deviceId: string  // Device identifier (weather, INV1-4, power-meter)
  metrics: string   // Comma-separated list of metrics
  startTime: string // Start time in ISO format
  endTime: string   // End time in ISO format
  interval?: string // Aggregation interval (5m, 15m, 30m, 1h, 4h, 12h, 1d, 3d, 1w, 1M)
  aggregateType?: 'avg' | 'max' | 'min' | 'sum' // Fixed: use 'avg' instead of 'mean'
}

// Time-Series API Response
export interface TimeSeriesResponse {
  deviceId: string
  metricsRequested: string[]
  data: Array<{
    timestamp: string
    [metric: string]: number | string
  }>
}
