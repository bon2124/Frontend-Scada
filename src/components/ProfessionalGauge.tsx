import GaugeComponent from 'react-gauge-component'

interface ProfessionalGaugeProps {
  value: number
  min?: number
  max?: number
  unit?: string
  label?: string
  size?: number
  warningThreshold?: number
  dangerThreshold?: number
}

const ProfessionalGauge = ({
  value,
  min = 0,
  max = 100,
  unit = '',
  label = '',
  size = 200,
  warningThreshold,
  dangerThreshold,
}: ProfessionalGaugeProps) => {
  // Create arc configuration with zones based on thresholds
  const subArcs = []
  
  if (warningThreshold && dangerThreshold) {
    // Handle negative to positive scale
    if (min < 0) {
      // For negative to positive scale, create symmetric zones
      const totalRange = max - min
      const warningPercent = ((warningThreshold - min) / totalRange) * 100
      const dangerPercent = ((dangerThreshold - min) / totalRange) * 100
      
      subArcs.push(
        {
          limit: warningPercent,
          color: value >= 0 ? '#5BE12C' : '#F5CD19', // Green for positive generation, Yellow for negative consumption
          showTick: true
        },
        {
          limit: dangerPercent,
          color: '#F5CD19', // Yellow/Warning
          showTick: true
        },
        {
          limit: 100,
          color: '#EA4228', // Red/Danger
          showTick: true
        }
      )
    } else {
      // Original logic for positive-only scale
      const warningLimit = (warningThreshold / max) * 100
      const dangerLimit = (dangerThreshold / max) * 100
      
      subArcs.push(
        {
          limit: warningLimit,
          color: '#5BE12C', // Green
          showTick: true
        },
        {
          limit: dangerLimit,
          color: '#F5CD19', // Yellow/Warning
          showTick: true
        },
        {
          limit: 100,
          color: '#EA4228', // Red/Danger
          showTick: true
        }
      )
    }
  } else if (warningThreshold) {
    // Two zones: normal and warning
    if (min < 0) {
      const warningPercent = ((warningThreshold - min) / (max - min)) * 100
      subArcs.push(
        {
          limit: warningPercent,
          color: value >= 0 ? '#5BE12C' : '#F5CD19', // Green for generation, Yellow for consumption
          showTick: true
        },
        {
          limit: 100,
          color: '#F5CD19', // Yellow/Warning
          showTick: true
        }
      )
    } else {
      const warningLimit = (warningThreshold / max) * 100
      subArcs.push(
        {
          limit: warningLimit,
          color: '#5BE12C', // Green
          showTick: true
        },
        {
          limit: 100,
          color: '#F5CD19', // Yellow/Warning
          showTick: true
        }
      )
    }
  } else {
    // Single zone
    subArcs.push({
      limit: 100,
      color: '#5BE12C',
      showTick: true
    })
  }

  const normalizedValue = ((value - min) / (max - min)) * 100

  return (
    <div className="d-flex flex-column align-items-center">
      <GaugeComponent
        type="semicircle"
        arc={{
          cornerRadius: 1,
          padding: 0.02,
          width: 0.2,
          subArcs: subArcs
        }}
        pointer={{
          elastic: true,
          animationDelay: 0,
          animationDuration: 1000
        }}
        value={normalizedValue}
        minValue={0}
        maxValue={100}
        labels={{
          valueLabel: {
            formatTextValue: () => '',
            style: { 
              fontSize: '0px'
            }
          },
          tickLabels: {
            type: "outer",
            ticks: [
              { value: 0 },
              { value: 25 },
              { value: 50 },
              { value: 75 },
              { value: 100 }
            ].map(tick => ({
              value: tick.value,
              valueConfig: {
                formatTextValue: () => `${((tick.value * (max - min)) / 100 + min).toFixed(0)}`
              }
            }))
          }
        }}
        style={{
          width: size,
          height: size * 0.7
        }}
      />
      
      {/* Custom value display positioned below the gauge */}
      <div className="text-center" style={{ marginTop: '-30px', position: 'relative', zIndex: 10 }}>
        <div style={{ 
          fontSize: '18px', 
          fontWeight: 'bold', 
          color: value >= 0 ? '#28a745' : '#dc3545', // Green for positive (generation), Red for negative (consumption)
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '4px 12px',
          borderRadius: '6px',
          border: '1px solid #ddd'
        }}>
          {value > 0 ? '+' : ''}{value.toFixed(1)} {unit}
        </div>
      </div>
      
      {label && (
        <div className="text-center mt-2">
          <small className="text-muted fw-semibold">{label}</small>
        </div>
      )}
    </div>
  )
}

export default ProfessionalGauge