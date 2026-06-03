import { useState, useEffect } from 'react'
import ProfessionalGauge from './ProfessionalGauge'
import InverterHistoryChart from './InverterHistoryChart'
import { inverterApi, type InverterData } from '../services/api'

const InverterMonitoring = () => {
  const [inverters, setInverters] = useState<InverterData[]>([])
  const [selectedInverter, setSelectedInverter] = useState<string | null>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState<{ inverterId: string; action: string } | null>(null)
  const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days'>('today')

  // Fetch inverter data
  const fetchInverters = async () => {
    try {
      const response = await inverterApi.getAll()
      setInverters(response.data)
    } catch (err) {
      console.error('Error fetching inverters:', err)
    }
  }

  // Initial fetch and periodic updates
  useEffect(() => {
    fetchInverters()
    const interval = setInterval(fetchInverters, 3000) // Update every 3 seconds
    return () => clearInterval(interval)
  }, [])

  // Get status based on Control_Enable_Status and power output
  const getStatus = (inv: InverterData): 'running' | 'off' => {
    return inv.Control_Enable_Status === 1 && inv.AC_Power > 0 ? 'running' : 'off'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'success'
      case 'warning':
        return 'warning'
      case 'error':
        return 'danger'
      case 'off':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return 'check-circle-fill'
      case 'warning':
        return 'exclamation-triangle-fill'
      case 'error':
        return 'x-circle-fill'
      case 'off':
        return 'dash-circle'
      default:
        return 'dash-circle'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'running':
        return 'Running'
      case 'warning':
        return 'Warning'
      case 'error':
        return 'Error'
      case 'off':
        return 'Off'
      default:
        return 'Unknown'
    }
  }

  const handleToggle = (inverterId: string, currentStatus: string) => {
    const action = currentStatus === 'off' ? 'on' : 'off'
    setShowConfirmDialog({ inverterId, action })
  }

  const confirmToggle = () => {
    if (!showConfirmDialog) return
    // Note: Control functionality not available in current API
    // This is a placeholder for future control implementation
    setShowConfirmDialog(null)
  }

  const selectedInv = selectedInverter ? inverters.find(inv => inv.inverter_id === selectedInverter) : null

  return (
    <>
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">
            <i className="bi bi-cpu me-2"></i>
            Inverter Monitoring & Control
          </h5>
        </div>
        <div className="card-body">
          {/* Power Flow Diagram */}
          <div className="mb-4 p-3 border rounded bg-light">
            <h6 className="text-center mb-3">
              <i className="bi bi-diagram-3 me-2"></i>
              Power Flow: Solar Panels → DC → Inverter → AC
            </h6>
            <div className="row g-3">
              {inverters.map((inv) => {
                const status = getStatus(inv)
                return (
                  <div key={inv.inverter_id} className="col-12">
                    <div className={`d-flex align-items-center p-2 rounded ${status !== 'off' ? 'bg-white border' : 'bg-secondary bg-opacity-10'}`}>
                      {/* Inverter Label */}
                      <div className="text-center" style={{ minWidth: '90px', width: '90px' }}>
                        <span className={`badge bg-${getStatusColor(status)} mb-1 d-block`}>
                          {inv.inverter_id}
                        </span>
                      </div>

                      {/* Solar Panel Icon */}
                      <div className="text-center" style={{ minWidth: '60px', width: '60px' }}>
                        <i className="bi bi-grid-3x3-gap-fill text-warning" style={{ fontSize: '1.8rem' }}></i>
                        <div className="small text-muted">Solar</div>
                      </div>

                      {/* DC Arrow and Data */}
                      <div className="flex-grow-1 position-relative" style={{ height: '50px', minWidth: '200px' }}>
                        <svg width="100%" height="50" style={{ display: 'block' }}>
                          {/* DC Line */}
                          <line
                            x1="0"
                            y1="20"
                            x2="90%"
                            y2="20"
                            stroke={status !== 'off' ? '#0d6efd' : '#6c757d'}
                            strokeWidth="4"
                            strokeDasharray={status !== 'off' ? '8,8' : '0'}
                          >
                            {status !== 'off' && (
                              <animate
                                attributeName="stroke-dashoffset"
                                values="0;-16"
                                dur="1s"
                                repeatCount="indefinite"
                              />
                            )}
                          </line>
                          {/* DC Label */}
                          <text x="45%" y="14" fill="#0d6efd" fontSize="12" fontWeight="bold" textAnchor="middle">
                            {status !== 'off' ? `${inv.DC_Voltage_MPPT1.toFixed(0)}V / ${inv.DC_Current_MPPT1.toFixed(1)}A` : '0V / 0A'}
                          </text>
                          <text x="45%" y="36" fill="#495057" fontSize="11" fontWeight="600" textAnchor="middle">
                            DC: {(inv.DC_Power_MPPT1 / 1000).toFixed(2)} kW
                          </text>

                          {/* Arrow to Inverter */}
                          <polygon
                            points="90%,14 100%,20 90%,26"
                            fill={status !== 'off' ? '#0d6efd' : '#6c757d'}
                          />
                        </svg>
                      </div>

                      {/* Inverter Icon */}
                      <div className="text-center mx-2" style={{ minWidth: '70px', width: '70px' }}>
                        <i className={`bi bi-cpu-fill text-${getStatusColor(status)}`} style={{ fontSize: '2.2rem' }}></i>
                        <div className="small text-muted">Inverter</div>
                      </div>

                      {/* AC Arrow and Data */}
                      <div className="flex-grow-1 position-relative" style={{ height: '50px', minWidth: '200px' }}>
                        <svg width="100%" height="50" style={{ display: 'block' }}>
                          {/* AC Line */}
                          <line
                            x1="10%"
                            y1="20"
                            x2="100%"
                            y2="20"
                            stroke={status !== 'off' ? '#198754' : '#6c757d'}
                            strokeWidth="4"
                          >
                            {status !== 'off' && (
                              <animate
                                attributeName="stroke-dashoffset"
                                values="0;-16"
                                dur="0.8s"
                                repeatCount="indefinite"
                              />
                            )}
                          </line>
                          {/* AC Waveform */}
                          <path
                            d="M 10%,20 Q 20%,8 30%,20 T 50%,20 Q 60%,32 70%,20 T 90%,20 Q 95%,8 100%,20"
                            fill="none"
                            stroke={status !== 'off' ? '#198754' : '#6c757d'}
                            strokeWidth="2.5"
                            opacity="0.7"
                          />
                          {/* AC Label */}
                          <text x="55%" y="14" fill="#198754" fontSize="12" fontWeight="bold" textAnchor="middle">
                            {status !== 'off' ? `${inv.AC_Voltage.toFixed(0)}V` : '0V'}
                          </text>
                          <text x="55%" y="36" fill="#495057" fontSize="11" fontWeight="600" textAnchor="middle">
                            AC: {(inv.AC_Power / 1000).toFixed(2)} kW
                          </text>
                        </svg>
                      </div>

                      {/* Grid Icon */}
                      <div className="text-center" style={{ minWidth: '60px', width: '60px' }}>
                        <i className="bi bi-lightning-charge-fill text-success" style={{ fontSize: '1.8rem' }}></i>
                        <div className="small text-muted">Offgrid</div>
                        <div className="small">{inv.AC_Frequency.toFixed(2)} Hz</div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Inverter Overview Table */}
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light">
                <tr>
                  <th>Inverter</th>
                  <th className="text-center">Status</th>
                  <th className="text-end">AC Power</th>
                  <th className="text-center">Control</th>
                  <th className="text-center">Details</th>
                </tr>
              </thead>
              <tbody>
                {inverters.map(inv => {
                  const status = getStatus(inv)
                  return (
                    <tr key={inv.inverter_id}>
                      <td className="fw-bold">
                        <i className="bi bi-cpu me-2"></i>
                        {inv.inverter_id}
                      </td>
                      <td className="text-center">
                        <span className={`badge bg-${getStatusColor(status)} d-inline-flex align-items-center gap-1`}>
                          <i className={`bi bi-${getStatusIcon(status)}`}></i>
                          {getStatusText(status)}
                        </span>
                      </td>
                      <td className="text-end">
                        <span className="fw-bold">{(inv.AC_Power / 1000).toFixed(2)}</span>
                        <small className="text-muted"> kW</small>
                      </td>
                      <td className="text-center">
                        <div className="form-check form-switch d-inline-block">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            role="switch"
                            checked={status !== 'off'}
                            onChange={() => handleToggle(inv.inverter_id, status)}
                            style={{ cursor: 'pointer', width: '2.5rem', height: '1.25rem' }}
                            disabled
                          />
                        </div>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setSelectedInverter(inv.inverter_id)}
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Summary Statistics */}
          <div className="row mt-3">
            <div className="col-md-4 col-6 mb-2">
              <div className="border rounded p-3 bg-light text-center">
                <i className="bi bi-lightning-charge-fill text-success fs-4"></i>
                <h5 className="mb-0 mt-2">
                  {inverters.reduce((sum, inv) => sum + (inv.AC_Power / 1000), 0).toFixed(1)} kW
                </h5>
                <small className="text-muted">Total Power</small>
              </div>
            </div>
            <div className="col-md-4 col-6 mb-2">
              <div className="border rounded p-3 bg-light text-center">
                <i className="bi bi-check-circle-fill text-success fs-4"></i>
                <h5 className="mb-0 mt-2">
                  {inverters.filter(inv => getStatus(inv) === 'running').length}/4
                </h5>
                <small className="text-muted">Running</small>
              </div>
            </div>
            <div className="col-md-4 col-6 mb-2">
              <div className="border rounded p-3 bg-light text-center">
                <i className="bi bi-exclamation-triangle-fill text-warning fs-4"></i>
                <h5 className="mb-0 mt-2">
                  0
                </h5>
                <small className="text-muted">Warnings</small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inverter Details Modal */}
      {selectedInv && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-dark text-white">
                <h5 className="modal-title">
                  <i className="bi bi-cpu me-2"></i>
                  {selectedInv.inverter_id} - Detailed View
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setSelectedInverter(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  {/* Status Overview */}
                  <div className="col-12 mb-3">
                    <div className="d-flex justify-content-center align-items-center p-3 border rounded bg-light">
                      <div className="text-center">
                        <h6 className="mb-1">Current Status</h6>
                        <span className={`badge bg-${getStatusColor(getStatus(selectedInv))} fs-6`}>
                          <i className={`bi bi-${getStatusIcon(getStatus(selectedInv))} me-1`}></i>
                          {getStatusText(getStatus(selectedInv))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* DC Input Section */}
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 h-100">
                      <h6 className="text-primary mb-3">
                        <i className="bi bi-battery-charging"></i> DC Input
                      </h6>
                      <div className="row">
                        <div className="col-6 mb-3">
                          <ProfessionalGauge
                            value={selectedInv.DC_Voltage_MPPT1}
                            min={0}
                            max={800}
                            unit="V"
                            label="DC Voltage"
                            size={180}
                            warningThreshold={700}
                            dangerThreshold={750}
                          />
                        </div>
                        <div className="col-6 mb-3">
                          <ProfessionalGauge
                            value={selectedInv.DC_Current_MPPT1}
                            min={0}
                            max={40}
                            unit="A"
                            label="DC Current"
                            size={180}
                            warningThreshold={35}
                            dangerThreshold={38}
                          />
                        </div>
                      </div>
                      <div className="mt-2">
                        <div className="d-flex justify-content-between p-2 bg-light rounded">
                          <span className="text-muted">DC Power:</span>
                          <span className="fw-bold">{(selectedInv.DC_Power_MPPT1 / 1000).toFixed(2)} kW</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* AC Output Section */}
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 h-100">
                      <h6 className="text-success mb-3">
                        <i className="bi bi-lightning-charge"></i> AC Output
                      </h6>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between p-2 border-bottom">
                          <span className="text-muted">AC Power:</span>
                          <span className="fw-bold fs-5 text-success">{(selectedInv.AC_Power / 1000).toFixed(2)} kW</span>
                        </div>
                        <div className="d-flex justify-content-between p-2 border-bottom">
                          <span className="text-muted">AC Voltage:</span>
                          <span className="fw-bold">{selectedInv.AC_Voltage.toFixed(1)} V</span>
                        </div>
                        <div className="d-flex justify-content-between p-2">
                          <span className="text-muted">Frequency:</span>
                          <span className="fw-bold">{selectedInv.AC_Frequency.toFixed(2)} Hz</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Control Information */}
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 text-center h-100">
                      <h6 className="mb-3">
                        <i className="bi bi-sliders"></i> Control Settings
                      </h6>
                      <div className="mb-2">
                        <i className="bi bi-toggles text-primary" style={{ fontSize: '3rem' }}></i>
                      </div>
                      <div className="mb-3">
                        <div className="d-flex justify-content-between p-2 border-bottom">
                          <span className="text-muted">Enable Status:</span>
                          <span className={`badge ${selectedInv.Control_Enable_Status === 1 ? 'bg-success' : 'bg-secondary'}`}>
                            {selectedInv.Control_Enable_Status === 1 ? 'Enabled' : 'Disabled'}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between p-2">
                          <span className="text-muted">Power Limit:</span>
                          <span className="fw-bold">{(selectedInv.Control_WMax_Limit / 1000).toFixed(1)} kW</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp Information */}
                  <div className="col-md-6 mb-3">
                    <div className="border rounded p-3 text-center h-100">
                      <h6 className="mb-3">
                        <i className="bi bi-clock"></i> Last Update
                      </h6>
                      <div className="mb-2">
                        <i className="bi bi-clock-history text-info" style={{ fontSize: '3rem' }}></i>
                      </div>
                      <div className="text-center">
                        <div className="fw-bold fs-6 text-info">
                          {new Date(selectedInv.time).toLocaleString()}
                        </div>
                        <small className="text-muted">Last data received</small>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance History Chart */}
                <div className="row mt-4">
                  <div className="col-12">
                    <InverterHistoryChart 
                      inverterId={selectedInv.inverter_id}
                      timePeriod={timePeriod}
                      setTimePeriod={setTimePeriod}
                    />
                  </div>
                </div>
              </div>
              {/* <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSelectedInverter(null)}
                >
                  <i className="bi bi-x-lg me-1"></i>
                  Close
                </button>
              </div> */}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                  Confirm Action
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowConfirmDialog(null)}
                ></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">
                  Are you sure you want to turn <strong>{showConfirmDialog.action}</strong>{' '}
                  <strong>Inverter {showConfirmDialog.inverterId}</strong>?
                </p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowConfirmDialog(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className={`btn btn-${showConfirmDialog.action === 'on' ? 'success' : 'danger'}`}
                  onClick={confirmToggle}
                >
                  <i className={`bi bi-${showConfirmDialog.action === 'on' ? 'check' : 'x'}-circle me-1`}></i>
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default InverterMonitoring
