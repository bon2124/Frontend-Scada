import { useState, useEffect } from 'react'
import { weatherApi, inverterApi, powerMeterApi } from '../services/api'
import type { WeatherData, InverterData, PowerMeterData } from '../services/types'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { mockPowerMeterHistory, mockInverterHistory, mockWeatherHistory } from '../services/mockData'

export default function SystemOverview() {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [inverters, setInverters] = useState<InverterData[]>([])
    const [powerMeterData, setPowerMeterData] = useState<PowerMeterData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedInverter, setSelectedInverter] = useState<string | null>(null)

    useEffect(() => {
        const fetchSystemData = async () => {
            setLoading(true)
            setError(null)
            try {
                const [weatherResponse, inverterResponse, powerMeterResponse] = await Promise.all([
                    weatherApi.get(),
                    inverterApi.getAll(),
                    powerMeterApi.get()
                ])
                setWeatherData(weatherResponse.data)
                setInverters(inverterResponse.data || [])
                setPowerMeterData(powerMeterResponse.data)
            } catch (error) {
                console.error('Failed to fetch system data:', error)
                setError('Failed to load system data')
            } finally {
                setLoading(false)
            }
        }
        fetchSystemData()
        const interval = setInterval(fetchSystemData, 30000)
        return () => clearInterval(interval)
    }, [])

    const prepareChartData = () => {
        const invId = selectedInverter || 'ALL'
        if (invId === 'ALL') {
            return mockPowerMeterHistory.map((pm, index) => {
                const weather = mockWeatherHistory[index]
                const inv1 = mockInverterHistory('INV1')[index]
                const inv2 = mockInverterHistory('INV2')[index]
                const inv3 = mockInverterHistory('INV3')[index]
                const inv4 = mockInverterHistory('INV4')[index]
                const randomVariation = () => (Math.random() - 0.5) * 1.2
                const irradianceVar = () => (Math.random() - 0.5) * 150
                return {
                    time: new Date(pm.time).getHours() + ':00',
                    totalPower: Math.max(0, (pm.Total_Power_P / 1000) + randomVariation()),
                    irradiance: Math.max(0, weather.Irradiance + irradianceVar()),
                    INV1: Math.max(0, (inv1.AC_Power / 1000) + randomVariation()),
                    INV2: Math.max(0, (inv2.AC_Power / 1000) + randomVariation()),
                    INV3: Math.max(0, (inv3.AC_Power / 1000) + randomVariation()),
                    INV4: Math.max(0, (inv4.AC_Power / 1000) + randomVariation()),
                }
            })
        } else {
            return mockInverterHistory(invId).map((inv, index) => {
                const weather = mockWeatherHistory[index]
                const powerVar = () => (Math.random() - 0.5) * 1.5
                const voltageVar = () => (Math.random() - 0.5) * 8
                const currentVar = () => (Math.random() - 0.5) * 2.0
                const irradianceVar = () => (Math.random() - 0.5) * 180
                return {
                    time: new Date(inv.time).getHours() + ':00',
                    acPower: Math.max(0, (inv.AC_Power / 1000) + powerVar()),
                    dcPower: Math.max(0, (inv.DC_Power_MPPT1 / 1000) + powerVar()),
                    voltage: Math.max(200, inv.AC_Voltage + voltageVar()),
                    current: Math.max(0, inv.DC_Current_MPPT1 + currentVar()),
                    irradiance: Math.max(0, weather.Irradiance + irradianceVar()),
                }
            })
        }
    }

    const getCurrentInverter = () => {
        if (!selectedInverter) return null
        return inverters.find(inv => inv.inverter_id === selectedInverter)
    }

    const getTotalSystemPower = () => {
        const currentInv = getCurrentInverter()
        if (currentInv) return currentInv.AC_Power / 1000
        return inverters.reduce((total, inv) => total + (inv.AC_Power || 0), 0) / 1000
    }

    const getActiveInverters = () => {
        if (selectedInverter) return 1
        return inverters.filter(inv => inv.Control_Enable_Status && inv.AC_Power > 100).length
    }

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
                <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }}>
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        )
    }

    if (error) return <div className="alert alert-danger m-4">{error}</div>

    const chartData = prepareChartData()
    const currentInv = getCurrentInverter()

    return (
        <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h2 className="mb-1 fw-bold" style={{ color: '#2c3e50' }}>
                        <i className="bi bi-speedometer2 me-2 text-primary"></i>
                        {selectedInverter ? `${selectedInverter} Detailed View` : 'Solar Power System Overview'}
                    </h2>
                    <p className="text-muted mb-0">
                        <i className="bi bi-clock me-1"></i>
                        Real-time monitoring • Updated every 30 seconds
                    </p>
                </div>
                {selectedInverter && (
                    <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedInverter(null)}>
                        <i className="bi bi-grid-3x3 me-1"></i>View All Inverters
                    </button>
                )}
            </div>

            {/* Key Metrics - Clean White Design */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border shadow-sm h-100 hover-lift" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                        <div className="card-body text-center p-4">
                            <i className="bi bi-lightning-charge-fill text-warning fs-1 mb-2"></i>
                            <div className="small text-muted mb-1">
                                {selectedInverter ? `${selectedInverter} Power` : 'Total System Power'}
                            </div>
                            <h2 className="mb-0 fw-bold text-dark">{getTotalSystemPower().toFixed(2)}</h2>
                            <div className="small text-muted">kW</div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border shadow-sm h-100 hover-lift" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                        <div className="card-body text-center p-4">
                            <i className="bi bi-sun-fill text-danger fs-1 mb-2"></i>
                            <div className="small text-muted mb-1">Solar Irradiance</div>
                            <h2 className="mb-0 fw-bold text-dark">{weatherData?.Irradiance.toFixed(0) || 0}</h2>
                            <div className="small text-muted">W/m²</div>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border shadow-sm h-100 hover-lift" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                        <div className="card-body text-center p-4">
                            {selectedInverter ? (
                                <>
                                    <i className="bi bi-speedometer text-primary fs-1 mb-2"></i>
                                    <div className="small text-muted mb-1">AC Voltage</div>
                                    <h2 className="mb-0 fw-bold text-dark">{currentInv?.AC_Voltage.toFixed(1) || 0}</h2>
                                    <div className="small text-muted">V</div>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-thermometer-half text-info fs-1 mb-2"></i>
                                    <div className="small text-muted mb-1">Module Temperature</div>
                                    <h2 className="mb-0 fw-bold text-dark">{weatherData?.Module_Temp.toFixed(1) || 0}</h2>
                                    <div className="small text-muted">°C</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border shadow-sm h-100 hover-lift" style={{ borderRadius: '12px', backgroundColor: '#ffffff' }}>
                        <div className="card-body text-center p-4">
                            {selectedInverter ? (
                                <>
                                    <i className="bi bi-broadcast text-success fs-1 mb-2"></i>
                                    <div className="small text-muted mb-1">AC Frequency</div>
                                    <h2 className="mb-0 fw-bold text-dark">{currentInv?.AC_Frequency.toFixed(2) || 0}</h2>
                                    <div className="small text-muted">Hz</div>
                                </>
                            ) : (
                                <>
                                    <i className="bi bi-cpu text-success fs-1 mb-2"></i>
                                    <div className="small text-muted mb-1">Active Inverters</div>
                                    <h2 className="mb-0 fw-bold text-dark">{getActiveInverters()}<span className="fs-4 text-muted">/{inverters.length}</span></h2>
                                    <div className="small text-muted">Online</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Inverters Grid */}
            <div className="row g-3 mb-4">
                {inverters.map((inv) => (
                    <div key={inv.inverter_id} className="col-md-6 col-lg-3">
                        <div 
                            className={`card h-100 hover-lift ${selectedInverter === inv.inverter_id ? 'border-primary border-3 shadow' : 'border-0 shadow-sm'}`}
                            style={{ cursor: 'pointer', transition: 'all 0.3s', borderRadius: '12px' }}
                            onClick={() => setSelectedInverter(inv.inverter_id)}
                        >
                            <div className="card-body p-3">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h5 className="mb-0 fw-bold text-dark">{inv.inverter_id}</h5>
                                    <span className={`badge ${inv.AC_Power > 100 ? 'bg-success' : 'bg-secondary'} px-3 py-2`}>
                                        <i className={`bi ${inv.AC_Power > 100 ? 'bi-check-circle-fill' : 'bi-dash-circle-fill'} me-1`}></i>
                                        {inv.AC_Power > 100 ? 'Active' : 'Standby'}
                                    </span>
                                </div>
                                <div className="mb-3 p-3 rounded" style={{ backgroundColor: '#f8f9fa' }}>
                                    <div className="small text-muted mb-1">AC Power</div>
                                    <h3 className="mb-0 fw-bold text-primary">{(inv.AC_Power / 1000).toFixed(2)} <span className="fs-6">kW</span></h3>
                                </div>
                                <div className="row g-2">
                                    <div className="col-6">
                                        <div className="text-center p-2 rounded" style={{ backgroundColor: '#e3f2fd' }}>
                                            <div className="small text-muted">Voltage</div>
                                            <div className="fw-bold text-primary">{inv.AC_Voltage.toFixed(0)} V</div>
                                        </div>
                                    </div>
                                    <div className="col-6">
                                        <div className="text-center p-2 rounded" style={{ backgroundColor: '#e8f5e9' }}>
                                            <div className="small text-muted">Frequency</div>
                                            <div className="fw-bold text-success">{inv.AC_Frequency.toFixed(2)} Hz</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Charts Row */}
            <div className="row g-3 mb-4">
                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                        <div className="card-header bg-white border-0 pt-3 pb-2">
                            <h5 className="mb-1 fw-bold">
                                <i className="bi bi-graph-up text-primary me-2"></i>
                                {selectedInverter ? `${selectedInverter} Power Analysis` : 'System Power Generation'}
                            </h5>
                            <small className="text-muted">24-hour performance data</small>
                        </div>
                        <div className="card-body" style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="time" style={{ fontSize: '12px' }} stroke="#666" />
                                    <YAxis label={{ value: 'Power (kW)', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }} style={{ fontSize: '12px' }} stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                                    {selectedInverter ? (
                                        <>
                                            <Line type="monotone" dataKey="acPower" stroke="#0d6efd" strokeWidth={3} name="AC Power" dot={{ r: 4, fill: '#0d6efd' }} />
                                            <Line type="monotone" dataKey="dcPower" stroke="#ffc107" strokeWidth={2} name="DC Power" dot={{ r: 3, fill: '#ffc107' }} strokeDasharray="5 5" />
                                        </>
                                    ) : (
                                        <>
                                            <Line type="monotone" dataKey="totalPower" stroke="#ffc107" strokeWidth={3} name="Total" dot={{ r: 4, fill: '#ffc107' }} />
                                            <Line type="monotone" dataKey="INV1" stroke="#0d6efd" strokeWidth={2} name="INV1" dot={{ r: 2 }} />
                                            <Line type="monotone" dataKey="INV2" stroke="#198754" strokeWidth={2} name="INV2" dot={{ r: 2 }} />
                                            <Line type="monotone" dataKey="INV3" stroke="#dc3545" strokeWidth={2} name="INV3" dot={{ r: 2 }} />
                                            <Line type="monotone" dataKey="INV4" stroke="#6f42c1" strokeWidth={2} name="INV4" dot={{ r: 2 }} />
                                        </>
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div className="col-lg-6">
                    <div className="card border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                        <div className="card-header bg-white border-0 pt-3 pb-2">
                            <h5 className="mb-1 fw-bold">
                                <i className="bi bi-bar-chart-line text-success me-2"></i>
                                {selectedInverter ? `${selectedInverter} Electrical Parameters` : 'Solar Irradiance'}
                            </h5>
                            <small className="text-muted">24-hour monitoring data</small>
                        </div>
                        <div className="card-body" style={{ height: '400px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                                    <XAxis dataKey="time" style={{ fontSize: '12px' }} stroke="#666" />
                                    <YAxis label={{ value: selectedInverter ? 'V / A' : 'W/m²', angle: -90, position: 'insideLeft', style: { fontSize: '12px' } }} style={{ fontSize: '12px' }} stroke="#666" />
                                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '8px' }} />
                                    <Legend wrapperStyle={{ fontSize: '13px' }} />
                                    {selectedInverter ? (
                                        <>
                                            <Line type="monotone" dataKey="voltage" stroke="#198754" strokeWidth={3} name="Voltage (V)" dot={{ r: 4, fill: '#198754' }} />
                                            <Line type="monotone" dataKey="current" stroke="#dc3545" strokeWidth={2} name="Current (A)" dot={{ r: 3, fill: '#dc3545' }} />
                                        </>
                                    ) : (
                                        <Line type="monotone" dataKey="irradiance" stroke="#ff6b6b" strokeWidth={3} name="Irradiance" dot={{ r: 4, fill: '#ff6b6b' }} />
                                    )}
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Panel for Selected Inverter */}
            {selectedInverter && currentInv && (
                <div className="row mb-4">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header text-white pt-3 pb-3" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px 12px 0 0' }}>
                                <h5 className="mb-0 fw-bold">
                                    <i className="bi bi-info-circle-fill me-2"></i>
                                    {selectedInverter} - Technical Specifications
                                </h5>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4 text-center">
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#e3f2fd' }}>
                                            <i className="bi bi-lightning-charge fs-3 text-primary mb-2 d-block"></i>
                                            <div className="small text-muted mb-2">DC Power (MPPT1)</div>
                                            <h3 className="mb-0 fw-bold text-primary">{(currentInv.DC_Power_MPPT1 / 1000).toFixed(2)}</h3>
                                            <div className="small text-muted">kW</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#e8f5e9' }}>
                                            <i className="bi bi-activity fs-3 text-success mb-2 d-block"></i>
                                            <div className="small text-muted mb-2">DC Voltage</div>
                                            <h3 className="mb-0 fw-bold text-success">{currentInv.DC_Voltage_MPPT1.toFixed(1)}</h3>
                                            <div className="small text-muted">V</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#fff3e0' }}>
                                            <i className="bi bi-diagram-3 fs-3 text-warning mb-2 d-block"></i>
                                            <div className="small text-muted mb-2">DC Current</div>
                                            <h3 className="mb-0 fw-bold text-warning">{currentInv.DC_Current_MPPT1.toFixed(2)}</h3>
                                            <div className="small text-muted">A</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#fce4ec' }}>
                                            <i className="bi bi-speedometer2 fs-3 text-danger mb-2 d-block"></i>
                                            <div className="small text-muted mb-2">Efficiency</div>
                                            <h3 className="mb-0 fw-bold text-danger">
                                                {currentInv.DC_Power_MPPT1 > 0 ? ((currentInv.AC_Power / currentInv.DC_Power_MPPT1) * 100).toFixed(1) : 0}
                                            </h3>
                                            <div className="small text-muted">%</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Grid Status */}
            {!selectedInverter && (
                <div className="row">
                    <div className="col-12">
                        <div className="card border-0 shadow-sm" style={{ borderRadius: '12px' }}>
                            <div className="card-header bg-white border-0 pt-3 pb-2">
                                <h5 className="mb-1 fw-bold">
                                    <i className="bi bi-plug text-info me-2"></i>
                                    Grid Connection Status
                                </h5>
                                <small className="text-muted">Three-phase power distribution</small>
                            </div>
                            <div className="card-body p-4">
                                <div className="row g-4 text-center">
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#e3f2fd', border: '2px solid #2196f3' }}>
                                            <div className="fw-bold text-primary mb-2">Phase 1</div>
                                            <h3 className="mb-2 fw-bold text-dark">{powerMeterData?.Voltage_U1.toFixed(1) || 0} <span className="fs-6">V</span></h3>
                                            <div className="text-muted">{powerMeterData?.Current_I1.toFixed(1) || 0} A</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#e8f5e9', border: '2px solid #4caf50' }}>
                                            <div className="fw-bold text-success mb-2">Phase 2</div>
                                            <h3 className="mb-2 fw-bold text-dark">{powerMeterData?.Voltage_U2.toFixed(1) || 0} <span className="fs-6">V</span></h3>
                                            <div className="text-muted">{powerMeterData?.Current_I2.toFixed(1) || 0} A</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#fff3e0', border: '2px solid #ff9800' }}>
                                            <div className="fw-bold text-warning mb-2">Phase 3</div>
                                            <h3 className="mb-2 fw-bold text-dark">{powerMeterData?.Voltage_U3.toFixed(1) || 0} <span className="fs-6">V</span></h3>
                                            <div className="text-muted">{powerMeterData?.Current_I3.toFixed(1) || 0} A</div>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="p-3 rounded" style={{ backgroundColor: '#f3e5f5', border: '2px solid #9c27b0' }}>
                                            <div className="fw-bold text-purple mb-2">Grid Frequency</div>
                                            <h3 className="mb-2 fw-bold" style={{ color: '#9c27b0' }}>{powerMeterData?.Frequency_F.toFixed(2) || 0}</h3>
                                            <div className="text-muted">Hz</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                .hover-lift {
                    transition: transform 0.3s ease, box-shadow 0.3s ease;
                }
                .hover-lift:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 8px 24px rgba(0,0,0,0.15) !important;
                }
            `}</style>
        </div>
    )
}
