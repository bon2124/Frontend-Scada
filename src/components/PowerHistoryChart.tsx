import { useState, useEffect, useCallback } from 'react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { powerMeterApi, weatherApi } from '../services/api'

interface PowerHistoryChartProps {
  timePeriod: 'today' | '7days' | '30days'
  setTimePeriod: (period: 'today' | '7days' | '30days') => void
}

interface ChartData {
  time: string
  power: number
}

const PowerHistoryChart = ({ timePeriod, setTimePeriod }: PowerHistoryChartProps) => {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area')
  const [loading, setLoading] = useState(false)

  // Fetch real power meter data based on time period
  const fetchPowerData = useCallback(async () => {
    setLoading(true)
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
        // Try time-series API first for aggregated data
        const response = await weatherApi.getTimeSeries({
          deviceId: 'power-meter',
          metrics: 'Total_Power_P',
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
            power: (Number(point.Total_Power_P) || 0) / 1000 // Convert to kW
          }))
        }
      } catch (timeSeriesError) {
        console.log('Time-series API failed, trying history API:', timeSeriesError)
        
        // Fallback to history API
        const response = await powerMeterApi.getHistory({
          start: startTime.toISOString(),
          stop: endTime.toISOString(),
          limit: timePeriod === 'today' ? 100 : 1000
        })

        if (response.data && response.data.length > 0) {
          // Group data by time intervals
          const groupedData = new Map<string, number[]>()
          
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
            groupedData.get(key)!.push(point.Total_Power_P)
          })

          // Calculate averages
          data = Array.from(groupedData.entries()).map(([time, powers]) => ({
            time,
            power: (powers.reduce((sum, p) => sum + p, 0) / powers.length) / 1000 // Convert to kW
          }))
        }
      }

      // If no data, show zeros for all time points
      if (data.length === 0) {
        switch (timePeriod) {
          case 'today':
            data = Array.from({ length: 24 }, (_, i) => ({
              time: `${i.toString().padStart(2, '0')}:00`,
              power: 0
            }))
            break
          case '7days': {
            const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
            data = days.map(day => ({ time: day, power: 0 }))
            break
          }
          case '30days': {
            data = Array.from({ length: 30 }, (_, i) => {
              const date = new Date()
              date.setDate(date.getDate() - (29 - i))
              return {
                time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                power: 0
              }
            })
            break
          }
        }
      }

      setChartData(data)
      console.log(`📊 Power chart data for ${timePeriod}:`, {
        period: timePeriod,
        dataPoints: data.length,
        sampleData: data.slice(0, 3)
      })
    } catch (error) {
      console.error('Failed to fetch power data:', error)
      setChartData([])
    } finally {
      setLoading(false)
    }
  }, [timePeriod])

  // Load data when component mounts or time period changes
  useEffect(() => {
    fetchPowerData()
    // Refresh data every 30 seconds for all views
    const interval = setInterval(fetchPowerData, 30000)
    return () => clearInterval(interval)
  }, [fetchPowerData, timePeriod])

  // Calculate statistics
  const avgPower = chartData.length > 0 ? chartData.reduce((sum, d) => sum + d.power, 0) / chartData.length : 0
  const maxPower = chartData.length > 0 ? Math.max(...chartData.map(d => d.power)) : 0
  const minPower = chartData.length > 0 ? Math.min(...chartData.map(d => d.power)) : 0
  const totalEnergy = chartData.length > 0 ? (chartData.reduce((sum, d) => sum + d.power, 0) * (timePeriod === 'today' ? 1 : 24)) : 0 // kWh

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{ value: number; color: string; name: string }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border rounded shadow-sm p-3">
          <p className="fw-bold mb-2">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              Power: {entry.value.toFixed(2)} kW
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-success text-white">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
          <h5 className="mb-0">
            <i className="bi bi-graph-up me-2"></i>
            Power History
          </h5>
          <div className="d-flex gap-2 flex-wrap">
            {/* Chart Type Selector */}
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className={`btn ${chartType === 'area' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setChartType('area')}
                title="Area Chart"
              >
                <i className="bi bi-graph-up-arrow"></i>
              </button>
              <button
                type="button"
                className={`btn ${chartType === 'line' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setChartType('line')}
                title="Line Chart"
              >
                <i className="bi bi-graph-up"></i>
              </button>
              <button
                type="button"
                className={`btn ${chartType === 'bar' ? 'btn-light' : 'btn-outline-light'}`}
                onClick={() => setChartType('bar')}
                title="Bar Chart"
              >
                <i className="bi bi-bar-chart-fill"></i>
              </button>
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
              <h5 className="mb-0 mt-2">{maxPower.toFixed(2)} kW</h5>
              <small className="text-muted">Peak Power</small>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-3 mb-md-0">
            <div className="border rounded p-3 bg-light h-100">
              <i className="bi bi-dash-circle text-primary fs-3"></i>
              <h5 className="mb-0 mt-2">{avgPower.toFixed(2)} kW</h5>
              <small className="text-muted">Average Power</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="border rounded p-3 bg-light h-100">
              <i className="bi bi-arrow-down-circle text-warning fs-3"></i>
              <h5 className="mb-0 mt-2">{minPower.toFixed(2)} kW</h5>
              <small className="text-muted">Minimum Power</small>
            </div>
          </div>
          <div className="col-md-3 col-6">
            <div className="border rounded p-3 bg-light h-100">
              <i className="bi bi-lightning-charge-fill text-info fs-3"></i>
              <h5 className="mb-0 mt-2">{totalEnergy.toFixed(0)} kWh</h5>
              <small className="text-muted">Total Energy</small>
            </div>
          </div>
        </div>

        {/* Chart */}
        <div style={{ height: '400px' }}>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <div className="spinner-border text-success" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-3 text-muted">Loading power data...</p>
              </div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="d-flex justify-content-center align-items-center h-100">
              <div className="text-center">
                <i className="bi bi-exclamation-triangle text-warning fs-1"></i>
                <p className="mt-3 text-muted">No power data available for the selected period</p>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#007bff" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#007bff" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
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
                  <YAxis 
                    label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Area 
                    type="monotone" 
                    dataKey="power" 
                    stroke="#007bff" 
                    strokeWidth={2} 
                    name="Power (kW)" 
                    fill="url(#areaGradient)"
                    fillOpacity={1}
                  />
                </AreaChart>
              ) : chartType === 'line' ? (
                <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <defs>
                    <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28a745" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#28a745" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
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
                  <YAxis 
                    label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                    stroke="#666"
                    domain={[0, 'auto']}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="power" 
                    stroke="#28a745" 
                    strokeWidth={3} 
                    name="Power (kW)" 
                    fill="url(#powerGradient)"
                    fillOpacity={1}
                    dot={{ r: 4, fill: '#28a745', strokeWidth: 2, stroke: '#fff' }} 
                    activeDot={{ r: 7, fill: '#28a745', stroke: '#fff', strokeWidth: 2 }} 
                  />
                </LineChart>
              ) : chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#28a745" stopOpacity={0.9}/>
                      <stop offset="95%" stopColor="#28a745" stopOpacity={0.6}/>
                    </linearGradient>
                  </defs>
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
                  <YAxis 
                    domain={[0, 'auto']}
                    stroke="#666" 
                    label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft' }}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="power" fill="url(#barGradient)" name="Power (kW)" stroke="#28a745" strokeWidth={1} />
                </BarChart>
              ) : null}
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}

export default PowerHistoryChart
