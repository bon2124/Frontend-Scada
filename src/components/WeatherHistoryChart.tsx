import { useState, useEffect } from 'react'
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
import { weatherApi, type WeatherData } from '../services/api'

interface WeatherHistoryChartProps {
    timePeriod: '1hour' | '6hours' | 'today' | '7days' | '30days'
    setTimePeriod: (period: '1hour' | '6hours' | 'today' | '7days' | '30days') => void
}

interface ChartData {
    time: string
    irradiance?: number
    ambientTemp?: number
    moduleTemp?: number
}

interface ParameterConfig {
    key: keyof WeatherData
    name: string
    color: string
    yAxisId: 'left' | 'right'
    unit: string
    enabled: boolean
}

const WeatherHistoryChart = ({ timePeriod, setTimePeriod }: WeatherHistoryChartProps) => {
    const [chartData, setChartData] = useState<ChartData[]>([])
    const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([])
    const [loading, setLoading] = useState(false)
    
    // Parameter configuration with ability to select up to 3
    const [parameters, setParameters] = useState<ParameterConfig[]>([
        { key: 'Irradiance', name: 'Irradiance', color: '#ffc107', yAxisId: 'left', unit: ' W/m²', enabled: true },
        { key: 'Ambient_Temp', name: 'Ambient Temp', color: '#0dcaf0', yAxisId: 'right', unit: '°C', enabled: true },
        { key: 'Module_Temp', name: 'Module Temp', color: '#dc3545', yAxisId: 'right', unit: '°C', enabled: true }
    ])

    // Fetch weather history from API
    const fetchWeatherHistory = async () => {
        setLoading(true)
        try {
            const response = await weatherApi.getHistory()
            setWeatherHistory(response.data)
        } catch (err) {
            console.error('Error fetching weather history:', err)
        } finally {
            setLoading(false)
        }
    }

    // Toggle parameter visibility (max 3 can be enabled)
    const toggleParameter = (key: keyof WeatherData) => {
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

    // Process weather data based on time period
    useEffect(() => {
        let processedData: ChartData[] = []

        if (weatherHistory.length === 0) {
            setChartData([])
            return
        }

        switch (timePeriod) {
            case '1hour': {
                // Show data for last hour in 5-minute intervals
                const now = new Date()
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
                
                const recentData = weatherHistory.filter(item => {
                    const itemTime = new Date(item.time)
                    return itemTime >= oneHourAgo && itemTime <= now
                })
                
                processedData = recentData.map(item => ({
                    time: new Date(item.time).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        hour12: false 
                    }),
                    irradiance: item.Irradiance,
                    ambientTemp: item.Ambient_Temp,
                    moduleTemp: item.Module_Temp
                }))
                break
            }

            case '6hours': {
                // Show data for last 6 hours in 30-minute intervals
                const now = new Date()
                const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)
                
                const recentData = weatherHistory.filter(item => {
                    const itemTime = new Date(item.time)
                    return itemTime >= sixHoursAgo && itemTime <= now
                })
                
                // Group by 30-minute intervals
                const intervalData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                
                recentData.forEach(item => {
                    const date = new Date(item.time)
                    const intervalKey = `${date.getHours()}:${Math.floor(date.getMinutes() / 30) * 30}`
                    
                    if (!intervalData.has(intervalKey)) {
                        intervalData.set(intervalKey, {
                            sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                            count: 0
                        })
                    }
                    
                    const existing = intervalData.get(intervalKey)!
                    existing.sum.irradiance += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp += item.Module_Temp
                    existing.count++
                })
                
                processedData = Array.from(intervalData.entries()).map(([time, data]) => ({
                    time,
                    irradiance: data.count > 0 ? data.sum.irradiance / data.count : 0,
                    ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                    moduleTemp: data.count > 0 ? data.sum.moduleTemp / data.count : 0
                })).sort((a, b) => a.time.localeCompare(b.time))
                break
            }

            case 'today': {
                // Group by hour (hourly averages for today)
                const hourlyData = new Map<number, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                
                weatherHistory.forEach(item => {
                    const date = new Date(item.time)
                    const hour = date.getHours()
                    
                    if (!hourlyData.has(hour)) {
                        hourlyData.set(hour, {
                            sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                            count: 0
                        })
                    }
                    
                    const existing = hourlyData.get(hour)!
                    existing.sum.irradiance += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp += item.Module_Temp
                    existing.count++
                })
                
                processedData = Array.from(hourlyData.entries()).map(([hour, data]) => ({
                    time: `${hour.toString().padStart(2, '0')}:00`,
                    irradiance: data.count > 0 ? data.sum.irradiance / data.count : 0,
                    ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                    moduleTemp: data.count > 0 ? data.sum.moduleTemp / data.count : 0
                })).sort((a, b) => a.time.localeCompare(b.time))
                break
            }

            case '7days': {
                // Group by day (daily averages)
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const dailyData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                
                weatherHistory.forEach(item => {
                    const date = new Date(item.time)
                    const dayKey = days[date.getDay()]
                    
                    if (!dailyData.has(dayKey)) {
                        dailyData.set(dayKey, {
                            sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                            count: 0
                        })
                    }
                    
                    const existing = dailyData.get(dayKey)!
                    existing.sum.irradiance += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp += item.Module_Temp
                    existing.count++
                })
                
                processedData = days.map(day => {
                    const data = dailyData.get(day)
                    if (data && data.count > 0) {
                        return {
                            time: day,
                            irradiance: data.sum.irradiance / data.count,
                            ambientTemp: data.sum.ambientTemp / data.count,
                            moduleTemp: data.sum.moduleTemp / data.count
                        }
                    }
                    return {
                        time: day,
                        irradiance: 0,
                        ambientTemp: 0,
                        moduleTemp: 0
                    }
                })
                break
            }

            case '30days': {
                // Group by date (daily averages)
                const monthlyData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                
                weatherHistory.forEach(item => {
                    const date = new Date(item.time)
                    const dateKey = `${date.getMonth() + 1}/${date.getDate()}`
                    
                    if (!monthlyData.has(dateKey)) {
                        monthlyData.set(dateKey, {
                            sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                            count: 0
                        })
                    }
                    
                    const existing = monthlyData.get(dateKey)!
                    existing.sum.irradiance += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp += item.Module_Temp
                    existing.count++
                })
                
                processedData = Array.from(monthlyData.entries()).map(([time, data]) => ({
                    time,
                    irradiance: data.count > 0 ? data.sum.irradiance / data.count : 0,
                    ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                    moduleTemp: data.count > 0 ? data.sum.moduleTemp / data.count : 0
                })).sort((a, b) => {
                    const [aMonth, aDay] = a.time.split('/').map(Number)
                    const [bMonth, bDay] = b.time.split('/').map(Number)
                    return aMonth - bMonth || aDay - bDay
                })
                break
            }
        }

        setChartData(processedData)
    }, [weatherHistory, timePeriod])

    // Initial fetch
    useEffect(() => {
        fetchWeatherHistory()
        const interval = setInterval(fetchWeatherHistory, 60000) // Update every minute
        return () => clearInterval(interval)
    }, [])

    // Custom Tooltip Component
    const CustomTooltip = ({ active, payload, label }: { 
        active?: boolean
        payload?: Array<{ color: string; name: string; value: number; unit?: string }>
        label?: string 
    }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-3 border rounded shadow-sm">
                    <p className="fw-bold mb-2">{`Time: ${label}`}</p>
                    {payload.map((pld, index: number) => (
                        <p key={index} style={{ color: pld.color }} className="mb-1">
                            {`${pld.name}: ${pld.value.toFixed(1)}${pld.unit || ''}`}
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    const enabledParameters = parameters.filter(p => p.enabled)

    return (
        <div className="card shadow-sm h-100">
            <div className="card-header bg-info text-white">
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                    <h6 className="mb-0">
                        <i className="bi bi-graph-up me-2"></i>
                        Environmental History Analysis
                    </h6>
                    {/* Time Period Selector */}
                    <div className="btn-group btn-group-sm" role="group">
                        <button
                            type="button"
                            className={`btn ${timePeriod === '1hour' ? 'btn-light' : 'btn-outline-light'}`}
                            onClick={() => setTimePeriod('1hour')}
                        >
                            1 Hour
                        </button>
                        <button
                            type="button"
                            className={`btn ${timePeriod === '6hours' ? 'btn-light' : 'btn-outline-light'}`}
                            onClick={() => setTimePeriod('6hours')}
                        >
                            6 Hours
                        </button>
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

            {/* Parameter Selection */}
            <div className="card-body pb-2">
                <div className="mb-3">
                    <h6 className="mb-2">
                        <i className="bi bi-sliders me-2"></i>
                        Select Parameters to Display (Max 3):
                    </h6>
                    <div className="d-flex flex-wrap gap-2">
                        {parameters.map(param => (
                            <div key={param.key} className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    id={`param-${param.key}`}
                                    checked={param.enabled}
                                    onChange={() => toggleParameter(param.key)}
                                    disabled={!param.enabled && enabledParameters.length >= 3}
                                />
                                <label className="form-check-label" htmlFor={`param-${param.key}`}>
                                    <span 
                                        className="me-1" 
                                        style={{ 
                                            color: param.color, 
                                            fontWeight: 'bold',
                                            fontSize: '1.2em'
                                        }}
                                    >
                                        ●
                                    </span>
                                    {param.name}
                                </label>
                            </div>
                        ))}
                    </div>
                    <small className="text-muted">
                        {enabledParameters.length}/3 parameters selected
                    </small>
                </div>

                {/* Chart */}
                <div style={{ height: '400px' }}>
                    {loading || chartData.length === 0 ? (
                        <div className="d-flex justify-content-center align-items-center h-100">
                            <div className="text-center">
                                <div className="spinner-border text-info" role="status">
                                    <span className="visually-hidden">Loading...</span>
                                </div>
                                <p className="mt-3 text-muted">Loading chart data...</p>
                            </div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                <XAxis
                                    dataKey="time"
                                    label={{ value: 'Time', position: 'insideBottom', offset: -5 }}
                                    angle={timePeriod === '30days' ? -45 : 0}
                                    textAnchor={timePeriod === '30days' ? 'end' : 'middle'}
                                    height={timePeriod === '30days' ? 60 : 30}
                                    interval={timePeriod === 'today' || timePeriod === '1hour' ? 1 : 0}
                                    tick={{ fontSize: 12 }}
                                    stroke="#666"
                                />
                                
                                {/* Left Y-Axis for Irradiance */}
                                <YAxis
                                    yAxisId="left"
                                    label={{ value: 'Irradiance (W/m²)', angle: -90, position: 'insideLeft' }}
                                    tick={{ fontSize: 12 }}
                                    stroke="#ffc107"
                                    domain={[0, 1000]}
                                />
                                
                                {/* Right Y-Axis for Temperature */}
                                <YAxis
                                    yAxisId="right"
                                    orientation="right"
                                    label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight' }}
                                    tick={{ fontSize: 12 }}
                                    stroke="#dc3545"
                                    domain={[0, 70]}
                                />
                                
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                
                                {/* Render lines for enabled parameters */}
                                {enabledParameters.map(param => (
                                    <Line
                                        key={param.key}
                                        yAxisId={param.yAxisId}
                                        type="monotone"
                                        dataKey={param.key === 'Irradiance' ? 'irradiance' : 
                                                param.key === 'Ambient_Temp' ? 'ambientTemp' : 'moduleTemp'}
                                        stroke={param.color}
                                        strokeWidth={param.key === 'Irradiance' ? 3 : 2}
                                        name={param.name}
                                        unit={param.unit}
                                        dot={{ 
                                            r: param.key === 'Irradiance' ? 4 : 3, 
                                            fill: param.color, 
                                            strokeWidth: param.key === 'Irradiance' ? 2 : 1, 
                                            stroke: '#fff' 
                                        }}
                                        activeDot={{ 
                                            r: param.key === 'Irradiance' ? 7 : 6, 
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

export default WeatherHistoryChart