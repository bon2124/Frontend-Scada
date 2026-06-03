import InverterMonitoring from '../components/InverterMonitoring'

const Inverter = () => {
  return (
    <div className="container py-4">
      <div className="row mb-3">
        <div className="col">
          <h2 className="mb-0">
            <i className="bi bi-cpu me-2"></i>
            Inverter Monitoring & Control
          </h2>
          <p className="text-muted">Monitor and control all inverters with real-time status and detailed metrics</p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <InverterMonitoring />
        </div>
      </div>
    </div>
  )
}

export default Inverter
