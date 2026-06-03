import type { PowerData } from '../pages/Powermeter'
import ProfessionalGauge from './ProfessionalGauge'

interface GridStatusProps {
  powerData: PowerData
}

const GridStatus = ({ powerData }: GridStatusProps) => {
  const { phases, gridType } = powerData

  // Thresholds for warnings
  const VOLTAGE_MIN = 220 // V
  const VOLTAGE_MAX = 240 // V
  const CURRENT_MAX = 10 // A

  const checkVoltageStatus = (voltage: number) => {
    if (voltage < VOLTAGE_MIN || voltage > VOLTAGE_MAX) return 'danger'
    if (voltage < VOLTAGE_MIN + 5 || voltage > VOLTAGE_MAX - 5) return 'warning'
    return 'success'
  }

  const checkCurrentStatus = (current: number) => {
    if (current > CURRENT_MAX) return 'danger'
    if (current > CURRENT_MAX * 0.9) return 'warning'
    return 'success'
  }

  const phaseData = [
    {
      phase: 'Inverter 1',
      voltage: phases.U1,
      current: phases.I1,
      voltageStatus: checkVoltageStatus(phases.U1),
      currentStatus: checkCurrentStatus(phases.I1),
      power: (phases.P1 / 1000).toFixed(2), // kW
    },
    {
      phase: 'Inverter 2',
      voltage: phases.U2,
      current: phases.I2,
      voltageStatus: checkVoltageStatus(phases.U2),
      currentStatus: checkCurrentStatus(phases.I2),
      power: (phases.P2 / 1000).toFixed(2), // kW
    },
    {
      phase: 'Inverter 3',
      voltage: phases.U3,
      current: phases.I3,
      voltageStatus: checkVoltageStatus(phases.U3),
      currentStatus: checkCurrentStatus(phases.I3),
      power: (phases.P3 / 1000).toFixed(2), // kW
    },
  ]

  // Calculate phase balance
  const avgVoltage = (phases.U1 + phases.U2 + phases.U3) / 3
  const avgCurrent = (phases.I1 + phases.I2 + phases.I3) / 3
  const voltageImbalance = Math.max(
    Math.abs(phases.U1 - avgVoltage),
    Math.abs(phases.U2 - avgVoltage),
    Math.abs(phases.U3 - avgVoltage)
  )
  const currentImbalance = Math.max(
    Math.abs(phases.I1 - avgCurrent),
    Math.abs(phases.I2 - avgCurrent),
    Math.abs(phases.I3 - avgCurrent)
  )

  const balanceStatus = voltageImbalance < 5 && currentImbalance < 5 ? 'success' : 'warning'

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-info text-white">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="bi bi-plug me-2"></i>
            Inverter Status - {gridType}
          </h5>
          <span className={`badge bg-${balanceStatus}`}>
            {balanceStatus === 'success' ? 'Balanced' : 'Imbalanced'}
          </span>
        </div>
      </div>
      <div className="card-body">
        {/* Phase Gauges */}
        <div className="row mb-4">
          {phaseData.map((phase, index) => (
            <div key={index} className="col-md-4 mb-4">
              <div className="border rounded p-3 bg-light">
                <h6 className="text-center fw-bold mb-3">
                  {phase.phase}
                </h6>
                <div className="row">
                  <div className="col-6">
                    <ProfessionalGauge
                      value={phase.voltage}
                      min={200}
                      max={250}
                      unit="V"
                      label="Voltage"
                      size={200}
                      warningThreshold={235}
                      dangerThreshold={240}
                    />
                  </div>
                  <div className="col-6">
                    <ProfessionalGauge
                      value={phase.current}
                      min={0}
                      max={10}
                      unit="A"
                      label="Current"
                      size={200}
                      warningThreshold={7.2}
                      dangerThreshold={8}
                    />
                  </div>
                </div>

                <div className="text-center mt-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="text-muted small">Power:</span>
                    <span className="fw-bold fs-5">{phase.power} kW</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Threshold Information */}
        <div className="row mt-3">
          <div className="col-md-6">
            <div className="alert alert-light border mb-0">
              <h6 className="alert-heading">
                <i className="bi bi-info-circle me-2"></i>
                Voltage Thresholds
              </h6>
              <ul className="mb-0 small">
                <li>
                  <span className="badge bg-success me-2">Safe</span>
                  {VOLTAGE_MIN + 5}V - {VOLTAGE_MAX - 5}V
                </li>
                <li>
                  <span className="badge bg-warning me-2">Warning</span>
                  {VOLTAGE_MIN}V - {VOLTAGE_MIN + 5}V or {VOLTAGE_MAX - 5}V - {VOLTAGE_MAX}V
                </li>
                <li>
                  <span className="badge bg-danger me-2">Critical</span>
                  &lt;{VOLTAGE_MIN}V or &gt;{VOLTAGE_MAX}V
                </li>
              </ul>
            </div>
          </div>
          <div className="col-md-6">
            <div className="alert alert-light border mb-0">
              <h6 className="alert-heading">
                <i className="bi bi-info-circle me-2"></i>
                Current Thresholds
              </h6>
              <ul className="mb-0 small">
                <li>
                  <span className="badge bg-success me-2">Safe</span>
                  &lt;{CURRENT_MAX * 0.9}A
                </li>
                <li>
                  <span className="badge bg-warning me-2">Warning</span>
                  {CURRENT_MAX * 0.9}A - {CURRENT_MAX}A
                </li>
                <li>
                  <span className="badge bg-danger me-2">Critical</span>
                  &gt;{CURRENT_MAX}A
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default GridStatus
