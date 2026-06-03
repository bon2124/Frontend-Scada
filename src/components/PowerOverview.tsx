import type { PowerData } from '../pages/Powermeter'

interface PowerOverviewProps {
  powerData: PowerData
}

const PowerOverview = ({ powerData }: PowerOverviewProps) => {
  const { totalPower, status, frequency } = powerData

  const powerInKw = totalPower / 1000
  const isGenerating = powerInKw >= 0

  const statusConfig = {
    active: {
      label: 'ACTIVE',
      color: 'success',
      icon: 'bi-check-circle-fill',
      text: 'System running normally',
    },
    warning: {
      label: 'WARNING',
      color: 'warning',
      icon: 'bi-exclamation-triangle-fill',
      text: 'Check operating values',
    },
    fault: {
      label: 'FAULT',
      color: 'danger',
      icon: 'bi-x-circle-fill',
      text: 'System fault detected',
    },
  }

  const frequencyStatus =
    frequency >= 49.5 && frequency <= 50.5
      ? {
          label: 'Optimal',
          color: 'success',
          icon: 'bi-check-circle-fill',
          text: '49.5 - 50.5 Hz safe range',
        }
      : frequency >= 49 && frequency <= 51
        ? {
            label: 'Acceptable',
            color: 'warning',
            icon: 'bi-exclamation-triangle-fill',
            text: 'Frequency is still acceptable',
          }
        : {
            label: 'Out of Range',
            color: 'danger',
            icon: 'bi-x-circle-fill',
            text: 'Frequency needs attention',
          }

  const currentStatus = statusConfig[status]

  return (
    <div className="card shadow-sm border-0 power-overview-card">
      <div className="power-overview-header">
        <div>
          <h5 className="mb-0 fw-bold text-white">
            <i className="bi bi-lightning-charge-fill me-2"></i>
            Power Overview
          </h5>
          <small className="text-white-50">Real-time grid power summary</small>
        </div>

        <span className={`badge bg-${currentStatus.color} px-3 py-2`}>
          <i className={`bi ${currentStatus.icon} me-1`}></i>
          {currentStatus.label}
        </span>
      </div>

      <div className="card-body power-overview-body">
        <div className="row g-3 h-100">
          {/* Total Power */}
          <div className="col-lg-4 col-md-6">
            <div className="metric-main-card h-100">
              <div className="metric-icon bg-primary-subtle text-primary">
                <i className="bi bi-lightning-charge-fill"></i>
              </div>

              <div className="metric-value text-success">
                {isGenerating ? '+' : ''}
                {powerInKw.toFixed(2)}
              </div>

              <div className="metric-unit">kW</div>
              <div className="metric-label">Total Power</div>

              <div className="metric-mini-status">
                <i
                  className={`bi ${
                    isGenerating ? 'bi-arrow-up-circle-fill text-success' : 'bi-arrow-down-circle-fill text-danger'
                  } me-2`}
                ></i>
                {isGenerating ? 'Generating Power' : 'Consuming Power'}
              </div>
            </div>
          </div>

          {/* Frequency */}
          <div className="col-lg-4 col-md-6">
            <div className="metric-main-card h-100">
              <div className={`metric-icon bg-${frequencyStatus.color}-subtle text-${frequencyStatus.color}`}>
                <i className="bi bi-speedometer2"></i>
              </div>

              <div className={`metric-value text-${frequencyStatus.color}`}>
                {frequency.toFixed(2)}
              </div>

              <div className="metric-unit">Hz</div>
              <div className="metric-label">Grid Frequency</div>

              <div className="metric-mini-status">
                <i className={`bi ${frequencyStatus.icon} text-${frequencyStatus.color} me-2`}></i>
                {frequencyStatus.label}
              </div>

              <small className="text-muted d-block mt-1">
                {frequencyStatus.text}
              </small>
            </div>
          </div>

          {/* Info Cards */}
          <div className="col-lg-4 col-md-12">
            <div className="row g-2 h-100">
              <div className="col-6">
                <div className="info-tile">
                  <i className="bi bi-diagram-3-fill text-primary"></i>
                  <strong>{powerData.gridType}</strong>
                  <span>Grid Type</span>
                </div>
              </div>

              <div className="col-6">
                <div className="info-tile">
                  <i className="bi bi-broadcast-pin text-success"></i>
                  <strong>Online</strong>
                  <span>Connection</span>
                </div>
              </div>

              <div className="col-6">
                <div className="info-tile">
                  <i className="bi bi-clock-history text-info"></i>
                  <strong>{new Date().toLocaleTimeString()}</strong>
                  <span>Last Update</span>
                </div>
              </div>

              <div className="col-6">
                <div className="info-tile">
                  <i className={`bi ${currentStatus.icon} text-${currentStatus.color}`}></i>
                  <strong>{currentStatus.label}</strong>
                  <span>{currentStatus.text}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Phase Summary */}
        <div className="phase-summary mt-3">
          <div className="phase-item">
            <span>U1</span>
            <strong>{powerData.phases.U1.toFixed(1)} V</strong>
          </div>

          <div className="phase-item">
            <span>U2</span>
            <strong>{powerData.phases.U2.toFixed(1)} V</strong>
          </div>

          <div className="phase-item">
            <span>U3</span>
            <strong>{powerData.phases.U3.toFixed(1)} V</strong>
          </div>

          <div className="phase-item">
            <span>I1</span>
            <strong>{powerData.phases.I1.toFixed(1)} A</strong>
          </div>

          <div className="phase-item">
            <span>I2</span>
            <strong>{powerData.phases.I2.toFixed(1)} A</strong>
          </div>

          <div className="phase-item">
            <span>I3</span>
            <strong>{powerData.phases.I3.toFixed(1)} A</strong>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PowerOverview