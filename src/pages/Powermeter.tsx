import { useState, useEffect, useCallback } from 'react'
import { powerMeterApi, type PowerMeterData } from '../services/api'

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
  const [powerMeterData, setPowerMeterData] = useState<PowerMeterData | null>(null)
  const [historyData, setHistoryData] = useState<number[]>([])
  const [historyLabels, setHistoryLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchPowerMeterData = useCallback(async () => {
    try {
      const response = await powerMeterApi.get()
      setPowerMeterData(response.data)
      setError(null)
    } catch (err) {
      console.error('Error fetching power meter data:', err)
      setError('Không lấy được dữ liệu Powermeter từ backend.')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPowerMeterHistory = useCallback(async () => {
    try {
      const now = new Date()
      const start = new Date()
      start.setHours(0, 0, 0, 0)

      const response = await powerMeterApi.getHistory({
        start: start.toISOString(),
        stop: now.toISOString(),
        limit: 24,
      })

      const history = response.data || []

      if (history.length === 0) {
        setHistoryData([])
        setHistoryLabels([])
        return
      }

      const values = history.map((item) => Number(item.Total_Power_P || 0) / 1000)

      const labels = history.map((item) => {
        const date = new Date(item.time)

        return date.toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })
      })

      setHistoryData(values)
      setHistoryLabels(labels)
    } catch (err) {
      console.error('Error fetching power meter history:', err)
      setHistoryData([])
      setHistoryLabels([])
    }
  }, [])

  useEffect(() => {
    fetchPowerMeterData()
    fetchPowerMeterHistory()

    const interval = setInterval(() => {
      fetchPowerMeterData()
      fetchPowerMeterHistory()
    }, 3000)

    return () => clearInterval(interval)
  }, [fetchPowerMeterData, fetchPowerMeterHistory])

  if (loading) {
    return (
      <div className="compact-powermeter-page">
        <div className="compact-page-title">
          <div>
            <h4>
              <i className="bi bi-speedometer2 me-2"></i>
              Powermeter Monitoring
            </h4>
            <span>Waiting for backend data...</span>
          </div>
        </div>

        <div className="backend-loading-box">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Loading power meter data...</p>
        </div>
      </div>
    )
  }

  if (!powerMeterData) {
    return (
      <div className="compact-powermeter-page">
        <div className="compact-page-title">
          <div>
            <h4>
              <i className="bi bi-speedometer2 me-2"></i>
              Powermeter Monitoring
            </h4>
            <span>Backend data unavailable</span>
          </div>
        </div>

        <div className="backend-error-box">
          <i className="bi bi-exclamation-triangle"></i>
          <strong>Không có dữ liệu Powermeter</strong>
          <span>{error || 'Kiểm tra lại backend hoặc API endpoint.'}</span>
        </div>
      </div>
    )
  }

  const totalPowerKw = powerMeterData.Total_Power_P / 1000
  const currentDate = new Date(powerMeterData.time).toLocaleDateString('vi-VN')

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

  const getPhaseStatus = (voltage: number, current: number) => {
    const voltageStatus = getVoltageStatus(voltage)
    const currentStatus = getCurrentStatus(current)

    if (voltageStatus === 'danger' || currentStatus === 'danger') return 'danger'
    if (voltageStatus === 'warning' || currentStatus === 'warning') return 'warning'
    return 'success'
  }

  const systemStatus =
    totalPowerKw < 0 || getFrequencyStatus(powerMeterData.Frequency_F) === 'danger'
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

  const chartData = historyData.length > 0 ? historyData : [totalPowerKw]
  const chartLabels =
    historyLabels.length > 0
      ? historyLabels
      : [
          new Date(powerMeterData.time).toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        ]

  const maxHistoryValue = Math.max(8, Math.ceil(Math.max(...chartData)))
  const avgHistoryValue =
    chartData.reduce((sum, item) => sum + item, 0) / chartData.length

  const now = new Date()
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const hoursToday = Math.max(
    1,
    (now.getTime() - startOfToday.getTime()) / (1000 * 60 * 60)
  )

  const energyToday = avgHistoryValue * hoursToday

  const chart = {
    width: 560,
    height: 210,
    left: 46,
    right: 16,
    top: 14,
    bottom: 54,
  }

  const plotWidth = chart.width - chart.left - chart.right
  const plotHeight = chart.height - chart.top - chart.bottom

  const yTicks = [
    maxHistoryValue,
    maxHistoryValue * 0.75,
    maxHistoryValue * 0.5,
    maxHistoryValue * 0.25,
    0,
  ]

  const linePoints = chartData
    .map((value, index) => {
      const x =
        chartData.length === 1
          ? chart.left + plotWidth / 2
          : chart.left + index * (plotWidth / (chartData.length - 1))

      const y = chart.top + plotHeight - (value / maxHistoryValue) * plotHeight

      return `${x},${y}`
    })
    .join(' ')

  const shouldShowXAxisLabel = (index: number) => {
    if (chartLabels.length <= 6) return true

    const step = Math.ceil(chartLabels.length / 6)
    return index % step === 0 || index === chartLabels.length - 1
  }

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
            <i className="bi bi-arrow-up-circle-fill me-1"></i>
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

          <div className="compact-card-note">
            {currentDate} • Auto refresh every 3 seconds
          </div>
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
              const phaseStatus = getPhaseStatus(phase.voltage, phase.current)
              const voltageStatus = getVoltageStatus(phase.voltage)
              const currentStatus = getCurrentStatus(phase.current)

              return (
                <div className="phase-compact-card polished" key={phase.name}>
                  <div className="phase-card-top">
                    <div className="phase-card-title">
                      <strong>{phase.name}</strong>
                      <small>Status Monitoring</small>
                    </div>

                    <span className={`dot dot-${phaseStatus}`}></span>
                  </div>

                  <div className="phase-metric-boxes">
                    <div className="phase-metric-box">
                      <span>Voltage</span>
                      <strong className={`text-${voltageStatus}`}>
                        {phase.voltage.toFixed(1)} V
                      </strong>
                    </div>

                    <div className="phase-metric-box">
                      <span>Current</span>
                      <strong className={`text-${currentStatus}`}>
                        {phase.current.toFixed(1)} A
                      </strong>
                    </div>

                    <div className="phase-metric-box">
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
                <i className="bi bi-graph-up me-2"></i>
                Power History
              </h5>
              <span>Today power output trend</span>
            </div>

            <div className="history-tabs">
              <button className="active">Today</button>
            </div>
          </div>

          <div className="history-stat-row square">
            <div>
              <span>Peak</span>
              <strong>{Math.max(...chartData).toFixed(2)} kW</strong>
            </div>

            <div>
              <span>Average</span>
              <strong>{avgHistoryValue.toFixed(2)} kW</strong>
            </div>

            <div>
              <span>Energy</span>
              <strong>{energyToday.toFixed(1)} kWh</strong>
            </div>
          </div>

          <div className="history-chart-panel">
            <svg
              viewBox={`0 0 ${chart.width} ${chart.height}`}
              className="history-svg-chart"
              preserveAspectRatio="none"
            >
              {yTicks.map((tick, index) => {
                const y = chart.top + (index / (yTicks.length - 1)) * plotHeight

                return (
                  <g key={`y-${index}`}>
                    <line
                      x1={chart.left}
                      y1={y}
                      x2={chart.width - chart.right}
                      y2={y}
                      className="chart-grid-line"
                    />
                    <text
                      x={chart.left - 8}
                      y={y + 4}
                      textAnchor="end"
                      className="chart-axis-text"
                    >
                      {tick.toFixed(0)}
                    </text>
                  </g>
                )
              })}

              {chartLabels.map((label, index) => {
                const x =
                  chartLabels.length === 1
                    ? chart.left + plotWidth / 2
                    : chart.left + index * (plotWidth / (chartLabels.length - 1))

                return (
                  <g key={`x-${index}`}>
                    <line
                      x1={x}
                      y1={chart.top}
                      x2={x}
                      y2={chart.top + plotHeight}
                      className="chart-grid-line vertical"
                    />
                    <text
                      x={x}
                      y={chart.top + plotHeight + 16}
                      textAnchor="middle"
                      className="chart-axis-text"
                    >
                      {shouldShowXAxisLabel(index) ? label : ''}
                    </text>
                  </g>
                )
              })}

              <line
                x1={chart.left}
                y1={chart.top}
                x2={chart.left}
                y2={chart.top + plotHeight}
                className="chart-axis-line"
              />

              <line
                x1={chart.left}
                y1={chart.top + plotHeight}
                x2={chart.width - chart.right}
                y2={chart.top + plotHeight}
                className="chart-axis-line"
              />

              {chartData.length > 1 && (
                <polyline points={linePoints} className="chart-line-path" />
              )}

              {chartData.map((value, index) => {
                const x =
                  chartData.length === 1
                    ? chart.left + plotWidth / 2
                    : chart.left + index * (plotWidth / (chartData.length - 1))

                const y =
                  chart.top + plotHeight - (value / maxHistoryValue) * plotHeight

                return (
                  <circle
                    key={`point-${index}`}
                    cx={x}
                    cy={y}
                    r={3}
                    className="chart-point"
                  >
                    <title>{value.toFixed(2)} kW</title>
                  </circle>
                )
              })}

              <text
                x={16}
                y={chart.top + plotHeight / 2}
                textAnchor="middle"
                className="chart-y-title"
                transform={`rotate(-90 16 ${chart.top + plotHeight / 2})`}
              >
                Power (kW)
              </text>

              <text
                x={chart.left + plotWidth / 2}
                y={chart.height - 22}
                textAnchor="middle"
                className="chart-x-title"
              >
                Time
              </text>

              <g className="chart-legend">
                <line
                  x1={chart.left + plotWidth / 2 - 32}
                  y1={chart.height - 8}
                  x2={chart.left + plotWidth / 2 - 18}
                  y2={chart.height - 8}
                  className="chart-line-path"
                />
                <circle
                  cx={chart.left + plotWidth / 2 - 25}
                  cy={chart.height - 8}
                  r={2.5}
                  className="chart-point"
                />
                <text
                  x={chart.left + plotWidth / 2 - 12}
                  y={chart.height - 5}
                  className="chart-legend-text"
                >
                  Power (kW)
                </text>
              </g>
            </svg>
          </div>
        </div>

        <div className="compact-section threshold-section small-thresholds">
          <div className="threshold-box compact-small">
            <i className="bi bi-shield-check text-success"></i>
            <div>
              <strong>Voltage Safe</strong>
              <span>225V - 235V</span>
            </div>
          </div>

          <div className="threshold-box compact-small">
            <i className="bi bi-exclamation-triangle text-warning"></i>
            <div>
              <strong>Voltage Warning</strong>
              <span>220V - 225V / 235V - 240V</span>
            </div>
          </div>

          <div className="threshold-box compact-small">
            <i className="bi bi-x-circle text-danger"></i>
            <div>
              <strong>Critical</strong>
              <span>&lt;220V or &gt;240V</span>
            </div>
          </div>

          <div className="threshold-box compact-small">
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