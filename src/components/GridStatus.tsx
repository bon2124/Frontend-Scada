import { useState, useEffect, useCallback } from 'react'
import { powerMeterApi, type PowerMeterData } from '../services/api'

const MOCK_POWER_METER_DATA: PowerMeterData = {
  Voltage_U1: 220.5,
  Voltage_U2: 221.2,
  Voltage_U3: 219.8,
  Current_I1: 8.4,
  Current_I2: 7.9,
  Current_I3: 8.1,
  Power_P1: 1848,
  Power_P2: 1747,
  Power_P3: 1780,
  Total_Power_P: 5375,
  Frequency_F: 50,
  time: new Date().toISOString(),
}

// Giữ lại interface này để các component cũ như PowerOverview/GridStatus không bị lỗi import
export interface PowerData {
  totalPower: number
  status: 'active' | 'warning' | 'fault'
  frequency: number
  phases: {
    U1: number
    U2: number
    U3: number
    I1: number
    I2: number
    I3: number
    P1: number
    P2: number
    P3: number
  }
  gridType: '3-Phase' | '1-Phase'
}

const Powermeter = () => {
  const [powerMeterData, setPowerMeterData] = useState<PowerMeterData>(
    MOCK_POWER_METER_DATA
  )

  const fetchPowerMeterData = useCallback(async () => {
    try {
      const response = await powerMeterApi.get()
      setPowerMeterData(response.data)
    } catch (err) {
      console.warn('Backend chưa chạy, đang dùng mock data:', err)

      setPowerMeterData({
        ...MOCK_POWER_METER_DATA,
        time: new Date().toISOString(),
      })
    }
  }, [])

  useEffect(() => {
    fetchPowerMeterData()
    const interval = setInterval(fetchPowerMeterData, 3000)

    return () => clearInterval(interval)
  }, [fetchPowerMeterData])

  const totalPowerKw = powerMeterData.Total_Power_P / 1000

  const getVoltageStatus = (value: number) => {
    if (value < 220 || value > 240) return 'danger'
    if (value < 225 || value > 235) return 'warning'
    return 'success'
  }

  const getCurrentStatus = (value: number) => {
    if (value > 10) return 'danger'
    if (value > 9) return 'warning'
    return 'success'
  }

  const getFrequencyStatus = (value: number) => {
    if (value < 49 || value > 51) return 'danger'
    if (value < 49.5 || value > 50.5) return 'warning'
    return 'success'
  }

  const systemStatus =
    totalPowerKw < 0 ||
    getFrequencyStatus(powerMeterData.Frequency_F) === 'danger'
      ? 'danger'
      : getVoltageStatus(powerMeterData.Voltage_U1) === 'warning' ||
          getVoltageStatus(powerMeterData.Voltage_U2) === 'warning' ||
          getVoltageStatus(powerMeterData.Voltage_U3) === 'warning'
        ? 'warning'
        : 'success'

  const statusText = {
    success: 'Normal',
    warning: 'Warning',
    danger: 'Fault',
  }

  const phaseData = [
    {
      name: 'Phase 1',
      voltage: powerMeterData.Voltage_U1,
      current: powerMeterData.Current_I1,
      power: powerMeterData.Power_P1 / 1000,
    },
    {
      name: 'Phase 2',
      voltage: powerMeterData.Voltage_U2,
      current: powerMeterData.Current_I2,
      power: powerMeterData.Power_P2 / 1000,
    },
    {
      name: 'Phase 3',
      voltage: powerMeterData.Voltage_U3,
      current: powerMeterData.Current_I3,
      power: powerMeterData.Power_P3 / 1000,
    },
  ]

  const historyData = [
    3.2,
    3.8,
    4.1,
    4.6,
    5.1,
    totalPowerKw,
    4.9,
    4.5,
    4.8,
    5.0,
    5.2,
    totalPowerKw,
  ]

  const maxHistoryValue = Math.max(...historyData)
  const avgHistoryValue =
    historyData.reduce((sum, item) => sum + item, 0) / historyData.length

  return (
    <div className="compact-powermeter-page">
      <div className="compact-page-title">
        <div>
          <h4>
            <i className="bi bi-speedometer2 me-2"></i>
            Powermeter Monitoring
          </h4>
          <span>Real-time grid performance and status monitoring</span>
        </div>

        <div className={`compact-status-badge status-${systemStatus}`}>
          <i className="bi bi-circle-fill me-2"></i>
          {statusText[systemStatus]}
        </div>
      </div>

      <div className="compact-dashboard">
        <div className="compact-main-card total-power-card">
          <div className="compact-card-label">
            <i className="bi bi-lightning-charge-fill"></i>
            Total Power
          </div>

          <div className="total-power-value">
            {totalPowerKw.toFixed(2)}
            <span>kW</span>
          </div>

          <div className="compact-card-note">
            <i className="bi bi-arrow-up-circle-fill text-light me-1"></i>
            Generating Power
          </div>
        </div>

        <div className="compact-main-card">
          <div className="compact-card-label">
            <i className="bi bi-speedometer"></i>
            Frequency
          </div>

          <div
            className={`compact-big-value text-${getFrequencyStatus(
              powerMeterData.Frequency_F
            )}`}
          >
            {powerMeterData.Frequency_F.toFixed(2)}
            <span>Hz</span>
          </div>

          <div className="compact-card-note">Safe range: 49.5 - 50.5 Hz</div>
        </div>

        <div className="compact-main-card">
          <div className="compact-card-label">
            <i className="bi bi-diagram-3-fill"></i>
            Grid Type
          </div>

          <div className="compact-big-value">3-Phase</div>

          <div className="compact-card-note">Three phase monitoring</div>
        </div>

        <div className="compact-main-card">
          <div className="compact-card-label">
            <i className="bi bi-clock-history"></i>
            Last Update
          </div>

          <div className="compact-big-value small-time">
            {new Date(powerMeterData.time).toLocaleTimeString()}
          </div>

          <div className="compact-card-note">Auto refresh every 3 seconds</div>
        </div>

        <div className="compact-section phase-section">
          <div className="compact-section-header">
            <div>
              <h5>
                <i className="bi bi-cpu-fill me-2"></i>
                Phase Status
              </h5>
              <span>Voltage, current and power by phase</span>
            </div>

            <span className="mini-badge bg-success">Balanced</span>
          </div>

          <div className="phase-compact-grid">
            {phaseData.map((phase) => {
              const voltageStatus = getVoltageStatus(phase.voltage)
              const currentStatus = getCurrentStatus(phase.current)

              return (
                <div className="phase-compact-card" key={phase.name}>
                  <div className="phase-compact-title">
                    <strong>{phase.name}</strong>
                    <span className={`dot dot-${voltageStatus}`}></span>
                  </div>

                  <div className="phase-values-grid">
                    <div>
                      <span>Voltage</span>
                      <strong className={`text-${voltageStatus}`}>
                        {phase.voltage.toFixed(1)} V
                      </strong>
                    </div>

                    <div>
                      <span>Current</span>
                      <strong className={`text-${currentStatus}`}>
                        {phase.current.toFixed(1)} A
                      </strong>
                    </div>

                    <div>
                      <span>Power</span>
                      <strong>{phase.power.toFixed(2)} kW</strong>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="compact-section history-section">
          <div className="compact-section-header">
            <div>
              <h5>
                <i className="bi bi-graph-up-arrow me-2"></i>
                Power History
              </h5>
              <span>Compact preview chart</span>
            </div>

            <div className="history-tabs">
              <button className="active">Today</button>
              <button>7D</button>
              <button>30D</button>
            </div>
          </div>

          <div className="history-stat-row">
            <div>
              <span>Peak</span>
              <strong>{maxHistoryValue.toFixed(2)} kW</strong>
            </div>

            <div>
              <span>Average</span>
              <strong>{avgHistoryValue.toFixed(2)} kW</strong>
            </div>

            <div>
              <span>Energy</span>
              <strong>{(totalPowerKw * 5.2).toFixed(1)} kWh</strong>
            </div>
          </div>

          <div className="mini-bar-chart">
            {historyData.map((value, index) => (
              <div className="mini-bar-item" key={index}>
                <div
                  className="mini-bar"
                  style={{
                    height: `${(value / maxHistoryValue) * 100}%`,
                  }}
                ></div>
              </div>
            ))}
          </div>
        </div>

        <div className="compact-section threshold-section">
          <div className="threshold-box">
            <i className="bi bi-shield-check text-success"></i>
            <div>
              <strong>Voltage Safe</strong>
              <span>225V - 235V</span>
            </div>
          </div>

          <div className="threshold-box">
            <i className="bi bi-exclamation-triangle text-warning"></i>
            <div>
              <strong>Voltage Warning</strong>
              <span>220V - 225V / 235V - 240V</span>
            </div>
          </div>

          <div className="threshold-box">
            <i className="bi bi-x-circle text-danger"></i>
            <div>
              <strong>Critical</strong>
              <span>&lt;220V or &gt;240V</span>
            </div>
          </div>

          <div className="threshold-box">
            <i className="bi bi-activity text-primary"></i>
            <div>
              <strong>Current Safe</strong>
              <span>&lt;9A normal, &gt;10A critical</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Powermeter