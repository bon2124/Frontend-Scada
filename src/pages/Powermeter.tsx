import { useState, useEffect, useCallback } from 'react'
import { powerMeterApi, type PowerMeterData } from '../services/api'
import PowerOverview from '../components/PowerOverview'
import GridStatus from '../components/GridStatus'
import PowerHistoryChart from '../components/PowerHistoryChart'

// Legacy interface for compatibility with existing components
export interface PowerData {
  totalPower: number // W
  status: 'active' | 'warning' | 'fault'
  frequency: number // Hz
  phases: {
    U1: number // Voltage Phase 1 (V)
    U2: number // Voltage Phase 2 (V)
    U3: number // Voltage Phase 3 (V)
    I1: number // Current Phase 1 (A)
    I2: number // Current Phase 2 (A)
    I3: number // Current Phase 3 (A)
    P1 : number // Power Phase 1 (W)
    P2 : number // Power Phase 2 (W)
    P3 : number // Power Phase 3 (W)
  }
  gridType: '3-Phase' | '1-Phase'
}

const Powermeter = () => {
  const [powerMeterData, setPowerMeterData] = useState<PowerMeterData | null>(null)
  const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days'>('today')

  // Fetch current power meter data
  const fetchPowerMeterData = useCallback(async () => {
    try {
      const response = await powerMeterApi.get()
      setPowerMeterData(response.data)
    } catch (err) {
      console.error('Error fetching power meter data:', err)
    }
  }, [])

  // Transform PowerMeterData to legacy PowerData format for existing components
  const transformToLegacyFormat = (data: PowerMeterData): PowerData => {
    // Determine status based on values
    let status: 'active' | 'warning' | 'fault' = 'active'

    // Check for fault conditions
    if (data.Total_Power_P < 0 || data.Frequency_F < 49 || data.Frequency_F > 51) {
      status = 'fault'
    }
    // Check for warning conditions
    else if (
      data.Voltage_U1 < 220 || data.Voltage_U1 > 240 ||
      data.Voltage_U2 < 220 || data.Voltage_U2 > 240 ||
      data.Voltage_U3 < 220 || data.Voltage_U3 > 240 ||
      data.Current_I1 > 100 || data.Current_I2 > 100 || data.Current_I3 > 100
    ) {
      status = 'warning'
    }

    return {
      totalPower: data.Total_Power_P,
      status,
      frequency: data.Frequency_F,
      phases: {
        U1: data.Voltage_U1,
        U2: data.Voltage_U2,
        U3: data.Voltage_U3,
        I1: data.Current_I1,
        I2: data.Current_I2,
        I3: data.Current_I3,
        P1: data.Power_P1,
        P2: data.Power_P2,
        P3: data.Power_P3,
      },
      gridType: '3-Phase',
    }
  }

  // Update power meter data every 30 seconds
  useEffect(() => {
    fetchPowerMeterData()
    const interval = setInterval(fetchPowerMeterData, 3000)
    return () => clearInterval(interval)
  }, [fetchPowerMeterData])

  // Transform data for legacy components
  const powerData = powerMeterData ? transformToLegacyFormat(powerMeterData) : null

  return (
    <div className="container py-4">
      <div className="row mb-3">
        <div className="col">
          <h2 className="mb-0">
            <i className="bi bi-speedometer2 me-2"></i>
            Powermeter Monitoring
          </h2>
          <p className="text-muted">Real-time grid performance and status monitoring</p>
        </div>
      </div>

      {!powerData ? (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card shadow-sm">
              <div className="card-body text-center">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2 text-muted">Loading power meter data...</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Power Overview Section */}
          <div className="row mb-4">
            <div className="col-12">
              <PowerOverview powerData={powerData} />
            </div>
          </div>

          {/* Grid Status Section */}
          <div className="row mb-4">
            <div className="col-12">
              <GridStatus powerData={powerData} />
            </div>
          </div>

          {/* Power History Chart Section */}
          <div className="row mb-4">
            <div className="col-12">
              <PowerHistoryChart
                timePeriod={timePeriod}
                setTimePeriod={setTimePeriod}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default Powermeter
