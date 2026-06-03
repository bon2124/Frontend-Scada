import type { PowerData } from '../pages/Powermeter'

interface PowerOverviewProps {
  powerData: PowerData
}

const PowerOverview = ({ powerData }: PowerOverviewProps) => {
  const { totalPower, status, frequency } = powerData

  // Convert W to kW for display
  const powerInKw = totalPower / 1000
  const displayPower = powerInKw
  const powerUnit = 'kW'

  // Status color mapping
  const statusColors = {
    active: 'success',
    warning: 'warning',
    fault: 'danger',
  }

  const statusIcons = {
    active: 'bi-check-circle-fill',
    warning: 'bi-exclamation-triangle-fill',
    fault: 'bi-x-circle-fill',
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-primary text-white">
        <h5 className="mb-0">
          <i className="bi bi-lightning-charge-fill me-2"></i>
          Power Overview
        </h5>
      </div>
      <div className="card-body py-3">
        <div className="row g-3">
          {/* Total Power Display */}
          <div className="col-md-3">
            <div className="text-center">
              <div className="mb-3">
                <h1 className="display-3 fw-bold" style={{ color: displayPower >= 0 ? '#28a745' : '#dc3545' }}>
                  {displayPower > 0 ? '+' : ''}{displayPower.toFixed(1)}
                </h1>
                <h5 className="text-muted mb-0">{powerUnit}</h5>
                <small className="text-muted">Total Power</small>
              </div>
              <div className="mt-3">
                <span className={`badge bg-${statusColors[status]} px-3 py-2 mb-3`}>
                  <i className={`bi ${statusIcons[status]} me-1`}></i>
                  {status.toUpperCase()}
                </span>
                
                {/* Power Details Mini Cards */}
                <div className="row g-1 mt-2">
                  <div className="col-12">
                    <div className="card bg-light border-0 py-1">
                      <div className="card-body p-2 text-center">
                        <i className={`bi ${displayPower >= 0 ? 'bi-arrow-up-circle' : 'bi-arrow-down-circle'} me-1`} 
                           style={{ color: displayPower >= 0 ? '#28a745' : '#dc3545' }}></i>
                        <small className="text-muted">
                          {displayPower >= 0 ? 'Generating' : 'Consuming'}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid Frequency Display */}
          <div className="col-md-3">
            <div className="text-center">
              <div className="mb-3">
                <h1 className="display-3 fw-bold" style={{ 
                  color: frequency >= 49.5 && frequency <= 50.5 ? '#28a745' : 
                         frequency >= 49.0 && frequency <= 51.0 ? '#ffc107' : '#dc3545' 
                }}>
                  {frequency.toFixed(2)}
                </h1>
                <h5 className="text-muted mb-0">Hz</h5>
                <small className="text-muted">Frequency of supply voltages</small>
              </div>
              
              {/* Frequency Status Mini Cards */}
              <div className="row g-1 mt-3">
                <div className="col-12">
                  <div className="card bg-light border-0 py-1">
                    <div className="card-body p-2 text-center">
                      <i className={`bi ${
                        frequency >= 49.5 && frequency <= 50.5 ? 'bi-check-circle text-success' :
                        frequency >= 49.0 && frequency <= 51.0 ? 'bi-exclamation-triangle text-warning' :
                        'bi-x-circle text-danger'
                      } me-1`}></i>
                      <small className="text-muted">
                        {
                          frequency >= 49.5 && frequency <= 50.5 ? 'Optimal Range' :
                          frequency >= 49.0 && frequency <= 51.0 ? 'Acceptable' :
                          'Out of Range'
                        }
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-12 mt-1">
                  <div className="card bg-light border-0 py-1">
                    <div className="card-body p-2 text-center">
                      <i className="bi bi-speedometer2 text-info me-1"></i>
                      <small className="text-muted">49.5 - 50.5 Hz Safe</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info - Compact Grid */}
          <div className="col-md-6">
            <div className="row g-2 h-100">
              <div className="col-6">
                <div className="card bg-light border h-100">
                  <div className="card-body text-center p-3">
                    <i className="bi bi-diagram-3 text-primary fs-2"></i>
                    <h5 className="mt-2 mb-0 fw-bold">{powerData.gridType}</h5>
                    <small className="text-muted">Grid Type</small>
                  </div>
                </div>
              </div>
              
              <div className="col-6">
                <div className="card bg-light border h-100">
                  <div className="card-body text-center p-3">
                    <i className="bi bi-clock-history text-info fs-2"></i>
                    <h6 className="mt-2 mb-0 fw-bold">
                      {new Date().toLocaleTimeString()}
                    </h6>
                    <small className="text-muted">Last Update</small>
                  </div>
                </div>
              </div>

              <div className="col-6">
                <div className="card bg-light border h-100">
                  <div className="card-body text-center p-3">
                    <i className="bi bi-calendar-check text-success fs-2"></i>
                    <h6 className="mt-2 mb-0 fw-bold">
                      {new Date().toLocaleDateString()}
                    </h6>
                    <small className="text-muted">Today's Date</small>
                  </div>
                </div>
              </div>

              <div className="col-6">
                <div className="card bg-light border h-100">
                  <div className="card-body text-center p-3">
                    <i className="bi bi-broadcast text-warning fs-2"></i>
                    <h6 className="mt-2 mb-0 fw-bold">Active</h6>
                    <small className="text-muted">System Status</small>
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

export default PowerOverview
