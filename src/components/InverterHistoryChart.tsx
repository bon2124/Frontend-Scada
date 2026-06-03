import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { inverterApi, weatherApi, type InverterData } from '../services/api'

interface InverterHistoryChartProps {
  inverterId: string
  timePeriod: 'today' | '7days' | '30days'
  setTimePeriod: (period: 'today' | '7days' | '30days') => void
}

interface ChartData {
  time: string
  power?: number
  voltage?: number
  frequency?: number
}

interface ParameterConfig {
  key: 'power' | 'voltage' | 'frequency'
  name: string
  color: string
  yAxisId: 'left' | 'right'
  unit: string
  enabled: boolean
  dataKey: keyof InverterData
}

const InverterHistoryChart = ({ inverterId, timePeriod, setTimePeriod }: InverterHistoryChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Parameter configuration - allow up to 3 parameters
  const [parameters, setParameters] = useState<ParameterConfig[]>([
    { key: 'power', name: 'AC Power', color: '#28a745', yAxisId: 'left', unit: 'kW', enabled: true, dataKey: 'AC_Power' },
    { key: 'voltage', name: 'AC Voltage', color: '#007bff', yAxisId: 'right', unit: 'V', enabled: true, dataKey: 'AC_Voltage' },
    { key: 'frequency', name: 'Frequency', color: '#dc3545', yAxisId: 'right', unit: 'Hz', enabled: true, dataKey: 'AC_Frequency' },
  ])

  // Get enabled parameters (max 3)
  const enabledParameters = parameters.filter(p => p.enabled)

  // Toggle parameter visibility (max 3 can be enabled)
  const toggleParameter = (key: ParameterConfig['key']) => {
    const enabledCount = parameters.filter(p => p.enabled).length
    const param = parameters.find(p => p.key === key)
    
    // If trying to enable and already have 3 enabled, don't allow
    if (!param?.enabled && enabledCount >= 3) {
      return
    }
    
    setParameters(prev => prev.map(p => 
      p.key === key ? { ...p, enabled: !p.enabled } : p
    ))
  }

  // Fetch inverter data based on time period
  const fetchInverterData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data: ChartData[] = []
      const now = new Date()
      let startTime: Date
      const endTime = now
      let interval = '1h'

      switch (timePeriod) {
        case 'today':
          startTime = new Date(now)
          startTime.setHours(0, 0, 0, 0)
          interval = '1h'
          break
        case '7days':
          startTime = new Date(now)
          startTime.setDate(now.getDate() - 7)
          interval = '1d'
          break
        case '30days':
          startTime = new Date(now)
          startTime.setDate(now.getDate() - 30)
          interval = '1d'
          break
      }

      try {
        // Try time-series API first for aggregated data (using weather API format)
        const response = await weatherApi.getTimeSeries({
          deviceId: inverterId,
          metrics: 'AC_Power,AC_Voltage,AC_Frequency',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          interval,
          aggregateType: 'avg'
        })

        if (response.data.data && response.data.data.length > 0) {
          data = response.data.data.map(point => ({
            time: timePeriod === 'today' 
              ? new Date(point.timestamp).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  hour12: false 
                })
              : timePeriod === '7days'
              ? new Date(point.timestamp).toLocaleDateString('en-US', { weekday: 'short' })
              : new Date(point.timestamp).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric' 
                }),
            power: (Number(point.AC_Power) || 0) / 1000, // Convert to kW
            voltage: Number(point.AC_Voltage) || 0,
            frequency: Number(point.AC_Frequency) || 0
          }))
        }
      } catch (timeSeriesError) {
        console.log('Time-series API failed, trying history API:', timeSeriesError)
        
        // Fallback to history API
        const response = await inverterApi.getHistory(inverterId, {
          start: startTime.toISOString(),
          stop: endTime.toISOString(),
          limit: timePeriod === 'today' ? 100 : 1000
        })

        if (response.data && response.data.length > 0) {
          // Group data by time intervals (no filtering needed since API already returns data for specific inverter)
          const groupedData = new Map<string, InverterData[]>()
          
          response.data.forEach(point => {
            const date = new Date(point.time)
            let key: string
            
            switch (timePeriod) {
              case 'today':
                key = `${date.getHours().toString().padStart(2, '0')}:00`
                break
              case '7days':
                key = date.toLocaleDateString('en-US', { weekday: 'short' })
                break
              case '30days':
                key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                break
            }
            
            if (!groupedData.has(key)) {
              groupedData.set(key, [])
            }
            groupedData.get(key)!.push(point)
          })

          // Calculate averages
          data = Array.from(groupedData.entries()).map(([time, dataPoints]) => {
            const avgPower = dataPoints.reduce((sum, p) => sum + p.AC_Power, 0) / dataPoints.length / 1000 // kW
            const avgVoltage = dataPoints.reduce((sum, p) => sum + p.AC_Voltage, 0) / dataPoints.length
            const avgFrequency = dataPoints.reduce((sum, p) => sum + p.AC_Frequency, 0) / dataPoints.length
            
            return {
              time,
              power: avgPower,
              voltage: avgVoltage,
              frequency: avgFrequency
            }
          })
        }
      }

      // If no data, show zeros for all time points
      if (data.length === 0) {
        switch (timePeriod) {
          case 'today':
            data = Array.from({ length: 24 }, (_, i) => ({
              time: `${i.toString().padStart(2, '0')}:00`,
              power: 0,
              voltage: 0,
              frequency: 0
            }))
            break
          case '7days': {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            data = days.map(day => ({ 
              time: day, 
              power: 0, 
              voltage: 0, 
              frequency: 0 
            }))
            break
          }
          case '30days': {
            data = Array.from({ length: 30 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (29 - i))
              return {
                time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                power: 0,
                voltage: 0,
                frequency: 0
              }
            })
            break
          }
        }
      }

      setChartData(data)
      console.log(`📊 Inverter ${inverterId} chart data for ${timePeriod}:`, {
        period: timePeriod,
        dataPoints: data.length,
        sampleData: data.slice(0, 3)
      })
    } catch (error) {
      console.error('Failed to fetch inverter data:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load inverter data'
      setError(`Failed to load data: ${errorMessage}`)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [inverterId, timePeriod])

  // Load data when component mounts or parameters change
  useEffect(() => {
    fetchInverterData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchInverterData, 30000)
    return () => clearInterval(interval)
  }, [fetchInverterData])

  // Calculate statistics
  const getStatistics = () => {
    if (chartData.length === 0) return { avg: 0, max: 0, min: 0, total: 0 }
    
    const values = chartData.map(d => d.power || 0).filter(v => v > 0)
    if (values.length === 0) return { avg: 0, max: 0, min: 0, total: 0 }
    
    return {
      avg: values.reduce((sum, v) => sum + v, 0) / values.length,
      max: Math.max(...values),
      min: Math.min(...values),
      total: values.reduce((sum, v) => sum + v, 0) * (timePeriod === 'today' ? 1 : 24) // kWh approximation
    }
  }

  const stats = getStatistics()

  // Check frequency stability (should be around 50 Hz ±0.5)
  const isFrequencyStable = () => {
    const frequencies = chartData.map(d => d.frequency || 0).filter(f => f > 0)
    if (frequencies.length === 0) return 'Unknown'
    
    const avgFreq = frequencies.reduce((sum, f) => sum + f, 0) / frequencies.length
    const deviation = Math.max(...frequencies) - Math.min(...frequencies)
    
    if (avgFreq >= 49.5 && avgFreq <= 50.5 && deviation <= 1) {
      return 'Stable'
    } else if (avgFreq >= 49.0 && avgFreq <= 51.0 && deviation <= 2) {
      return 'Acceptable'
    } else {
      return 'Unstable'
    }
  }

  const frequencyStatus = isFrequencyStable()

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; color: string; name: string; unit?: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded shadow-sm p-3">
          <p className="fw-bold mb-2">{label}</p>
          {payload.map((entry, index) => {
            const param = enabledParameters.find(p => p.name === entry.name)
            return (
              <p key={index} className="mb-1" style={{ color: entry.color }}>
                {entry.name}: {entry.value.toFixed(2)} {param?.unit}
              </p>
            )
          })}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            {inverterId} - Performance History
          </h5>
          <div className="d-flex gap-2 flex-wrap">
            {/* Parameter Selector */}
            <div className="dropdown">
              <button 
                className="btn btn-sm btn-outline-light dropdown-toggle" 
                type="button" 
                id="parameterDropdown" 
                data-bs-toggle="dropdown" 
                aria-expanded="false"
              >
                Parameters ({enabledParameters.length}/3)
              </button>
              <ul className="dropdown-menu" aria-labelledby="parameterDropdown">
                {parameters.map(param => (
                  <li key={param.key}>
                    <button 
                      className={`dropdown-item d-flex align-items-center ${param.enabled ? 'active' : ''}`}
                      onClick={() => toggleParameter(param.key)}
                      disabled={!param.enabled && enabledParameters.length >= 3}
                    >
                      <i className={`bi ${param.enabled ? 'bi-check-square' : 'bi-square'} me-2`}></i>
                      <span className="me-2" style={{ 
                        display: 'inline-block', 
                        width: '12px', 
                        height: '12px', 
                        backgroundColor: param.color,
                        borderRadius: '2px'
                      }}></span>
                      {param.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            {/* Time Period Selector */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${timePeriod === 'today' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setTimePeriod('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={`btn ${timePeriod === '7days' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setTimePeriod('7days')}
              >
                7 Days
              </button>
              <button
                type="button"
                className={`btn ${timePeriod === '30days' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setTimePeriod('30days')}
              >
                30 Days
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* Statistics Row */}
        <div className="row text-center mb-4">
          <div className="col-md-3 col-6 mb-3 mb-md-0">
            <div className="border rounded p-3 bg-light h-100">
              <i className="bi bi-arrow-up-circle text-success fs-3"></i>
              <h5 className="mb-0 mt-2">{stats.max.toFixed(2)} kW</h5>
              <small className="text-muted">Peak Power</small>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-3 mb-md-0">
            <div className="border rounded p-3 bg-light h-100">
              <i className="bi bi-dash-circle text-primary fs-3"></i>
              <h5 className="mb-0 mt-2">{stats.avg.toFixed(2)} kW</h5>
              <small className="text-muted">Average Power</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="border rounded p-3 bg-light h-100">
              <i className="bi bi-lightning-charge-fill text-info fs-3"></i>
              <h5 className="mb-0 mt-2">{stats.total.toFixed(0)} kWh</h5>
              <small className="text-muted">Energy Generated</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="border rounded p-3 bg-light h-100">
              <i className={`bi ${
                frequencyStatus === 'Stable' ? 'bi-check-circle text-success' :
                frequencyStatus === 'Acceptable' ? 'bi-exclamation-triangle text-warning' :
                'bi-x-circle text-danger'
              } fs-3`}></i>
              <h6 className="mb-0 mt-2 fw-bold">{frequencyStatus}</h6>
              <small className="text-muted">Frequency Status</small>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: '400px', width: '100%', minHeight: '400px', minWidth: '300px' }}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <div className="spinner-border text-info" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading inverter data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
                <p className="mt-3 text-muted">{error}</p>
                <button className="btn btn-sm btn-outline-primary" onClick={fetchInverterData}>
                  <i className="bi bi-arrow-clockwise me-1"></i>
                  Retry
                </button>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
                <p className="mt-3 text-muted">No data available for {inverterId} in the selected period</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%" minWidth={300} minHeight={350}>
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
                  angle={timePeriod === '30days' ? -45 : 0}
                  textAnchor={timePeriod === '30days' ? 'end' : 'middle'}
                  height={timePeriod === '30days' ? 60 : 30}
                  interval={timePeriod === 'today' ? 1 : 0}
                  tick={{ fontSize: 12 }}
                  stroke="#666"
                />
                
                {/* Left Y-Axis for Power */}
                <YAxis 
                  yAxisId="left"
                  label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                  tick={{ fontSize: 12 }}
                  stroke="#28a745"
                  domain={[0, 'auto']}
                />
                
                {/* Right Y-Axis for other parameters */}
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  label={{ value: 'Voltage/Current/Frequency', angle: 90, position: 'insideRight' }}
                  tick={{ fontSize: 12 }}
                  stroke="#007bff"
                  domain={[0, 'auto']}
                />
                
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                
                {/* Render lines for enabled parameters */}
                {enabledParameters.map(param => (
                  <Line
                    key={param.key}
                    yAxisId={param.yAxisId}
                    type="monotone"
                    dataKey={param.key}
                    stroke={param.color}
                    strokeWidth={param.key === 'power' ? 3 : 2}
                    name={param.name}
                    dot={{ 
                      r: param.key === 'power' ? 4 : 3, 
                      fill: param.color, 
                      strokeWidth: 2, 
                      stroke: '#fff' 
                    }}
                    activeDot={{ 
                      r: param.key === 'power' ? 7 : 6, 
                      fill: param.color, 
                      stroke: '#fff', 
                      strokeWidth: 2 
                    }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default InverterHistoryChart