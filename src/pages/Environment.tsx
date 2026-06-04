// src/pages/Environment.tsx
import EnvironmentalMonitoring from '../components/EnvironmentalMonitoring'

const Environment = () => {
  return (
    <div
      className="container-fluid d-flex flex-column px-3 py-0 overflow-hidden"
      style={{
        height: '100vh',
        maxHeight: '100vh',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8faff 100%)',
      }}
    >
      {/* ═══════ HEADER ═══════ */}
      <div
        className="flex-shrink-0"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 0',
          borderBottom: '2px solid #e8edf5',
        }}
      >
        {/* Left — Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg, #f9a825, #ff8f00)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 10px rgba(249,168,37,0.3)',
            }}
          >
            <i className="bi bi-sun-fill" style={{ color: '#fff', fontSize: 16 }}></i>
          </div>
          <div>
            <h6
              className="mb-0"
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: -0.3,
                lineHeight: 1.2,
              }}
            >
              Environmental Monitoring
            </h6>
            <span
              style={{
                fontSize: 10,
                color: '#94a3b8',
                fontWeight: 600,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
              }}
            >
              Real-time Weather Station
            </span>
          </div>
        </div>
      </div>

      {/* ═══════ MAIN CONTENT ═══════ */}
      <div className="flex-grow-1 overflow-hidden" style={{ paddingTop: 4, paddingBottom: 2 }}>
        <EnvironmentalMonitoring />
      </div>

      {/* ═══════ FOOTER ═══════ */}
      <div
        className="flex-shrink-0"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '4px 0',
          borderTop: '1px solid #e8edf5',
        }}
      >
        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>
          © 2026 Solar Power Monitoring System
        </span>
        <span
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: '#fff',
            background: '#2563eb',
            borderRadius: 4,
            padding: '1px 6px',
            letterSpacing: 0.5,
          }}
        >
          SCADA TEAM 4-22PFIEV2
        </span>
      </div>
    </div>
  )
}

export default Environment
