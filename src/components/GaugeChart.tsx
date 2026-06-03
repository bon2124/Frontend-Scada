interface GaugeChartProps {
  value: number
  min?: number
  max?: number
  unit?: string
  label?: string
  size?: number
  warningThreshold?: number
  dangerThreshold?: number
}

const GaugeChart = ({
  value,
  min = 0,
  max = 100,
  unit = '',
  label = '',
  size = 180,
  warningThreshold,
  dangerThreshold,
}: GaugeChartProps) => {
  const safeValue = Math.min(Math.max(value, min), max)
  const percentage = ((safeValue - min) / (max - min)) * 100
  const angle = (percentage / 100) * 180 - 180

  let color = '#22c55e'
  let statusText = 'Normal'
  let statusClass = 'success'

  if (dangerThreshold !== undefined && value >= dangerThreshold) {
    color = '#ef4444'
    statusText = 'Critical'
    statusClass = 'danger'
  } else if (warningThreshold !== undefined && value >= warningThreshold) {
    color = '#f59e0b'
    statusText = 'Warning'
    statusClass = 'warning'
  }

  const radius = size / 2 - 16
  const strokeWidth = 14
  const centerX = size / 2
  const centerY = size / 2
  const svgHeight = size * 0.62

  const arcPath = `M ${centerX - radius} ${centerY} A ${radius} ${radius} 0 0 1 ${
    centerX + radius
  } ${centerY}`

  const circumference = Math.PI * radius
  const dashValue = (percentage / 100) * circumference

  const needleLength = radius * 0.72
  const needleX = centerX + needleLength * Math.cos((angle * Math.PI) / 180)
  const needleY = centerY + needleLength * Math.sin((angle * Math.PI) / 180)

  return (
    <div className="modern-gauge">
      <div className="modern-gauge-svg-wrap">
        <svg
          width={size}
          height={svgHeight}
          viewBox={`0 0 ${size} ${svgHeight}`}
          className="modern-gauge-svg"
        >
          <defs>
            <linearGradient id={`gaugeGradient-${label}`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>

            <filter id={`gaugeShadow-${label}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.18" />
            </filter>
          </defs>

          <path
            d={arcPath}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          <path
            d={arcPath}
            fill="none"
            stroke={`url(#gaugeGradient-${label})`}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={`${dashValue} ${circumference}`}
            filter={`url(#gaugeShadow-${label})`}
            className="modern-gauge-progress"
          />

          <line
            x1={centerX}
            y1={centerY}
            x2={needleX}
            y2={needleY}
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            className="modern-gauge-needle"
          />

          <circle cx={centerX} cy={centerY} r="10" fill="#ffffff" stroke={color} strokeWidth="4" />
          <circle cx={centerX} cy={centerY} r="4" fill={color} />

          <text x={centerX - radius + 2} y={centerY + 20} className="modern-gauge-limit">
            {min}
          </text>

          <text x={centerX + radius - 2} y={centerY + 20} textAnchor="end" className="modern-gauge-limit">
            {max}
          </text>
        </svg>
      </div>

      <div className="modern-gauge-info">
        <div className="modern-gauge-value" style={{ color }}>
          {value.toFixed(1)}
          <span>{unit}</span>
        </div>

        {label && <div className="modern-gauge-label">{label}</div>}

        <div className={`modern-gauge-status gauge-${statusClass}`}>
          <span></span>
          {statusText}
        </div>
      </div>
    </div>
  )
}

export default GaugeChart