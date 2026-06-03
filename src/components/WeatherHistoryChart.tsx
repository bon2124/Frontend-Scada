// src/components/WeatherHistoryChart.tsx
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
    
    const [parameters, setParameters] = useState<ParameterConfig[]>([
        { key: 'Irradiance', name: 'Irradiance', color: '#ffc107', yAxisId: 'left', unit: ' W/m²', enabled: true },
        { key: 'Ambient_Temp', name: 'Ambient Temp', color: '#0dcaf0', yAxisId: 'right', unit: '°C', enabled: true },
        { key: 'Module_Temp', name: 'Module Temp', color: '#dc3545', yAxisId: 'right', unit: '°C', enabled: true }
    ])

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

    const toggleParameter = (key: keyof WeatherData) => {
        const enabledCount = parameters.filter(p => p.enabled).length
        const param = parameters.find(p => p.key === key)
        if (!param?.enabled && enabledCount >= 3) return
        setParameters(prev => prev.map(p => p.key === key ? { ...p, enabled: !p.enabled } : p))
    }

    useEffect(() => {
        let processedData: ChartData[] = []
        if (weatherHistory.length === 0) {
            setChartData([])
            return
        }

        switch (timePeriod) {
            case '1hour': {
                const now = new Date()
                const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
                const recentData = weatherHistory.filter(item => {
                    const itemTime = new Date(item.time)
                    return itemTime >= oneHourAgo && itemTime <= now
                })
                processedData = recentData.map(item => ({
                    time: new Date(item.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
                    irradiance: item.Irradiance,
                    ambientTemp: item.Ambient_Temp,
                    moduleTemp: item.Module_Temp
                }))
                break
            }
            case '6hours': {
                const now = new Date()
                const sixHoursAgo = new Date(now.getTime() - 6 * 60 * 60 * 1000)
                const recentData = weatherHistory.filter(item => {
                    const itemTime = new Date(item.time)
                    return itemTime >= sixHoursAgo && itemTime <= now
                })
                const intervalData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                recentData.forEach(item => {
                    const date = new Date(item.time)
                    const intervalKey = `${date.getHours()}:${Math.floor(date.getMinutes() / 30) * 30}`
                    if (!intervalData.has(intervalKey)) {
                        intervalData.set(intervalKey, { sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 }, count: 0 })
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
                const hourlyData = new Map<number, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                weatherHistory.forEach(item => {
                    const date = new Date(item.time)
                    const hour = date.getHours()
                    if (!hourlyData.has(hour)) {
                        hourlyData.set(hour, { sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 }, count: 0 })
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
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                const dailyData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                weatherHistory.forEach(item => {
                    const date = new Date(item.time)
                    const dayKey = days[date.getDay()]
                    if (!dailyData.has(dayKey)) {
                        dailyData.set(dayKey, { sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 }, count: 0 })
                    }
                    const existing = dailyData.get(dayKey)!
                    existing.sum.irradiance += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp += item.Module_Temp
                    existing.count++
                })
                processedData = days.map(day => {
                    const data = dailyData.get(day)
                    return data && data.count > 0 ? {
                        time: day,
                        irradiance: data.sum.irradiance / data.count,
                        ambientTemp: data.sum.ambientTemp / data.count,
                        moduleTemp: data.sum.moduleTemp / data.count
                    } : { time: day, irradiance: 0, ambientTemp: 0, moduleTemp: 0 }
                })
                break
            }
            case '30days': {
                const monthlyData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()
                weatherHistory.forEach(item => {
                    const date = new Date(item.time)
                    const dateKey = `${date.getMonth() + 1}/${date.getDate()}`
                    if (!monthlyData.has(dateKey)) {
                        monthlyData.set(dateKey, { sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 }, count: 0 })
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

    useEffect(() => {
        fetchWeatherHistory()
        const interval = setInterval(fetchWeatherHistory, 60000)
        return () => clearInterval(interval)
    }, [])

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-2 border rounded shadow-sm" style={{ fontSize: '12px' }}>
                    <p className="fw-bold mb-1">{`Time: ${label}`}</p>
                    {payload.map((pld: any, idx: number) => (
                        <p key={idx} style={{ color: pld.color }} className="mb-0">
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
        /* ÉP PHẲNG CARD ĐỒ THỊ: Dùng h-100 và overflow-hidden để bám chặt cột bên phải */
        <div className="card shadow-sm d-flex flex-column flex-grow-1 h-100 overflow-hidden bg-white">
            <div className="card-header bg-info text-white py-1 px-3 d-flex justify-content-between align-items-center flex-shrink-0">
                <h6 className="mb-0 small"><i className="bi bi-graph-up me-2"></i>Environmental History Analysis</h6>
                <div className="btn-group btn-group-sm" style={{ scale: '0.85' }}>
                    {['1hour', '6hours', 'today', '7days', '30days'].map((p: any) => (
                        <button key={p} type="button" className={`btn ${timePeriod === p ? 'btn-light' : 'btn-outline-light'} py-0`} onClick={() => setTimePeriod(p)}>{p}</button>
                    ))}
                </div>
            </div>

            <div className="card-body p-2 d-flex flex-column flex-grow-1 overflow-hidden">
                {/* Lọc tham số checkbox ẩn/hiện đường nét */}
                <div className="d-flex flex-wrap align-items-center gap-3 mb-1 bg-light p-1 px-2 rounded flex-shrink-0" style={{ fontSize: '11px' }}>
                    <span className="fw-bold text-muted">Lọc tham số:</span>
                    {parameters.map(param => (
                        <div key={param.key} className="form-check mb-0">
                            <input className="form-check-input" type="checkbox" id={`param-${param.key}`} checked={param.enabled} onChange={() => toggleParameter(param.key)} disabled={!param.enabled && enabledParameters.length >= 3} style={{ cursor: 'pointer' }} />
                            <label className="form-check-label" htmlFor={`param-${param.key}`} style={{ cursor: 'pointer' }}><span className="me-1" style={{ color: param.color }}>●</span>{param.name}</label>
                        </div>
                    ))}
                </div>

                {/* KHUNG BIỂU ĐỒ HẠ XUỐNG CHIỀU CAO "100%" ĐỂ NẰM GỌN TRONG DIỆN TÍCH TRANG CHÍNH */}
                <div className="flex-grow-1 w-100 position-relative overflow-hidden mt-1" style={{ minHeight: '0' }}>
                    {loading || chartData.length === 0 ? (
                        <div className="d-flex justify-content-center align-items-center h-100"><div className="spinner-border text-info" role="status"></div></div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#eef0f2" />
                                <XAxis dataKey="time" angle={timePeriod === '30days' ? -35 : 0} textAnchor={timePeriod === '30days' ? 'end' : 'middle'} interval={timePeriod === 'today' || timePeriod === '1hour' ? 2 : 0} tick={{ fontSize: 10, fill: '#6c757d' }} stroke="#ced4da" height={timePeriod === '30days' ? 40 : 20} tickLine={false} />
                                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#ffc107' }} stroke="#ffc107" domain={[0, 1000]} width={35} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#dc3545' }} stroke="#dc3545" domain={[0, 70]} width={30} tickLine={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Legend wrapperStyle={{ fontSize: '11px', bottom: -5 }} />
                                {enabledParameters.map(param => (
                                    <Line key={param.key} yAxisId={param.yAxisId} type="monotone" dataKey={param.key === 'Irradiance' ? 'irradiance' : param.key === 'Ambient_Temp' ? 'ambientTemp' : 'moduleTemp'} stroke={param.color} strokeWidth={2} name={param.name} unit={param.unit} dot={false} activeDot={{ r: 4 }} />
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