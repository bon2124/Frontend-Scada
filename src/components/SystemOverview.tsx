import { useState, useEffect } from 'react'
import { weatherApi, inverterApi, powerMeterApi } from '../services/api'
import type { WeatherData, InverterData, PowerMeterData } from '../services/types'

export default function SystemOverview() {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [inverters, setInverters] = useState<InverterData[]>([])
    const [powerMeterData, setPowerMeterData] = useState<PowerMeterData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Fetch all system data
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
                // Only take first 3 inverters (INV1, INV2, INV3) to match 3-phase power meter
                const first3Inverters = (inverterResponse.data || []).slice(0, 3)
                setInverters(first3Inverters)
                setPowerMeterData(powerMeterResponse.data)
            } catch (error) {
                console.error('Failed to fetch system data:', error)
                setError('Failed to load system data')
            } finally {
                setLoading(false)
            }
        }

        fetchSystemData()
        // Refresh every 30 seconds
        const interval = setInterval(fetchSystemData, 30000)
        return () => clearInterval(interval)
    }, [])

    // Calculate total system power
    const getTotalSystemPower = () => {
        return inverters.reduce((total, inv) => total + (inv.AC_Power || 0), 0) / 1000 // kW
    }

    // Calculate system efficiency
    const getSystemEfficiency = () => {
        if (!weatherData?.Irradiance || weatherData.Irradiance === 0) return 0
        const totalPower = getTotalSystemPower()
        // Assuming panel area and standard test conditions
        const theoreticalMaxPower = (weatherData.Irradiance / 1000) * 100 // Simplified calculation
        return theoreticalMaxPower > 0 ? (totalPower / theoreticalMaxPower) * 100 : 0
    }

    // Get inverter status
    const getInverterStatus = (inverter: InverterData) => {
        if (!inverter.Control_Enable_Status) return 'off'
        if (inverter.AC_Power < 100) return 'warning'
        return 'active'
    }

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'success'
            case 'warning': return 'warning'
            case 'off': return 'secondary'
            default: return 'secondary'
        }
    }

    // Format power values
    const formatPower = (power: number) => (power / 1000).toFixed(2)

    // Get phase data from power meter
    const getPhaseData = (phaseNumber: 1 | 2 | 3) => {
        if (!powerMeterData) return { voltage: 0, current: 0, power: 0 }

        return {
            voltage: powerMeterData[`Voltage_U${phaseNumber}` as keyof PowerMeterData] as number || 0,
            current: powerMeterData[`Current_I${phaseNumber}` as keyof PowerMeterData] as number || 0,
            power: powerMeterData[`Power_P${phaseNumber}` as keyof PowerMeterData] as number || 0
        }
    }

    if (loading) {
        return (
            <div className="container-fluid py-4">
                <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
                    <div className="text-center">
                        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p className="mt-3 text-muted fs-5">Loading System Overview...</p>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="container-fluid py-4">
                <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                </div>
            </div>
        )
    }

    return (
        <div className="container py-4">
            {/* Header */}
            <div className="row mb-4">
                <div className="col-12">
                    <div className="d-flex justify-content-between align-items-center">
                        <div>
                            <h2 className="mb-1">
                                <i className="bi bi-diagram-3 me-3"></i>
                                Solar Power System Overview
                            </h2>
                            <p className="mb-0 opacity-75">
                                System Overview of Solar Power Generation and Distribution
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* System Flow Diagram */}
            <div className="row">
                <div className="col-12">
                    <div className="card border-success">
                        <div className="card-header bg-success text-white">
                            <h5 className="mb-0">
                                <i className="bi bi-diagram-3 me-2"></i>
                                System Power Flow Diagram
                            </h5>
                        </div>
                        <div className="card-body">
                            <div className="mb-4">
                                <h6 className="text-center mb-3 text-muted">
                                    Solar Energy → DC Conversion → Inverter Processing → Power Meter
                                </h6>
                            </div>

                            {inverters.map((inverter, index) => {
                                const status = getInverterStatus(inverter)
                                const phaseNumber = (index + 1) as 1 | 2 | 3
                                const phaseData = getPhaseData(phaseNumber)

                                return (
                                    <div key={inverter.inverter_id} className="mb-4">
                                        <div className={`p-3 rounded border ${status !== 'off' ? 'bg-white' : 'bg-light'}`}>
                                            {/* Inverter Header */}
                                            <div className="row mb-3">
                                                <div className="col-12">
                                                    <div className="d-flex justify-content-between align-items-center">
                                                        <h6 className={`mb-0 fw-bold`}>
                                                            <i className={`bi bi-${index + 1}-circle me-2`}></i>
                                                            {inverter.inverter_id}
                                                        </h6>
                                                        <span className={`badge bg-${getStatusColor(status)}`}>
                                                            {status === 'active' ? 'Operating' : status === 'warning' ? 'Low Power' : 'Offline'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Power Flow Diagram */}
                                            <div className="d-flex align-items-center justify-content-between">
                                                {/* Solar Panel */}
                                                <div className="text-center" style={{ minWidth: '80px' }}>
                                                    <i className="bi bi-grid-3x3-gap-fill text-warning" style={{ fontSize: '2.5rem' }}></i>
                                                    <div className="small text-muted mt-1">Solar</div>
                                                    <div className="small fw-bold text-warning">
                                                        {weatherData?.Irradiance?.toFixed(0) || 0} W/m²
                                                    </div>
                                                    <div className="small fw-bold text-danger">
                                                        {weatherData?.Module_Temp?.toFixed(1) || 0}°C
                                                    </div>
                                                </div>

                                                {/* DC Connection Line with Parameters */}
                                                <div className="flex-grow-1 mx-3 position-relative">
                                                    <div style={{ height: '4px', backgroundColor: '#6C757D' }} className="w-100"></div>
                                                    <div className="position-absolute top-0 start-50 translate-middle px-2" style={{ transform: 'translateX(-50%) translateY(-50%)' }}>
                                                        <div className="text-center">
                                                            <div className="small text-primary fw-bold p-1">{formatPower(inverter.DC_Power_MPPT1)} kW</div>
                                                            <div className="small text-primary p-1">{inverter.DC_Voltage_MPPT1?.toFixed(0) || 0}V / {inverter.DC_Current_MPPT1?.toFixed(1) || 0}A</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Inverter */}
                                                <div className="text-center mx-3" style={{ minWidth: '100px' }}>
                                                    <i className={`bi bi-cpu-fill text-${getStatusColor(status)}`} style={{ fontSize: '2.5rem' }}></i>
                                                    <div className="small text-muted mt-1">Inverter</div>
                                                    <div className="small fw-bold">{inverter.inverter_id}</div>
                                                    <div className="small fw-bold">{formatPower(inverter.Control_WMax_Limit)} kW</div>
                                                    <div className="small text-muted">Limit</div>
                                                </div>

                                                {/* AC Connection Line with Parameters */}
                                                <div className="flex-grow-1 mx-3 position-relative">
                                                    <div style={{ height: '4px', backgroundColor: '#6C757D' }} className="w-100"></div>
                                                    <div className="position-absolute top-0 start-50 translate-middle px-2" style={{ transform: 'translateX(-50%) translateY(-50%)' }}>
                                                        <div className="text-center">
                                                            <div className="small text-success fw-bold p-1">{formatPower(inverter.AC_Power)} kW</div>
                                                            <div className="small text-success p-1">{inverter.AC_Voltage?.toFixed(0) || 0}V / {inverter.AC_Frequency?.toFixed(1) || 0}Hz</div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Power Meter Phase */}
                                                <div className="text-center text-primary" style={{ minWidth: '100px' }}>
                                                    <i className={`bi bi-lightning-charge-fill`} style={{ fontSize: '2.5rem' }}></i>
                                                    <div className={`small fw-bold mt-1`}>Power Meter</div>
                                                    <div className="small fw-bold">{phaseData.voltage.toFixed(0)}V</div>
                                                    <div className="small fw-bold">{phaseData.current.toFixed(1)}A</div>
                                                    <div className="small fw-bold">{phaseData.power.toFixed(2)}kW</div>
                                                </div>
                                            </div>

                                            {/* Efficiency Display */}
                                            <div className="mt-3 text-center">
                                                <div className="row">
                                                    <div className="col-6">
                                                        <span className="text-muted">Inverter Efficiency: </span>
                                                        <span className="fw-bold text-info">
                                                            {inverter.DC_Power_MPPT1 > 0
                                                                ? ((inverter.AC_Power / inverter.DC_Power_MPPT1) * 100).toFixed(1)
                                                                : 0}%
                                                        </span>
                                                    </div>
                                                    <div className="col-6">
                                                        <span className="text-muted">Status: </span>
                                                        <span className={`fw-bold text-${getStatusColor(status)}`}>
                                                            {inverter.Control_Enable_Status ? 'Enabled' : 'Disabled'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {/* Total System Output */}
                            <div className="mt-4 p-4 bg-warning bg-opacity-10 rounded border border-warning">
                                <div className="row text-center">
                                    <div className="col-md-3">
                                        <h6 className="text-warning">
                                            <i className="bi bi-lightning-charge-fill me-2"></i>
                                            Total Power
                                        </h6>
                                        <div className="fs-2 fw-bold text-warning">
                                            {powerMeterData ? formatPower(powerMeterData.Total_Power_P) : '0.00'} kW
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <h6 className="text-muted">System Efficiency</h6>
                                        <div className="fs-4 fw-bold text-info">
                                            {getSystemEfficiency().toFixed(1)}%
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <h6 className="text-muted">Active Inverters</h6>
                                        <div className="fs-4 fw-bold text-success">
                                            {inverters.filter(inv => inv.Control_Enable_Status).length}/3
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <h6 className="text-muted">Frequency of supply voltages</h6>
                                        <div className="fs-4 fw-bold text-primary">
                                            {powerMeterData?.Frequency_F?.toFixed(2) || 0} Hz
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}