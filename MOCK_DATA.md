# Solar Power Dashboard - Mock Data Structure

This document describes the fake/mock data structure used in the Solar Power Monitoring Dashboard for demonstration purposes.

## 1. Power Data Interface

Located in: `src/pages/Overview.tsx`

```typescript
interface PowerData {
  totalPower: number        // Total power in Watts (W)
  status: 'active' | 'warning' | 'fault'  // System status
  frequency: number         // Grid frequency in Hz
  phases: {
    U1: number             // Voltage Phase 1 (V)
    U2: number             // Voltage Phase 2 (V)
    U3: number             // Voltage Phase 3 (V)
    I1: number             // Current Phase 1 (A)
    I2: number             // Current Phase 2 (A)
    I3: number             // Current Phase 3 (A)
  }
  gridType: '3-Phase' | '1-Phase'
}
```

## 2. Mock Data Generation

### Power Overview Data (Real-time simulation)

**Initial Values:**
- Total Power: 45,230 W (45.23 kW)
- Status: 'active'
- Frequency: 50.2 Hz
- Grid Type: '3-Phase'

**Phase Values:**
- U1: 230.5 V, I1: 65.4 A
- U2: 229.8 V, I2: 66.1 A
- U3: 231.2 V, I3: 64.8 A

**Real-time Updates (every 3 seconds):**
```typescript
totalPower: prev.totalPower + (Math.random() - 0.5) * 1000  // ±500W variation
frequency: 50 + (Math.random() - 0.5) * 0.5                 // 49.75 - 50.25 Hz
U1/U2/U3: 230 + (Math.random() - 0.5) * 5                   // 227.5 - 232.5 V
I1/I2/I3: 65 + (Math.random() - 0.5) * 10                   // 60 - 70 A
```

## 3. Power History Chart Data

Located in: `src/components/PowerHistoryChart.tsx`

### Today (24 hours - hourly data)

```typescript
{
  time: "HH:00" format (00:00 to 23:00)
  power: Solar pattern simulation
    - Night (00:00-05:00, 19:00-23:00): 5-10 kW
    - Day (06:00-18:00): 30-50 kW (peaks at noon)
  voltage: 220-240 V
  current: 60-75 A (day) / 10-15 A (night)
}
```

**Solar Pattern Formula:**
```typescript
const basePower = hour >= 6 && hour <= 18 
  ? 30 + Math.sin((hour - 6) * Math.PI / 12) * 20 
  : 5
// Simulates sunrise at 6:00, peak at 12:00, sunset at 18:00
```

### 7 Days (daily average)

```typescript
{
  time: "Mon DD" format
  power: 35-50 kW (random daily average)
  voltage: 225-235 V
  current: 65-75 A
}
```

### 30 Days (daily average)

```typescript
{
  time: "Mon DD" format (every 5th day shown)
  power: 30-50 kW (random daily average)
  voltage: 225-235 V
  current: 65-75 A
}
```

## 4. Thresholds & Ranges

### Voltage Thresholds
- **Normal:** 225-235 V (Green)
- **Warning:** 220-225 V or 235-240 V (Yellow)
- **Critical:** <220 V or >240 V (Red)

### Current Thresholds
- **Normal:** <72 A (Green)
- **Warning:** 72-80 A (Yellow)
- **Critical:** >80 A (Red)

### Frequency Thresholds
- **Stable:** 49.5-50.5 Hz (Green)
- **Unstable:** <49.5 Hz or >50.5 Hz (Yellow/Red)

### Power Thresholds (for gauges)
- **Normal:** 0-45 kW (Green)
- **Warning:** 45-55 kW (Yellow)
- **Critical:** >55 kW (Red)

## 5. Calculated Metrics

### Phase Power Calculation
```typescript
power = (voltage * current) / 1000  // kW
// Example: (230 V * 65 A) / 1000 = 14.95 kW per phase
```

### Total Energy Calculation
```typescript
totalEnergy = sum(power values) * hours  // kWh
// For "Today": multiply by 1 hour
// For "7 Days" or "30 Days": multiply by 24 hours
```

### Phase Balance Check
```typescript
avgVoltage = (U1 + U2 + U3) / 3
voltageImbalance = max(|U1-avg|, |U2-avg|, |U3-avg|)

avgCurrent = (I1 + I2 + I3) / 3
currentImbalance = max(|I1-avg|, |I2-avg|, |I3-avg|)

balanceStatus = (voltageImbalance < 5 && currentImbalance < 5) 
  ? 'Balanced' : 'Imbalanced'
```

## 6. Statistics Calculated from History Data

```typescript
maxPower = Math.max(...chartData.map(d => d.power))
minPower = Math.min(...chartData.map(d => d.power))
avgPower = sum(chartData.power) / chartData.length
totalEnergy = sum(chartData.power) * hours
```

## 7. Color Coding System

### Status Colors
- **Success/Active/Green:** Normal operation
- **Warning/Yellow:** Approaching threshold
- **Danger/Red:** Threshold exceeded or fault

### Chart Colors
- **Power Line:** #28a745 (Green)
- **Voltage Line:** #007bff (Blue)
- **Current Line:** #ffc107 (Yellow/Gold)

## 8. Update Intervals

- **Real-time Dashboard Data:** Every 3 seconds
- **Chart Re-render:** On time period change (Today/7 Days/30 Days)
- **Clock Updates:** Every render cycle

## Notes for Future API Integration

When integrating with real APIs, replace mock data generation with:

1. **WebSocket connection** for real-time data updates
2. **REST API endpoints** for historical data:
   - `GET /api/power/current` - Current power readings
   - `GET /api/power/history?period=today|7days|30days` - Historical data
3. **Error handling** for connection failures
4. **Loading states** during data fetch
5. **Data validation** before rendering

All mock data is currently generated client-side using `Math.random()` and time-based patterns to simulate realistic solar power generation patterns.
