import EnvironmentalMonitoring from '../components/EnvironmentalMonitoring'

const Environment = () => {
  return (
    <div className="container py-4">
      <div className="row mb-3">
        <div className="col">
          <h2 className="mb-0">
            <i className="bi bi-sun me-2"></i>
            Environmental Monitoring
          </h2>
          <p className="text-muted">Monitor solar irradiance, ambient temperature, and panel temperature</p>
        </div>
      </div>

      <div className="row">
        <div className="col-12">
          <EnvironmentalMonitoring />
        </div>
      </div>
    </div>
  )
}

export default Environment
