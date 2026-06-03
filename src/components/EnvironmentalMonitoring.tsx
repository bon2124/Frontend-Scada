import { useState, useEffect, useCallback } from 'react'
import { weatherApi, type WeatherData } from '../services/api'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

const EnvironmentalMonitoring = () => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([])
    const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days'>('today')
    const [chartData, setChartData] = useState<{ time: string; irradiance: number; ambientTemp: number; moduleTemp: number }[]>([])
    const [chartType, setChartType] = useState<'line' | 'bar'>('line')

    // Fetch current weather data
    const fetchWeatherData = useCallback(async () => {
        try {
            const response = await weatherApi.get()
            setWeatherData(response.data)
        } catch (err) {
            console.error('Error fetching weather data:', err)
        }
    }, [])

    // Fetch weather history using optimized approach
    const fetchWeatherHistory = useCallback(async () => {
        try {
            const now = new Date()
            let startTime: string
            const limit = 1000

            // Calculate start time based on selected period
            if (timePeriod === 'today') {
                // Get data from start of today (00:00:00) in local timezone
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
                startTime = startOfDay.toISOString()
                console.log(`Today time range: ${startTime} to ${now.toISOString()}`)
                console.log(`Local start of day: ${startOfDay.toLocaleString()}`)
                console.log(`UTC start of day: ${startOfDay.toISOString()}`)
            } else if (timePeriod === '7days') {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                sevenDaysAgo.setHours(0, 0, 0, 0)
                startTime = sevenDaysAgo.toISOString()
            } else if (timePeriod === '30days') {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                thirtyDaysAgo.setHours(0, 0, 0, 0)
                startTime = thirtyDaysAgo.toISOString()
            } else {
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
            }

            // Try new time-series API first with correct metric names
            try {
                console.log('Trying time-series API with params:', {
                    deviceId: 'weather',
                    metrics: 'Ambient_Temp,Irradiance,Module_Temp',
                    startTime,
                    endTime: now.toISOString(),
                    interval: timePeriod === 'today' ? '1h' : timePeriod === '7days' ? '4h' : '1d',
                    aggregateType: 'mean'
                })

                const timeSeriesResponse = await weatherApi.getTimeSeries({
                    deviceId: 'weather',
                    metrics: 'Ambient_Temp,Irradiance,Module_Temp', // Correct metric names from API docs
                    startTime,
                    endTime: now.toISOString(),
                    interval: timePeriod === 'today' ? '1h' : timePeriod === '7days' ? '4h' : '1d',
                    aggregateType: 'avg' // Fixed: use 'avg' instead of 'mean'
                })

                console.log('Time-series API response:', timeSeriesResponse.data)
                console.log('Sample time-series data points:', timeSeriesResponse.data.data.slice(0, 5))
                console.log('Full time-series data:', timeSeriesResponse.data.data)

                // Transform time-series response to WeatherData format
                const transformedData: WeatherData[] = timeSeriesResponse.data.data.map(item => ({
                    Ambient_Temp: typeof item.Ambient_Temp === 'number' ? item.Ambient_Temp : parseFloat(item.Ambient_Temp as string) || 0,
                    Irradiance: typeof item.Irradiance === 'number' ? item.Irradiance : parseFloat(item.Irradiance as string) || 0,
                    Module_Temp: typeof item.Module_Temp === 'number' ? item.Module_Temp : parseFloat(item.Module_Temp as string) || 0,
                    time: item.timestamp
                }))

                console.log(`Time-series data for ${timePeriod}:`, transformedData.length, 'rows')
                console.log('Transformed data sample:', transformedData.slice(0, 3))
                console.log('Transformed data with irradiance values:', transformedData.map(d => ({
                    time: d.time,
                    irradiance: d.Irradiance,
                    ambientTemp: d.Ambient_Temp,
                    moduleTemp: d.Module_Temp
                })))
                if (transformedData.length > 0) {
                    setWeatherHistory(transformedData)
                    return // Use time-series data successfully
                }

            } catch (tsErr) {
                console.error('Time-series API failed with error:', tsErr)
                if (tsErr && typeof tsErr === 'object' && 'response' in tsErr) {
                    const axiosError = tsErr as { response?: { data?: unknown; status?: number } }
                    console.error('API Error Response:', axiosError.response?.data)
                    console.error('API Error Status:', axiosError.response?.status)
                }
                // Continue to fallback API below
            }

            // Use the working history API as fallback
            console.log('Using history API with params:', {
                start: startTime,
                stop: now.toISOString(),
                limit
            })

            const response = await weatherApi.getHistory({
                start: startTime,
                stop: now.toISOString(),
                limit
            })

            // Log response for debugging
            console.log(`Weather history for ${timePeriod}:`, response.data.length, 'rows')
            if (response.data.length > 0) {
                console.log('Time range in response:', response.data[0].time, 'to', response.data[response.data.length - 1].time)
                console.log('Sample data:', response.data.slice(0, 3))

                // Check if we got data from the right time period
                const firstDataTime = new Date(response.data[0].time)
                const lastDataTime = new Date(response.data[response.data.length - 1].time)
                const requestedStartTime = new Date(startTime)

                console.log('Requested start time:', requestedStartTime.toISOString())
                console.log('Actual first data time:', firstDataTime.toISOString())
                console.log('Actual last data time:', lastDataTime.toISOString())
                console.log('Time difference (hours):', (firstDataTime.getTime() - requestedStartTime.getTime()) / (1000 * 60 * 60))

                if (Math.abs(firstDataTime.getTime() - requestedStartTime.getTime()) > 2 * 60 * 60 * 1000) {
                    console.warn('⚠️  API returned data from wrong time period!')
                }
            } else {
                console.warn('⚠️  No data returned from API')
            }

            setWeatherHistory(response.data)
        } catch (err) {
            console.error('Error fetching weather history:', err)
        }
    }, [timePeriod])

    // Process weather history data for chart
    useEffect(() => {
        if (weatherHistory.length === 0) {
            setChartData([])
            return
        }

        let processedData: { time: string; irradiance: number; ambientTemp: number; moduleTemp: number }[] = []

        switch (timePeriod) {
            case 'today': {
                // For time-series data, it's already hourly aggregated, just format time
                if (weatherHistory.length > 0 && weatherHistory[0].time.includes('T') && weatherHistory[0].time.includes('Z')) {
                    // Time-series API data - already aggregated hourly
                    processedData = weatherHistory.map(item => {
                        const date = new Date(item.time)
                        return {
                            time: date.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }),
                            irradiance: item.Irradiance,
                            ambientTemp: item.Ambient_Temp,
                            moduleTemp: item.Module_Temp
                        }
                    })
                    console.log('Time-series processed data:', processedData)
                    console.log('Final chart data with values:', processedData.map(d => ({
                        time: d.time,
                        irradiance: d.irradiance,
                        ambientTemp: d.ambientTemp,
                        moduleTemp: d.moduleTemp
                    })))
                } else {
                    // Fallback history API data - needs aggregation
                    const hourlyData = new Map<number, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()

                    console.log('Processing today data, total items:', weatherHistory.length)
                    console.log('Time range:', weatherHistory[0]?.time, 'to', weatherHistory[weatherHistory.length - 1]?.time)

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

                    // Fill missing hours with 0 values from start of day to current hour
                    const currentHour = new Date().getHours()
                    const completeHourlyData = new Map<number, { irradiance: number; ambientTemp: number; moduleTemp: number }>()

                    for (let hour = 0; hour <= currentHour; hour++) {
                        if (hourlyData.has(hour)) {
                            // Use actual data if available
                            const data = hourlyData.get(hour)!
                            completeHourlyData.set(hour, {
                                irradiance: data.count > 0 ? data.sum.irradiance / data.count : 0,
                                ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                                moduleTemp: data.count > 0 ? data.sum.moduleTemp / data.count : 0
                            })
                        } else {
                            // Set missing hours to 0 (no fake data)
                            completeHourlyData.set(hour, {
                                irradiance: 0,
                                ambientTemp: 0,
                                moduleTemp: 0
                            })
                        }
                    }

                    // Create hourly data points from 0 to current hour
                    processedData = Array.from(completeHourlyData.entries())
                        .map(([hour, data]) => ({
                            time: `${hour.toString().padStart(2, '0')}:00`,
                            irradiance: data.irradiance,
                            ambientTemp: data.ambientTemp,
                            moduleTemp: data.moduleTemp
                        }))
                        .sort((a, b) => a.time.localeCompare(b.time))

                    console.log('Hourly data (real data + 0 for missing):', processedData)
                }
                break
            }

            case '7days': {
                // Group by day for 7-day view
                const dailyData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()

                weatherHistory.forEach(item => {
                    const date = new Date(item.time)
                    const dateKey = date.toISOString().split('T')[0] // YYYY-MM-DD

                    if (!dailyData.has(dateKey)) {
                        dailyData.set(dateKey, {
                            sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                            count: 0
                        })
                    }

                    const existing = dailyData.get(dateKey)!
                    existing.sum.irradiance += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp += item.Module_Temp
                    existing.count++
                })

                processedData = Array.from(dailyData.entries())
                    .map(([dateKey, data]) => {
                        const date = new Date(dateKey)
                        return {
                            time: date.toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric'
                            }),
                            irradiance: data.count > 0 ? data.sum.irradiance / data.count : 0,
                            ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                            moduleTemp: data.count > 0 ? data.sum.moduleTemp / data.count : 0
                        }
                    })
                    .sort((a, b) => a.time.localeCompare(b.time))
                break
            }

            case '30days': {
                // Group by date for 30-day view
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

                processedData = Array.from(monthlyData.entries())
                    .map(([dateKey, data]) => ({
                        time: dateKey,
                        irradiance: data.count > 0 ? data.sum.irradiance / data.count : 0,
                        ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                        moduleTemp: data.count > 0 ? data.sum.moduleTemp / data.count : 0
                    }))
                    .sort((a, b) => {
                        const [aMonth, aDay] = a.time.split('/').map(Number)
                        const [bMonth, bDay] = b.time.split('/').map(Number)
                        return aMonth - bMonth || aDay - bDay
                    })
                break
            }
        }

        setChartData(processedData)
    }, [weatherHistory, timePeriod])    // Custom Tooltip Component for Chart
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

    // Initial fetch and periodic updates
    useEffect(() => {
        fetchWeatherData()
        fetchWeatherHistory()

        // Update both current weather data and chart history every 30 seconds (good for demo)
        const interval = setInterval(() => {
            fetchWeatherData()
            fetchWeatherHistory()
        }, 30000)

        return () => clearInterval(interval)
    }, [fetchWeatherData, fetchWeatherHistory, timePeriod]) // Re-fetch when time period changes

    // Additional useEffect for initial data fetch
    useEffect(() => {
        fetchWeatherData()
        fetchWeatherHistory()
    }, [fetchWeatherData, fetchWeatherHistory])

    // Get irradiance level status
    const getIrradianceStatus = (value: number) => {
        if (value >= 900) return { color: 'success', text: 'Excellent' }
        if (value >= 700) return { color: 'primary', text: 'Good' }
        if (value >= 500) return { color: 'warning', text: 'Moderate' }
        return { color: 'danger', text: 'Low' }
    }

    // Get ambient temperature status
    const getAmbientTempStatus = (temp: number) => {
        if (temp >= 35) return { color: 'danger', text: 'Hot' }
        if (temp >= 25) return { color: 'warning', text: 'Warm' }
        if (temp >= 15) return { color: 'primary', text: 'Mild' }
        return { color: 'success', text: 'Cool' }
    }

    // Get module temperature status
    const getModuleTempStatus = (module: number, ambient: number) => {
        const diff = module - ambient
        if (diff > 25) return { color: 'danger', text: 'Overheating Risk', icon: 'thermometer-high' }
        if (diff > 20) return { color: 'warning', text: 'High', icon: 'thermometer-half' }
        return { color: 'success', text: 'Normal', icon: 'thermometer' }
    }

    // Don't render if no weather data
    if (!weatherData) {
        return (
            <div className="card shadow-sm">
                <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">
                        <i className="bi bi-sun me-2"></i>
                        Environmental Monitoring
                    </h5>
                </div>
                <div className="card-body text-center">
                    <div className="spinner-border text-warning" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading weather data...</p>
                </div>
            </div>
        )
    }

    const irradianceStatus = getIrradianceStatus(weatherData.Irradiance)
    const moduleTempStatus = getModuleTempStatus(weatherData.Module_Temp, weatherData.Ambient_Temp)
    const ambientTempStatus = getAmbientTempStatus(weatherData.Ambient_Temp)

    return (
        <>

            {/* Weather Data */}
            <div className="card shadow-sm">
                <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">
                        <i className="bi bi-sun me-2"></i>
                        Environmental Monitoring
                    </h5>
                </div>
                <div className="card-body">
                    <div className="row g-3">
                        {/* Irradiance */}
                        <div className="col-lg-4 col-md-6">
                            <div className="border rounded p-3 h-100 bg-light">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="mb-0">
                                        <i className="bi bi-brightness-high text-warning"></i> Irradiance
                                    </h6>
                                    <span className={`badge bg-${irradianceStatus.color}`}>
                                        {irradianceStatus.text}
                                    </span>
                                </div>
                                <div className="text-center py-4">
                                    <div className="mb-3">
                                        <i className="bi bi-brightness-high"
                                            style={{
                                                fontSize: '3rem', color: irradianceStatus.color === 'danger' ? '#dc3545' :
                                                    irradianceStatus.color === 'warning' ? '#ffc107' :
                                                        irradianceStatus.color === 'primary' ? '#0d6efd' : '#28a745'
                                            }}></i>
                                    </div>
                                    <h1 className={`display-4 mb-0 text-${irradianceStatus.color}`}>
                                        {weatherData.Irradiance.toFixed(0)}
                                    </h1>
                                    <small className="text-muted">W/m² Solar Irradiance</small>
                                </div>
                                <div className="mt-3 small text-muted">
                                    <i className="bi bi-info-circle"></i> Solar radiation intensity
                                </div>
                            </div>
                        </div>

                        {/* Ambient Temperature */}
                        <div className="col-lg-4 col-md-6">
                            <div className="border rounded p-3 h-100 bg-light">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="mb-0">
                                        <i className={`bi bi-thermometer-sun text-${ambientTempStatus.color}`}></i> Ambient Temperature
                                    </h6>
                                    <span className={`badge bg-${ambientTempStatus.color}`}>
                                        {ambientTempStatus.text}
                                    </span>
                                </div>
                                <div className="text-center py-4">
                                    <div className="mb-3">
                                        <i className="bi bi-thermometer-sun" style={{
                                            fontSize: '3rem',
                                            color: ambientTempStatus.color === 'danger' ? '#dc3545' :
                                                ambientTempStatus.color === 'warning' ? '#ffc107' :
                                                    ambientTempStatus.color === 'primary' ? '#0d6efd' : '#28a745'
                                        }}></i>
                                    </div>
                                    <h1 className={`display-4 mb-0 text-${ambientTempStatus.color}`}>{weatherData.Ambient_Temp.toFixed(1)}°C</h1>
                                    <small className="text-muted">Environmental Temperature</small>
                                </div>
                                <div className="mt-3 small text-muted">
                                    <i className="bi bi-info-circle"></i> Ambient temperature in the shade
                                </div>
                            </div>
                        </div>

                        {/* Module Temperature */}
                        <div className="col-lg-4 col-md-12">
                            <div className="border rounded p-3 h-100 bg-light">
                                <div className="d-flex align-items-center justify-content-between mb-3">
                                    <h6 className="mb-0">
                                        <i className={`bi bi-${moduleTempStatus.icon} text-${moduleTempStatus.color}`}></i> Module Temperature
                                    </h6>
                                    <span className={`badge bg-${moduleTempStatus.color}`}>
                                        {moduleTempStatus.text}
                                    </span>
                                </div>
                                <div className="text-center py-4">
                                    <div className="mb-3">
                                        <i className={`bi bi-${moduleTempStatus.icon}`}
                                            style={{ fontSize: '3rem', color: moduleTempStatus.color === 'danger' ? '#dc3545' : moduleTempStatus.color === 'warning' ? '#ffc107' : '#28a745' }}></i>
                                    </div>
                                    <h1 className={`display-4 mb-0 text-${moduleTempStatus.color}`}>
                                        {weatherData.Module_Temp.toFixed(1)}°C
                                    </h1>
                                    <small className="text-muted">Solar Module Temperature</small>
                                </div>
                                <div className="mt-3 small text-muted">
                                    <i className="bi bi-info-circle"></i> Temperature of the solar panel surface
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Location Map and Environmental History in one row */}
            <div className="row mt-3 g-3">
                {/* Location Map */}
                <div className="col-lg-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-danger text-white">
                            <h6 className="mb-0">
                                <i className="bi bi-geo-alt-fill me-2"></i>
                                Solar Plant Location
                            </h6>
                        </div>
                        <div className="card-body p-2">
                            <div className="ratio ratio-16x9">
                                <iframe
                                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30670.74003548546!2d108.1117601743164!3d16.0736606!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314218d68dff9545%3A0x714561e9f3a7292c!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBCw6FjaCBLaG9hIC0gxJDhuqFpIGjhu41jIMSQw6AgTuG6tW5n!5e0!3m2!1svi!2s!4v1761808003776!5m2!1svi!2s"
                                    style={{ border: 0 }}
                                    allowFullScreen
                                    loading="lazy"
                                    referrerPolicy="no-referrer-when-downgrade"
                                    title="Solar Plant Location"
                                ></iframe>
                            </div>
                            <div className="mt-2 text-center">
                                <small className="text-muted">
                                    <i className="bi bi-building"></i> Trường Đại học Bách Khoa - Đại học Đà Nẵng
                                </small>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Environmental History */}
                <div className="col-lg-6">
                    <div className="card shadow-sm h-100">
                        <div className="card-header bg-info text-white">
                            <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                                <h6 className="mb-0">
                                    <i className="bi bi-graph-up me-2"></i>
                                    Environmental History
                                </h6>
                                <div className="d-flex gap-2 flex-wrap">
                                    {/* Chart Type Selector */}
                                    <div className="btn-group btn-group-sm" role="group">
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
                            {/* Chart */}
                            <div style={{ height: '400px' }}>
                                {weatherHistory.length === 0 ? (
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
                                        {chartType === 'line' ? (
                                            <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                                <XAxis
                                                    dataKey="time"
                                                    angle={timePeriod === '30days' ? -45 : 0}
                                                    textAnchor={timePeriod === '30days' ? 'end' : 'middle'}
                                                    height={timePeriod === '30days' ? 60 : 30}
                                                    interval={timePeriod === 'today' ? 1 : 0}
                                                    tick={{ fontSize: 12 }}
                                                    stroke="#666"
                                                />
                                                <YAxis
                                                    yAxisId="left"
                                                    label={{ value: 'Irradiance (W/m²)', angle: -90, position: 'insideLeft' }}
                                                    tick={{ fontSize: 12 }}
                                                    stroke="#ffc107"
                                                    domain={[0, 1000]}
                                                />
                                                <YAxis
                                                    yAxisId="right"
                                                    orientation="right"
                                                    label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight' }}
                                                    tick={{ fontSize: 12 }}
                                                    stroke="#dc3545"
                                                    domain={[0, 70]}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                                <Line
                                                    yAxisId="left"
                                                    type="monotone"
                                                    dataKey="irradiance"
                                                    stroke="#ffc107"
                                                    strokeWidth={3}
                                                    name="Irradiance"
                                                    unit=" W/m²"
                                                    dot={{ r: 4, fill: '#ffc107', strokeWidth: 2, stroke: '#fff' }}
                                                    activeDot={{ r: 7, fill: '#ffc107', stroke: '#fff', strokeWidth: 2 }}
                                                />
                                                <Line
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="ambientTemp"
                                                    stroke="#0dcaf0"
                                                    strokeWidth={2}
                                                    name="Ambient Temp"
                                                    unit="°C"
                                                    dot={{ r: 3, fill: '#0dcaf0', strokeWidth: 1, stroke: '#fff' }}
                                                    activeDot={{ r: 6 }}
                                                />
                                                <Line
                                                    yAxisId="right"
                                                    type="monotone"
                                                    dataKey="moduleTemp"
                                                    stroke="#dc3545"
                                                    strokeWidth={2}
                                                    name="Module Temp"
                                                    unit="°C"
                                                    dot={{ r: 3, fill: '#dc3545', strokeWidth: 1, stroke: '#fff' }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        ) : chartType === 'bar' ? (
                                            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                                <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                                <XAxis
                                                    dataKey="time"
                                                    angle={timePeriod === '30days' ? -45 : 0}
                                                    textAnchor={timePeriod === '30days' ? 'end' : 'middle'}
                                                    height={timePeriod === '30days' ? 60 : 30}
                                                    interval={timePeriod === 'today' ? 1 : 0}
                                                    tick={{ fontSize: 12 }}
                                                    stroke="#666"
                                                />
                                                <YAxis
                                                    label={{ value: 'Irradiance (W/m²)', angle: -90, position: 'insideLeft' }}
                                                    tick={{ fontSize: 12 }}
                                                    stroke="#666"
                                                    domain={[0, 'auto']}
                                                />
                                                <Tooltip content={<CustomTooltip />} />
                                                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                                                <Bar dataKey="irradiance" fill="#ffc107" name="Irradiance (W/m²)" />
                                            </BarChart>
                                        ) : null}
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default EnvironmentalMonitoring