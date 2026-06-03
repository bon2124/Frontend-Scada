# Solar Plant React App - API Integration Guide

## Overview
This guide details how to integrate the Solar Plant SCADA API with the React web app. The API service (`src/services/api.ts`) has been created with all necessary endpoints.

## API Service Created

**File**: `src/services/api.ts`

Contains:
- Base URL configuration: `http://localhost:5000/api`
- TypeScript interfaces matching API responses
- Axios instance with default configuration
- Three API modules: `inverterApi`, `powerMeterApi`, `weatherApi`

## Key Changes Required

### 1. InverterMonitoring Component

**File**: `src/components/InverterMonitoring.tsx`

**Current Issues**:
- Uses mock data with custom interface (id, name, status, temperature, etc.)
- Has ON/OFF toggle switches with confirmation dialog
- Calculates efficiency, tracks temperature, manages status

**Required Changes**:

**A. Update Imports**:
```typescript
import { inverterApi, type InverterData } from '../services/api'
```

**B. Replace State**:
```typescript
// OLD:
const [inverters, setInverters] = useState<InverterData[]>([...mock data...])
const [selectedInverter, setSelectedInverter] = useState<number | null>(null)
const [showConfirmDialog, setShowConfirmDialog] = useState<...>(null)

// NEW:
const [inverters, setInverters] = useState<InverterData[]>([])
const [selectedInverter, setSelectedInverter] = useState<string | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)
```

**C. Add Fetch Function**:
```typescript
const fetchInverters = async () => {
  try {
    const response = await inverterApi.getAll()
    setInverters(response.data)
    setError(null)
  } catch (err) {
    console.error('Error fetching inverters:', err)
    setError('Failed to fetch inverter data')
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchInverters()
  const interval = setInterval(fetchInverters, 3000)
  return () => clearInterval(interval)
}, [])
```

**D. Update Field References**:
| Old Field | New Field | Notes |
|-----------|-----------|-------|
| `inv.id` | `inv.inverter_id` | Changed to string (INV1, INV2, etc.) |
| `inv.name` | `inv.inverter_id` | Use inverter_id for display |
| `inv.activePower` | `inv.AC_Power` | Value in Watts, divide by 1000 for kW |
| `inv.dcVoltage` | `inv.DC_Voltage_MPPT1` | From MPPT1 |
| `inv.dcCurrent` | `inv.DC_Current_MPPT1` | From MPPT1 |
| `inv.acVoltage` | `inv.AC_Voltage` | |
| `inv.acCurrent` | ❌ REMOVED | Not in API response |
| `inv.acFrequency` | `inv.AC_Frequency` | |
| `inv.temperature` | ❌ REMOVED | Not in API response |
| `inv.status` | Calculate from `Control_Enable_Status` and `AC_Power` | |
| `inv.efficiency` | Calculate: `(AC_Power / DC_Power_MPPT1) * 100` | |
| `inv.reactivePower` | ❌ REMOVED | Not in API response |
| `inv.uptime` | ❌ REMOVED | Not in API response |
| N/A | `inv.DC_Power_MPPT1` | NEW: DC power from MPPT1 |
| N/A | `inv.Control_WMax_Limit` | NEW: Power limit setting |
| N/A | `inv.Control_Enable_Status` | NEW: Enable status (0=Off, 1=On) |
| N/A | `inv.time` | NEW: Timestamp |

**E. Update Status Logic**:
```typescript
const getStatus = (inv: InverterData): 'running' | 'off' => {
  return inv.Control_Enable_Status === 1 && inv.AC_Power > 0 ? 'running' : 'off'
}
```

**F. Remove ON/OFF Control**:
- Remove `showConfirmDialog` state
- Remove `handleToggle()` function
- Remove `confirmToggle()` function
- Remove toggle switches from table
- Remove confirmation modal at bottom
- Control_Enable_Status is READ-ONLY (display only)

**G. Update Table Columns**:
```typescript
<tr>
  <th>Inverter</th>
  <th className="text-center">Status</th>
  <th className="text-end">AC Power</th>
  <th className="text-end">DC Power</th>
  <th className="text-end">Efficiency</th>
  <th className="text-end">Power Limit</th>
  <th className="text-center">Details</th>
</tr>
```

**H. Update Detail View**:
- Show `Control_Enable_Status` as badge (Enabled/Disabled)
- Show `Control_WMax_Limit` as power limit
- Remove temperature section
- Remove power factor section (no reactive power)
- Show timestamp from `inv.time`
- Calculate efficiency as `(AC_Power / DC_Power_MPPT1) * 100`

---

### 2. PowerOverview Component

**File**: `src/components/PowerOverview.tsx`

**Required Changes**:

**A. Update Imports**:
```typescript
import { powerMeterApi, type PowerMeterData } from '../services/api'
```

**B. Replace State & Fetch**:
```typescript
const [powerData, setPowerData] = useState<PowerMeterData | null>(null)
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const fetchPowerMeter = async () => {
  try {
    const response = await powerMeterApi.get()
    setPowerData(response.data)
    setError(null)
  } catch (err) {
    console.error('Error fetching power meter:', err)
    setError('Failed to fetch power meter data')
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchPowerMeter()
  const interval = setInterval(fetchPowerMeter, 3000)
  return () => clearInterval(interval)
}, [])
```

**C. Update Field References**:
| Old Field | New Field | Conversion |
|-----------|-----------|------------|
| Total power | `powerData.Total_Power_P` | Divide by 1000 for kW |
| Voltage | Average of `(Voltage_U1 + Voltage_U2 + Voltage_U3) / 3` | |
| Current | Sum of `Current_I1 + Current_I2 + Current_I3` | |
| Frequency | `powerData.Frequency_F` | |

---

### 3. GridStatus Component

**File**: `src/components/GridStatus.tsx`

**Required Changes**:

**A. Update Imports**:
```typescript
import { powerMeterApi, type PowerMeterData } from '../services/api'
```

**B. Replace State & Fetch**: (Same as PowerOverview)

**C. Update 3-Phase Display**:
```typescript
// Phase 1
<GaugeChart value={powerData.Voltage_U1} ... />
<GaugeChart value={powerData.Current_I1} ... />

// Phase 2
<GaugeChart value={powerData.Voltage_U2} ... />
<GaugeChart value={powerData.Current_I2} ... />

// Phase 3
<GaugeChart value={powerData.Voltage_U3} ... />
<GaugeChart value={powerData.Current_I3} ... />

// Frequency
{powerData.Frequency_F.toFixed(2)} Hz
```

---

### 4. PowerHistoryChart Component

**File**: `src/components/PowerHistoryChart.tsx`

**Required Changes**:

**A. Update Imports**:
```typescript
import { powerMeterApi, type PowerMeterData } from '../services/api'
```

**B. Replace Mock Data Generation with API Call**:
```typescript
const fetchHistory = async (period: 'today' | '7days' | '30days') => {
  try {
    let start: string
    let limit: number
    
    switch (period) {
      case 'today':
        start = '-24h'
        limit = 288 // One point every 5 minutes
        break
      case '7days':
        start = '-7d'
        limit = 168 // One point every hour
        break
      case '30days':
        start = '-30d'
        limit = 720 // One point every hour
        break
    }
    
    const response = await powerMeterApi.getHistory({ start, stop: 'now()', limit })
    const data = response.data.map(item => ({
      time: new Date(item.time).toLocaleTimeString(),
      power: item.Total_Power_P / 1000, // Convert to kW
      voltage: (item.Voltage_U1 + item.Voltage_U2 + item.Voltage_U3) / 3,
      current: item.Current_I1 + item.Current_I2 + item.Current_I3,
    }))
    setChartData(data)
    setError(null)
  } catch (err) {
    console.error('Error fetching power history:', err)
    setError('Failed to fetch history data')
  } finally {
    setLoading(false)
  }
}
```

**C. Update useEffect**:
```typescript
useEffect(() => {
  fetchHistory(timePeriod)
}, [timePeriod])
```

---

### 5. EnvironmentalMonitoring Component

**File**: `src/components/EnvironmentalMonitoring.tsx`

**Required Changes**:

**A. Update Imports**:
```typescript
import { weatherApi, type WeatherData } from '../services/api'
```

**B. Replace State & Fetch**:
```typescript
const [envData, setEnvData] = useState<WeatherData | null>(null)
const [chartData, setChartData] = useState<HistoryData[]>([])
const [loading, setLoading] = useState(true)
const [error, setError] = useState<string | null>(null)

const fetchWeather = async () => {
  try {
    const response = await weatherApi.get()
    setEnvData(response.data)
    setError(null)
  } catch (err) {
    console.error('Error fetching weather:', err)
    setError('Failed to fetch weather data')
  } finally {
    setLoading(false)
  }
}

useEffect(() => {
  fetchWeather()
  const interval = setInterval(fetchWeather, 3000)
  return () => clearInterval(interval)
}, [])
```

**C. Update Field References**:
| Old Field | New Field |
|-----------|-----------|
| `envData.irradiance` | `envData.Irradiance` |
| `envData.ambientTemp` | `envData.Ambient_Temp` |
| `envData.panelTemp` | `envData.Module_Temp` |

**D. Update History Chart Fetch**:
```typescript
const fetchWeatherHistory = async (period: 'today' | '7days' | '30days') => {
  try {
    let start: string
    let limit: number
    
    switch (period) {
      case 'today':
        start = '-24h'
        limit = 288
        break
      case '7days':
        start = '-7d'
        limit = 168
        break
      case '30days':
        start = '-30d'
        limit = 720
        break
    }
    
    const response = await weatherApi.getHistory({ start, stop: 'now()', limit })
    const data = response.data.map(item => ({
      time: new Date(item.time).toLocaleTimeString(),
      irradiance: item.Irradiance,
      ambientTemp: item.Ambient_Temp,
      panelTemp: item.Module_Temp,
    }))
    setChartData(data)
  } catch (err) {
    console.error('Error fetching weather history:', err)
  }
}
```

---

## Implementation Steps

1. ✅ **API Service Module Created** (`src/services/api.ts`)

2. **Update Components** (in order of complexity):
   - Start with **EnvironmentalMonitoring** (simplest - direct field mapping)
   - Then **PowerOverview** (simple - single endpoint)
   - Then **GridStatus** (simple - same endpoint as PowerOverview)
   - Then **PowerHistoryChart** (medium - history endpoint)
   - Finally **InverterMonitoring** (most complex - remove control features)

3. **Testing**:
   - Ensure API server is running on `http://localhost:5000`
   - Check browser console for any API errors
   - Verify data displays correctly
   - Test real-time updates (3-second intervals)
   - Test history chart time period switches

4. **Error Handling**:
   - All components should show loading spinner initially
   - All components should show error message if API fails
   - Components should handle empty data gracefully

---

## Summary of API Endpoints Used

| Component | Endpoint | Method | Update Frequency |
|-----------|----------|--------|------------------|
| InverterMonitoring | `/api/inverters` | GET | Every 3 seconds |
| PowerOverview | `/api/power-meter` | GET | Every 3 seconds |
| GridStatus | `/api/power-meter` | GET | Every 3 seconds |
| PowerHistoryChart | `/api/power-meter/history` | GET | On time period change |
| EnvironmentalMonitoring | `/api/weather` | GET | Every 3 seconds |
| EnvironmentalMonitoring (chart) | `/api/weather/history` | GET | On time period change |

---

## Notes

- **No POST endpoints**: Control_Enable_Status and Control_WMax_Limit are READ-ONLY
- **Power units**: API returns Watts, UI displays kW (divide by 1000)
- **Timestamps**: API returns ISO 8601 format, use `new Date(time).toLocaleString()` for display
- **Efficiency**: Not provided by API, calculate as `(AC_Power / DC_Power_MPPT1) * 100`
- **Status**: Not provided by API, determine from `Control_Enable_Status` and power values
