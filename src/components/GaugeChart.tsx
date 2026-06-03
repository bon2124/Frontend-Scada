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
  size = 200,
  warningThreshold,
  dangerThreshold,
}: GaugeChartProps) => {
  // Calculate percentage and angle
  const percentage = ((value - min) / (max - min)) * 100
  const angle = (percentage / 100) * 180 - 90 // -90 to 90 degrees

  // Determine color based on thresholds
  let color = '#28a745' // success/green
  if (dangerThreshold && value >= dangerThreshold) {
    color = '#dc3545' // danger/red
  } else if (warningThreshold && value >= warningThreshold) {
    color = '#ffc107' // warning/yellow
  }

  const radius = size / 2 - 10
  const strokeWidth = 15
  const circumference = Math.PI * radius

  return (
    <div className="d-flex flex-column align-items-center">
      <svg width={size} height={size * 0.6} style={{ overflow: 'visible' }}>
        {/* Background arc */}
        <path
          d={`M ${size / 2 - radius} ${size / 2} A ${radius} ${radius} 0 0 1 ${size / 2 + radius} ${size / 2}`}
          fill="none"
          stroke="#e9ecef"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M ${size / 2 - radius} ${size / 2} A ${radius} ${radius} 0 0 1 ${size / 2 + radius} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${(percentage / 100) * circumference} ${circumference}`}
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
        {/* Needle */}
        <line
          x1={size / 2}
          y1={size / 2}
          x2={size / 2 + radius * 0.7 * Math.cos((angle * Math.PI) / 180)}
          y2={size / 2 + radius * 0.7 * Math.sin((angle * Math.PI) / 180)}
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          style={{ transition: 'all 0.5s ease' }}
        />
        {/* Center circle */}
        <circle cx={size / 2} cy={size / 2} r="8" fill={color} />
      </svg>

      <div className="text-center mt-2">
        <h3 className="mb-0 fw-bold" style={{ color }}>
          {value.toFixed(1)} {unit}
        </h3>
        {label && <small className="text-muted">{label}</small>}
      </div>
    </div>
  )
}

export default GaugeChart
