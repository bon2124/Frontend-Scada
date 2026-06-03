import { useState, useEffect } from 'react'
import { inverterApi, type InverterData } from '../services/api'

const InverterMonitoring = () => {
  const [inverters, setInverters] = useState<InverterData[]>([])

  const fetchInverters = async () => {
    try {
      const response = await inverterApi.getAll()
      setInverters(response.data)
    } catch (err) {
      console.error('Error fetching inverters:', err)
    }
  }

  useEffect(() => {
    fetchInverters()
    const interval = setInterval(fetchInverters, 3000)
    return () => clearInterval(interval)
  }, [])

  const getStatus = (inv: InverterData): 'running' | 'off' =>
    inv.Control_Enable_Status === 1 && inv.AC_Power > 0 ? 'running' : 'off'

  const StatRow = ({ label, value, unit, color }: {
    label: string; value: string; unit: string; color: string
  }) => (
    <div className="d-flex justify-content-between align-items-center py-1"
      style={{ borderBottom: '1px solid #f0f0f0' }}>
      <span className="text-muted small">{label}</span>
      <span className="fw-semibold small">
        <span style={{ color }}>{value}</span>
        <span className="text-muted ms-1">{unit}</span>
      </span>
    </div>
  )

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-cpu me-2"></i>
          Inverter Monitoring & Control
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {inverters.map((inv) => {
            const status = getStatus(inv)
            const efficiency = inv.DC_Power_MPPT1 > 0
              ? ((inv.AC_Power / inv.DC_Power_MPPT1) * 100).toFixed(1)
              : '0.0'
            const acCurrent = inv.AC_Voltage > 0
    ? inv.AC_Power / inv.AC_Voltage
    : 0
            return (
              <div key={inv.inverter_id} className="col-lg-3 col-md-6">
                <div
                  className="border rounded p-3 bg-white h-100"
                  style={{
                    borderColor: status === 'running' ? '#28a745' : '#dee2e6',
                    borderWidth: status === 'running' ? '2px' : '1px',
                  }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h6 className="mb-0 fw-bold">{inv.inverter_id}</h6>
                    <span className={`badge bg-${status === 'running' ? 'success' : 'secondary'}`}>
                      <i className={`bi bi-${status === 'running' ? 'check-circle-fill' : 'dash-circle'} me-1`}></i>
                      {status === 'running' ? 'Running' : 'Off'}
                    </span>
                  </div>

                  
                  <StatRow label="DC Power"    value={(inv.DC_Power_MPPT1 / 1000).toFixed(2)}    unit="kW" color="#0d6efd" />
                  <StatRow label="DC Voltage"  value={inv.DC_Voltage_MPPT1.toFixed(0)}            unit="V"  color="#fd7e14" />
                  <StatRow label="DC Current"  value={inv.DC_Current_MPPT1.toFixed(1)}            unit="A"  color="#6f42c1" />
                  <StatRow label="AC Power"    value={(inv.AC_Power / 1000).toFixed(2)}          unit="kW" color="#28a745" />
                  <StatRow label="AC Voltage"  value={inv.AC_Voltage.toFixed(0)}                  unit="V"  color="#0dcaf0" />
                  <StatRow label="Frequency"   value={inv.AC_Frequency.toFixed(2)}                unit="Hz" color="#6c757d" />
                  <StatRow label="AC Current" value={acCurrent.toFixed(1)} unit="A" color="#20c997" 
        />

                  <div className="mt-2">
                    <div className="d-flex justify-content-between mb-1">
                      <small className="text-muted">Efficiency</small>
                      <small className="fw-semibold text-info">{efficiency}%</small>
                    </div>
                    <div className="progress" style={{ height: '6px' }}>
                      <div className="progress-bar bg-info"
                        style={{ width: `${Math.min(parseFloat(efficiency), 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default InverterMonitoring
