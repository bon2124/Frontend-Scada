// src/pages/Environment.tsx
import { useState, useEffect } from 'react'
import EnvironmentalMonitoring from '../components/EnvironmentalMonitoring'

/* ── Tách Clock riêng để timer chỉ re-render ô đồng hồ, không ảnh hưởng chart ── */
const LiveClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const timeStr = currentTime.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  const dateStr = currentTime.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

  return (
    <div
      style={{
        padding: '4px 12px',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        borderRadius: 8,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: '#334155',
          fontFamily: '"Courier New", monospace',
          letterSpacing: 1,
          lineHeight: 1.2,
        }}
      >
        {timeStr}
      </div>
      <div
        style={{
          fontSize: 9,
          color: '#94a3b8',
          fontWeight: 600,
          lineHeight: 1.2,
        }}
      >
        {dateStr}
      </div>
    </div>
  )
}

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

        {/* Right — Status + Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {/* Live badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 12px',
              background: '#ecfdf5',
              border: '1px solid #86efac',
              borderRadius: 20,
              fontSize: 11,
              fontWeight: 700,
              color: '#166534',
            }}
          >
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: '#22c55e',
                boxShadow: '0 0 0 3px rgba(34,197,94,0.2)',
                animation: 'pulse 2s infinite',
              }}
            />
            System Online
          </div>

          {/* Clock — isolated component, won't re-render parent */}
          <LiveClock />
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

      {/* Pulse animation for live dot */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}

export default Environment
