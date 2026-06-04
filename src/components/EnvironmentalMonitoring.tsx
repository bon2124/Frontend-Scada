import { useState, useEffect, useCallback, useRef } from 'react'
import { weatherApi, type WeatherData } from '../services/api'
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts'

/* ─────────────────────────────────────────────
   LED Indicator
───────────────────────────────────────────── */
const LED = ({
    active,
    col,
    label,
}: {
    active: boolean
    col: string
    label: string
}) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
        <span
            style={{
                fontSize: 8,
                fontWeight: 700,
                color: active ? col : '#999',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                transition: 'color 0.3s',
            }}
        >
            {label}
        </span>
        <div
            style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: active
                    ? `radial-gradient(circle at 35% 35%, ${col}ff, ${col}88)`
                    : 'radial-gradient(circle at 35% 35%, #e0e0e0, #b0b0b0)',
                boxShadow: active
                    ? `0 0 10px ${col}88, 0 0 4px ${col}cc, inset 0 1px 2px rgba(255,255,255,0.4)`
                    : 'inset 0 1px 2px rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.15)',
                border: `1.5px solid ${active ? col + '99' : '#ccc'}`,
                transition: 'all 0.4s ease',
            }}
        />
    </div>
)

/* ─────────────────────────────────────────────
   Thermometer Component
───────────────────────────────────────────── */
const Thermometer = ({
    value,
    max = 100,
    label,
    unit = '°C',
    color,
    gradientId,
}: {
    value: number
    max?: number
    label: string
    unit?: string
    color: string
    gradientId: string
}) => {
    const pct   = Math.min(Math.max(value / max, 0), 1)
    const tubeH = 190
    const tubeX = 30        // left edge of tube
    const tubeW = 16        // tube width
    const tubeY = 8         // top of tube
    const fillH = tubeH * pct
    const fillY = tubeY + (tubeH - fillH)
    const bulbCX = tubeX + tubeW / 2   // = 38
    const bulbCY = tubeY + tubeH + 20  // below tube
    const bulbR  = 13
    const svgW   = 75
    const svgH   = bulbCY + bulbR + 6  // total SVG height
    const labelX = tubeX + tubeW + 12  // right of tube, next to tick marks
    const ticks  = [0, 20, 40, 60, 80, 100]

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                minWidth: 130,
            }}
        >
            {/* Title label */}
            <span
                style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#444',
                    letterSpacing: 1.2,
                    textTransform: 'uppercase',
                    whiteSpace: 'nowrap',
                    borderBottom: `2px solid ${color}`,
                    paddingBottom: 3,
                }}
            >
                {label}
            </span>

            {/* SVG: tube + scale labels + bulb — all in one coordinate space */}
            <svg
                width={svgW}
                height={svgH}
                style={{ overflow: 'visible' }}
            >
                <defs>
                    <linearGradient id={gradientId} x1="0" y1="1" x2="0" y2="0">
                        <stop offset="0%"   stopColor={color} stopOpacity="1"   />
                        <stop offset="100%" stopColor={color} stopOpacity="0.6" />
                    </linearGradient>
                    <filter id={`glow-${gradientId}`}>
                        <feGaussianBlur stdDeviation="1.5" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* Tube shadow */}
                <rect
                    x={tubeX + 1} y={tubeY + 1}
                    width={tubeW} height={tubeH}
                    rx={8}
                    fill="rgba(0,0,0,0.05)"
                />
                {/* Tube background */}
                <rect
                    x={tubeX} y={tubeY}
                    width={tubeW} height={tubeH}
                    rx={8}
                    fill="#efefef"
                    stroke="#d0d0d0"
                    strokeWidth={1.5}
                />

                {/* Scale labels + tick marks — both at same y so perfectly aligned */}
                {ticks.map(v => {
                    const y = tubeY + tubeH - (tubeH * v / 100)
                    return (
                        <g key={v}>
                            {/* Label left of tube */}
                            <text
                                x={labelX}
                                y={y}
                                textAnchor="start"
                                dominantBaseline="middle"
                                fontSize={8}
                                fontFamily="monospace"
                                fill="#999"
                            >
                                {v}
                            </text>
                            {/* Tick mark right of tube */}
                            <line
                                x1={tubeX + tubeW}
                                y1={y}
                                x2={tubeX + tubeW + (v % 40 === 0 ? 6 : 4)}
                                y2={y}
                                stroke="#ccc"
                                strokeWidth={v % 40 === 0 ? 1.5 : 1}
                            />
                        </g>
                    )
                })}

                {/* Liquid fill */}
                {fillH > 0 && (
                    <rect
                        x={tubeX + 1}
                        y={fillY}
                        width={tubeW - 2}
                        height={fillH}
                        rx={6}
                        fill={`url(#${gradientId})`}
                        filter={`url(#glow-${gradientId})`}
                        style={{ transition: 'all 0.7s ease' }}
                    />
                )}

                {/* Glass shine */}
                <rect
                    x={tubeX + 3}
                    y={tubeY + 3}
                    width={4}
                    height={tubeH - 10}
                    rx={2}
                    fill="white"
                    opacity={0.3}
                />

                {/* Bulb outer glow */}
                <circle cx={bulbCX} cy={bulbCY} r={bulbR + 4} fill={color} opacity={0.12} />
                {/* Bulb fill */}
                <circle cx={bulbCX} cy={bulbCY} r={bulbR} fill={color} stroke="#ccc" strokeWidth={1.5} />
                {/* Bulb shine */}
                <circle cx={bulbCX - 4} cy={bulbCY - 4} r={3.5} fill="white" opacity={0.35} />
            </svg>

            {/* Digital readout */}
            <div
                style={{
                    background: '#1e293b',
                    border: `1.5px solid #334155`,
                    borderRadius: 6,
                    padding: '5px 12px',
                    fontFamily: '"Courier New", monospace',
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#f8fafc',
                    minWidth: 80,
                    textAlign: 'center',
                    boxShadow: `0 2px 8px rgba(0,0,0,0.15)`,
                    letterSpacing: 1,
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'center',
                    gap: 4,
                }}
            >
                <span>{isNaN(value) ? '--.-' : value.toFixed(1)}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>{unit}</span>
            </div>
        </div>
    )
}


/* ─────────────────────────────────────────────
   Semicircular Gauge
───────────────────────────────────────────── */
const SemiGauge = ({ value, max = 1000 }: { value: number; max?: number }) => {
    const pct = Math.min(Math.max(value / max, 0), 1)
    const startAngle = 215
    const endAngle = 325
    const sweep = endAngle - startAngle
    const angle = startAngle + sweep * pct

    const toRad = (deg: number) => (deg * Math.PI) / 180
    const cx = 155, cy = 155, r = 110

    const nLen = 95
    const nx = cx + nLen * Math.cos(toRad(angle))
    const ny = cy + nLen * Math.sin(toRad(angle))

    const colorStops = [
        { pct: 0,   color: '#1e88e5' }, // 0   – 200  : Blue
        { pct: 0.2, color: '#43a047' }, // 200 – 400  : Green
        { pct: 0.4, color: '#fdd835' }, // 400 – 600  : Yellow
        { pct: 0.6, color: '#fb8c00' }, // 600 – 800  : Orange
        { pct: 0.8, color: '#e53935' }, // 800 – 1000 : Red
        { pct: 1,   color: '#e53935' }, // end cap
    ]

    const arcPath = (start: number, end: number, radius: number = r) => {
        const sp = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) }
        const ep = { x: cx + radius * Math.cos(toRad(end)),   y: cy + radius * Math.sin(toRad(end)) }
        const large = end - start > 180 ? 1 : 0
        return `M ${sp.x} ${sp.y} A ${radius} ${radius} 0 ${large} 1 ${ep.x} ${ep.y}`
    }

    const ticks = [0, 200, 400, 600, 800, 1000]
    const minorTicks = [100, 300, 500, 700, 900]

    return (
        <svg width={310} height={205} viewBox="0 0 310 205">
            <defs>
                <filter id="gauge-shadow">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
                </filter>
                <filter id="needle-glow">
                    <feGaussianBlur stdDeviation="1" result="blur" />
                    <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
            </defs>

            {/* Panel background */}
            <rect x={2} y={2} width={306} height={201} rx={10}
                fill="white" stroke="#e8e8e8" strokeWidth={1.5}
                filter="url(#gauge-shadow)"
            />

            {/* Track shadow */}
            <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#e0e0e0" strokeWidth={17} strokeLinecap="round" />
            {/* Track */}
            <path d={arcPath(startAngle, endAngle)} fill="none" stroke="#ececec" strokeWidth={15} strokeLinecap="round" />

            {/* Colored arc segments */}
            {colorStops.slice(0, -1).map((stop, i) => {
                const next = colorStops[i + 1]
                const s = startAngle + sweep * stop.pct
                const e = startAngle + sweep * next.pct
                return (
                    <path
                        key={i}
                        d={arcPath(s, e)}
                        fill="none"
                        stroke={stop.color}
                        strokeWidth={13}
                        strokeLinecap="butt"
                        opacity={0.9}
                    />
                )
            })}

            {/* Active zone highlight */}
            <path
                d={arcPath(startAngle, startAngle + sweep * pct)}
                fill="none"
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={13}
                strokeLinecap="butt"
            />

            {/* Major tick marks + labels */}
            {ticks.map(v => {
                const a = startAngle + sweep * (v / max)
                const inner = r - 18
                const outer = r + 2
                const labelR = r + 20
                const xi = cx + inner * Math.cos(toRad(a))
                const yi = cy + inner * Math.sin(toRad(a))
                const xo = cx + outer * Math.cos(toRad(a))
                const yo = cy + outer * Math.sin(toRad(a))
                const xl = cx + labelR * Math.cos(toRad(a))
                const yl = cy + labelR * Math.sin(toRad(a))
                return (
                    <g key={v}>
                        <line x1={xi} y1={yi} x2={xo} y2={yo} stroke="#888" strokeWidth={2.5} />
                        <text
                            x={xl} y={yl}
                            textAnchor="middle"
                            dominantBaseline="middle"
                            fontSize={9}
                            fontFamily="monospace"
                            fontWeight="600"
                            fill="#555"
                        >
                            {v}
                        </text>
                    </g>
                )
            })}

            {/* Minor tick marks */}
            {minorTicks.map(v => {
                const a = startAngle + sweep * (v / max)
                const inner = r - 8
                const outer = r + 1
                const xi = cx + inner * Math.cos(toRad(a))
                const yi = cy + inner * Math.sin(toRad(a))
                const xo = cx + outer * Math.cos(toRad(a))
                const yo = cy + outer * Math.sin(toRad(a))
                return (
                    <line key={v} x1={xi} y1={yi} x2={xo} y2={yo} stroke="#bbb" strokeWidth={1} />
                )
            })}

            {/* Center hub */}
            <circle cx={cx} cy={cy} r={10} fill="#e8e8e8" stroke="#ccc" strokeWidth={1} />

            {/* Needle shadow */}
            <line
                x1={cx} y1={cy} x2={nx + 1} y2={ny + 1}
                stroke="rgba(0,0,0,0.1)" strokeWidth={4} strokeLinecap="round"
                style={{ transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
            />
            {/* Needle */}
            <line
                x1={cx} y1={cy} x2={nx} y2={ny}
                stroke="#222" strokeWidth={2.5} strokeLinecap="round"
                filter="url(#needle-glow)"
                style={{ transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1)' }}
            />

            {/* Hub cap */}
            <circle cx={cx} cy={cy} r={6} fill="#444" stroke="white" strokeWidth={2} />
            <circle cx={cx} cy={cy} r={2} fill="#888" />

        </svg>
    )
}

/* ─────────────────────────────────────────────
   Last Update Card (isolated timer)
───────────────────────────────────────────── */
const LastUpdateCard = () => {
    const [now, setNow] = useState(new Date())

    useEffect(() => {
        const t = setInterval(() => setNow(new Date()), 1000)
        return () => clearInterval(t)
    }, [])

    const timeStr = now.toLocaleTimeString('en-US', {
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
    const dateStr = now.toLocaleDateString('en-US', {
        day: 'numeric', month: 'numeric', year: 'numeric',
    })

    return (
        <div
            style={{
                background: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: 10,
                padding: '10px 14px',
                borderLeft: '4px solid #f59e0b',
                flex: 1,
                display: 'flex',
                flexDirection: 'column' as const,
                justifyContent: 'center',
            }}
        >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <i className="bi bi-clock-history" style={{ fontSize: 14, color: '#f59e0b' }}></i>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 0.3 }}>Last Update</span>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4, lineHeight: 1.2, fontFamily: '"Courier New", monospace' }}>
                {timeStr}
            </div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                {dateStr} • Auto refresh every 30 seconds
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   LabVIEW Panel
───────────────────────────────────────────── */
const LabViewPanel = ({ weatherData }: { weatherData: WeatherData }) => {
    const irr = weatherData.Irradiance
    const amb = weatherData.Ambient_Temp
    const mod = weatherData.Module_Temp

    const irrHigh   = irr >= 800
    const irrNormal = irr >= 400 && irr < 800

    // Track peak irradiance
    const peakRef = useRef(irr)
    if (irr > peakRef.current) peakRef.current = irr
    const peakIrr = peakRef.current

    const ambHigh   = amb >= 35
    const ambNormal = amb >= 15 && amb < 35
    const ambLow    = amb < 15

    const modHigh   = mod >= 60
    const modNormal = mod >= 30 && mod < 60
    const modLow    = mod < 30


    // Irradiance quality label
    const irrLabel = irrHigh ? 'Excellent' : irrNormal ? 'Good' : 'Low'
    const irrColor = irrHigh ? '#43a047' : irrNormal ? '#fb8c00' : '#e53935'

    return (
        <div
            style={{
                background: 'linear-gradient(180deg, #fafafa 0%, #f2f2f2 100%)',
                border: '1px solid #e0e0e0',
                borderRadius: 12,
                padding: '6px 16px 8px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                boxShadow: '0 2px 16px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.8)',
            }}
        >
            {/* ══════ LEFT GROUP — Instruments ══════ */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>

                {/* 1. Outside Temperature */}
                <Thermometer
                    value={amb}
                    max={100}
                    label="Outside Temperature"
                    color="#2196f3"
                    gradientId="grad-amb"
                />

                {/* 2. Ambient LED */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        background: 'white',
                        borderRadius: 10,
                        border: '1px solid #eee',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                >
                    <LED active={ambHigh}   col="#e53935" label="HIGH"   />
                    <LED active={ambNormal} col="#43a047" label="NORMAL" />
                    <LED active={ambLow}    col="#1e88e5" label="LOW"    />
                </div>

                {/* 3. Solar Irradiance gauge */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 4,
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                            style={{
                                fontSize: 11,
                                fontWeight: 700,
                                color: '#444',
                                letterSpacing: 1.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            Solar Irradiance
                        </span>
                        <span
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: irrColor,
                                background: irrColor + '18',
                                border: `1px solid ${irrColor}44`,
                                borderRadius: 20,
                                padding: '2px 8px',
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            {irrLabel}
                        </span>
                    </div>

                    <SemiGauge value={irr} max={1000} />

                    <div
                        style={{
                            background: '#1e293b',
                            border: '1.5px solid #334155',
                            borderRadius: 6,
                            padding: '5px 12px',
                            fontFamily: '"Courier New", monospace',
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#f8fafc',
                            minWidth: 80,
                            textAlign: 'center',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                            letterSpacing: 1,
                            display: 'flex',
                            alignItems: 'baseline',
                            justifyContent: 'center',
                            gap: 4,
                        }}
                    >
                        <span>{irr.toFixed(0)}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#94a3b8' }}>W/m²</span>
                    </div>
                </div>

                {/* 4. Panel LED */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 10,
                        padding: '8px 10px',
                        background: 'white',
                        borderRadius: 10,
                        border: '1px solid #eee',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                    }}
                >
                    <LED active={modHigh}   col="#e53935" label="HIGH"   />
                    <LED active={modNormal} col="#43a047" label="NORMAL" />
                    <LED active={modLow}    col="#1e88e5" label="LOW"    />
                </div>

                {/* 5. Panel Temperature */}
                <Thermometer
                    value={mod}
                    max={100}
                    label="Panel Temperature"
                    color="#ef5350"
                    gradientId="grad-mod"
                />
            </div>

            {/* ══════ RIGHT GROUP — Info Cards ══════ */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, minWidth: 200 }}>

                {/* Station Status */}
                <div
                    style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '10px 14px',
                        borderLeft: '4px solid #22c55e',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <i className="bi bi-activity" style={{ fontSize: 14, color: '#22c55e' }}></i>
                            <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 0.3 }}>Station Status</span>
                        </div>
                        <span
                            style={{
                                fontSize: 9,
                                fontWeight: 700,
                                color: '#fff',
                                background: '#22c55e',
                                borderRadius: 12,
                                padding: '2px 10px',
                                letterSpacing: 0.5,
                                textTransform: 'uppercase',
                            }}
                        >
                            ● Normal
                        </span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4, lineHeight: 1.2 }}>
                        Online
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                        All sensors operational
                    </div>
                </div>

                {/* Last Update */}
                <LastUpdateCard />

                {/* Peak Irradiance */}
                <div
                    style={{
                        background: 'white',
                        border: '1px solid #e2e8f0',
                        borderRadius: 10,
                        padding: '10px 14px',
                        borderLeft: '4px solid #e53935',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <i className="bi bi-lightning-charge-fill" style={{ fontSize: 14, color: '#e53935' }}></i>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', letterSpacing: 0.3 }}>Peak Irradiance</span>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginTop: 4, lineHeight: 1.2, fontFamily: '"Courier New", monospace' }}>
                        {peakIrr.toFixed(0)} <span style={{ fontSize: 14, fontWeight: 700, color: '#94a3b8' }}>W/m²</span>
                    </div>
                    <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginTop: 2 }}>
                        Highest today • {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ─────────────────────────────────────────────
   Main Component
───────────────────────────────────────────── */
const EnvironmentalMonitoring = () => {
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
    const [weatherHistory, setWeatherHistory] = useState<WeatherData[]>([])
    const [timePeriod, setTimePeriod] = useState<'today' | '7days' | '30days'>('today')
    const [chartData, setChartData] = useState<{ time: string; irradiance: number; ambientTemp: number; moduleTemp: number }[]>([])
    const [chartType, setChartType] = useState<'line' | 'bar'>('line')

    // Fetch current weather data
    const fetchWeatherData = useCallback(async () => {
        try {
            const response = await weatherApi.get()
            setWeatherData(response.data)
        } catch (err) {
            console.error('Error fetching weather data:', err)
        }
    }, [])

    // Fetch weather history using optimized approach
    const fetchWeatherHistory = useCallback(async () => {
        try {
            const now = new Date()
            let startTime: string
            const limit = 1000

            // Calculate start time based on selected period
            if (timePeriod === 'today') {
                const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0)
                startTime = startOfDay.toISOString()
                console.log(`Today time range: ${startTime} to ${now.toISOString()}`)
                console.log(`Local start of day: ${startOfDay.toLocaleString()}`)
                console.log(`UTC start of day: ${startOfDay.toISOString()}`)
            } else if (timePeriod === '7days') {
                const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
                sevenDaysAgo.setHours(0, 0, 0, 0)
                startTime = sevenDaysAgo.toISOString()
            } else if (timePeriod === '30days') {
                const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
                thirtyDaysAgo.setHours(0, 0, 0, 0)
                startTime = thirtyDaysAgo.toISOString()
            } else {
                startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
            }

            // Try new time-series API first with correct metric names
            try {
                console.log('Trying time-series API with params:', {
                    deviceId: 'weather',
                    metrics: 'Ambient_Temp,Irradiance,Module_Temp',
                    startTime,
                    endTime: now.toISOString(),
                    interval: timePeriod === 'today' ? '1h' : timePeriod === '7days' ? '4h' : '1d',
                    aggregateType: 'mean'
                })

                const timeSeriesResponse = await weatherApi.getTimeSeries({
                    deviceId: 'weather',
                    metrics: 'Ambient_Temp,Irradiance,Module_Temp',
                    startTime,
                    endTime: now.toISOString(),
                    interval: timePeriod === 'today' ? '1h' : timePeriod === '7days' ? '4h' : '1d',
                    aggregateType: 'avg'
                })

                console.log('Time-series API response:', timeSeriesResponse.data)
                console.log('Sample time-series data points:', timeSeriesResponse.data.data.slice(0, 5))
                console.log('Full time-series data:', timeSeriesResponse.data.data)

                const transformedData: WeatherData[] = timeSeriesResponse.data.data.map(item => ({
                    Ambient_Temp: typeof item.Ambient_Temp === 'number' ? item.Ambient_Temp : parseFloat(item.Ambient_Temp as string) || 0,
                    Irradiance:   typeof item.Irradiance   === 'number' ? item.Irradiance   : parseFloat(item.Irradiance   as string) || 0,
                    Module_Temp:  typeof item.Module_Temp  === 'number' ? item.Module_Temp  : parseFloat(item.Module_Temp  as string) || 0,
                    time: item.timestamp
                }))

                console.log(`Time-series data for ${timePeriod}:`, transformedData.length, 'rows')
                console.log('Transformed data sample:', transformedData.slice(0, 3))
                console.log('Transformed data with irradiance values:', transformedData.map(d => ({
                    time: d.time,
                    irradiance: d.Irradiance,
                    ambientTemp: d.Ambient_Temp,
                    moduleTemp: d.Module_Temp
                })))

                if (transformedData.length > 0) {
                    setWeatherHistory(transformedData)
                    return // Use time-series data successfully
                }

            } catch (tsErr) {
                console.error('Time-series API failed with error:', tsErr)
                if (tsErr && typeof tsErr === 'object' && 'response' in tsErr) {
                    const axiosError = tsErr as { response?: { data?: unknown; status?: number } }
                    console.error('API Error Response:', axiosError.response?.data)
                    console.error('API Error Status:', axiosError.response?.status)
                }
                // Continue to fallback API below
            }

            // Use the working history API as fallback
            console.log('Using history API with params:', {
                start: startTime,
                stop: now.toISOString(),
                limit
            })

            const response = await weatherApi.getHistory({
                start: startTime,
                stop: now.toISOString(),
                limit
            })

            console.log(`Weather history for ${timePeriod}:`, response.data.length, 'rows')
            if (response.data.length > 0) {
                console.log('Time range in response:', response.data[0].time, 'to', response.data[response.data.length - 1].time)
                console.log('Sample data:', response.data.slice(0, 3))

                const firstDataTime = new Date(response.data[0].time)
                const lastDataTime  = new Date(response.data[response.data.length - 1].time)
                const requestedStartTime = new Date(startTime)

                console.log('Requested start time:', requestedStartTime.toISOString())
                console.log('Actual first data time:', firstDataTime.toISOString())
                console.log('Actual last data time:', lastDataTime.toISOString())
                console.log('Time difference (hours):', (firstDataTime.getTime() - requestedStartTime.getTime()) / (1000 * 60 * 60))

                if (Math.abs(firstDataTime.getTime() - requestedStartTime.getTime()) > 2 * 60 * 60 * 1000) {
                    console.warn('⚠️  API returned data from wrong time period!')
                }
            } else {
                console.warn('⚠️  No data returned from API')
            }

            setWeatherHistory(response.data)
        } catch (err) {
            console.error('Error fetching weather history:', err)
        }
    }, [timePeriod])

    // Process weather history data for chart
    useEffect(() => {
        if (weatherHistory.length === 0) {
            setChartData([])
            return
        }

        let processedData: { time: string; irradiance: number; ambientTemp: number; moduleTemp: number }[] = []

        switch (timePeriod) {
            case 'today': {
                // For time-series data, it's already hourly aggregated, just format time
                if (weatherHistory.length > 0 && weatherHistory[0].time.includes('T') && weatherHistory[0].time.includes('Z')) {
                    processedData = weatherHistory.map(item => {
                        const date = new Date(item.time)
                        return {
                            time: date.toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                                hour12: false
                            }),
                            irradiance:  item.Irradiance,
                            ambientTemp: item.Ambient_Temp,
                            moduleTemp:  item.Module_Temp
                        }
                    })
                    console.log('Time-series processed data:', processedData)
                    console.log('Final chart data with values:', processedData.map(d => ({
                        time: d.time,
                        irradiance: d.irradiance,
                        ambientTemp: d.ambientTemp,
                        moduleTemp: d.moduleTemp
                    })))
                } else {
                    // Fallback history API data — needs aggregation
                    const hourlyData = new Map<number, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()

                    console.log('Processing today data, total items:', weatherHistory.length)
                    console.log('Time range:', weatherHistory[0]?.time, 'to', weatherHistory[weatherHistory.length - 1]?.time)

                    weatherHistory.forEach(item => {
                        const date = new Date(item.time)
                        const hour = date.getHours()

                        if (!hourlyData.has(hour)) {
                            hourlyData.set(hour, {
                                sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                                count: 0
                            })
                        }

                        const existing = hourlyData.get(hour)!
                        existing.sum.irradiance  += item.Irradiance
                        existing.sum.ambientTemp += item.Ambient_Temp
                        existing.sum.moduleTemp  += item.Module_Temp
                        existing.count++
                    })

                    // Fill missing hours with 0 values
                    const currentHour = new Date().getHours()
                    const completeHourlyData = new Map<number, { irradiance: number; ambientTemp: number; moduleTemp: number }>()

                    for (let hour = 0; hour <= currentHour; hour++) {
                        if (hourlyData.has(hour)) {
                            const data = hourlyData.get(hour)!
                            completeHourlyData.set(hour, {
                                irradiance:  data.count > 0 ? data.sum.irradiance  / data.count : 0,
                                ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                                moduleTemp:  data.count > 0 ? data.sum.moduleTemp  / data.count : 0
                            })
                        } else {
                            completeHourlyData.set(hour, { irradiance: 0, ambientTemp: 0, moduleTemp: 0 })
                        }
                    }

                    processedData = Array.from(completeHourlyData.entries())
                        .map(([hour, data]) => ({
                            time: `${hour.toString().padStart(2, '0')}:00`,
                            irradiance:  data.irradiance,
                            ambientTemp: data.ambientTemp,
                            moduleTemp:  data.moduleTemp
                        }))
                        .sort((a, b) => a.time.localeCompare(b.time))

                    console.log('Hourly data (real data + 0 for missing):', processedData)
                }
                break
            }

            case '7days': {
                const dailyData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()

                weatherHistory.forEach(item => {
                    const date    = new Date(item.time)
                    const dateKey = date.toISOString().split('T')[0]

                    if (!dailyData.has(dateKey)) {
                        dailyData.set(dateKey, {
                            sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                            count: 0
                        })
                    }

                    const existing = dailyData.get(dateKey)!
                    existing.sum.irradiance  += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp  += item.Module_Temp
                    existing.count++
                })

                processedData = Array.from(dailyData.entries())
                    .map(([dateKey, data]) => {
                        const date = new Date(dateKey)
                        return {
                            time: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                            irradiance:  data.count > 0 ? data.sum.irradiance  / data.count : 0,
                            ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                            moduleTemp:  data.count > 0 ? data.sum.moduleTemp  / data.count : 0
                        }
                    })
                    .sort((a, b) => a.time.localeCompare(b.time))
                break
            }

            case '30days': {
                const monthlyData = new Map<string, { sum: { irradiance: number; ambientTemp: number; moduleTemp: number }; count: number }>()

                weatherHistory.forEach(item => {
                    const date    = new Date(item.time)
                    const dateKey = `${date.getMonth() + 1}/${date.getDate()}`

                    if (!monthlyData.has(dateKey)) {
                        monthlyData.set(dateKey, {
                            sum: { irradiance: 0, ambientTemp: 0, moduleTemp: 0 },
                            count: 0
                        })
                    }

                    const existing = monthlyData.get(dateKey)!
                    existing.sum.irradiance  += item.Irradiance
                    existing.sum.ambientTemp += item.Ambient_Temp
                    existing.sum.moduleTemp  += item.Module_Temp
                    existing.count++
                })

                processedData = Array.from(monthlyData.entries())
                    .map(([dateKey, data]) => ({
                        time: dateKey,
                        irradiance:  data.count > 0 ? data.sum.irradiance  / data.count : 0,
                        ambientTemp: data.count > 0 ? data.sum.ambientTemp / data.count : 0,
                        moduleTemp:  data.count > 0 ? data.sum.moduleTemp  / data.count : 0
                    }))
                    .sort((a, b) => {
                        const [aMonth, aDay] = a.time.split('/').map(Number)
                        const [bMonth, bDay] = b.time.split('/').map(Number)
                        return aMonth - bMonth || aDay - bDay
                    })
                break
            }
        }

        setChartData(processedData)
    }, [weatherHistory, timePeriod])

    // Custom Tooltip for Chart
    const CustomTooltip = ({
        active,
        payload,
        label,
    }: {
        active?: boolean
        payload?: Array<{ color: string; name: string; value: number; unit?: string }>
        label?: string
    }) => {
        if (active && payload && payload.length) {
            return (
                <div
                    style={{
                        background: 'white',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        padding: '8px 12px',
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    }}
                >
                    <p style={{ fontWeight: 700, marginBottom: 6, color: '#333', fontSize: 12 }}>{`🕐 ${label}`}</p>
                    {payload.map((pld, index: number) => (
                        <p key={index} style={{ color: pld.color, marginBottom: 3, fontSize: 11 }}>
                            {`${pld.name}: `}
                            <strong>{`${pld.value.toFixed(1)}${pld.unit || ''}`}</strong>
                        </p>
                    ))}
                </div>
            )
        }
        return null
    }

    // Initial fetch and periodic updates
    useEffect(() => {
        fetchWeatherData()
        fetchWeatherHistory()

        const interval = setInterval(() => {
            fetchWeatherData()
            fetchWeatherHistory()
        }, 30000)

        return () => clearInterval(interval)
    }, [fetchWeatherData, fetchWeatherHistory, timePeriod])

    // Additional initial fetch
    useEffect(() => {
        fetchWeatherData()
        fetchWeatherHistory()
    }, [fetchWeatherData, fetchWeatherHistory])

    if (!weatherData) {
        return (
            <div className="card shadow-sm">
                <div className="card-header bg-warning text-dark">
                    <h5 className="mb-0">
                        <i className="bi bi-sun me-2"></i>
                        Environmental Monitoring
                    </h5>
                </div>
                <div className="card-body text-center py-5">
                    <div className="spinner-border text-warning" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-3 text-muted">Loading weather data...</p>
                </div>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* ── LabVIEW Panel Card ── */}
            <div
                className="card shadow-sm"
                style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden' }}
            >
                <div
                    className="card-header py-2"
                    style={{
                        background: 'linear-gradient(90deg, #f9a825 0%, #fbc02d 100%)',
                        border: 'none',
                    }}
                >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h5 className="mb-0" style={{ color: '#333', fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>
                            <i className="bi bi-sun-fill me-2" style={{ color: '#e65100' }}></i>
                            Environmental Monitoring
                        </h5>
                        <span
                            style={{
                                fontSize: 10,
                                color: '#5d4037',
                                background: 'rgba(255,255,255,0.4)',
                                borderRadius: 20,
                                padding: '2px 10px',
                                fontWeight: 600,
                                letterSpacing: 0.5,
                            }}
                        >
                            ● LIVE
                        </span>
                    </div>
                </div>
                <div className="card-body p-1" style={{ background: '#f7f7f7' }}>
                    <LabViewPanel weatherData={weatherData} />
                </div>
            </div>

            {/* ── Location Map + Environmental History ── */}
            <div className="row g-2" style={{ height: 350, marginTop: 2 }}>

                {/* Map — col 4 */}
                <div className="col-lg-4" style={{ height: 350 }}>
                    <div
                        className="card h-100"
                        style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    >
                        <div
                            className="card-header py-2"
                            style={{
                                background: 'linear-gradient(90deg, #c62828, #e53935)',
                                border: 'none',
                            }}
                        >
                            <h6 className="mb-0" style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
                                <i className="bi bi-geo-alt-fill me-1"></i>
                                Solar Plant Location
                            </h6>
                        </div>
                        <div
                            className="card-body p-0"
                            style={{ height: 'calc(100% - 38px)', overflow: 'hidden' }}
                        >
                            <iframe
                                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d30670.74003548546!2d108.1117601743164!3d16.0736606!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314218d68dff9545%3A0x714561e9f3a7292c!2zVHLGsOG7nW5nIMSQ4bqhaSBo4buNYyBCw6FjaCBLaG9hIC0gxJDhuqFpIGjhu41jIMSQw6AgTuG6tW5n!5e0!3m2!1svi!2s!4v1761808003776!5m2!1svi!2s"
                                width="100%"
                                height="100%"
                                style={{ border: 0, display: 'block' }}
                                allowFullScreen
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Solar Plant Location"
                            />
                        </div>
                    </div>
                </div>

                {/* Chart — col 8 */}
                <div className="col-lg-8" style={{ height: 350 }}>
                    <div
                        className="card h-100"
                        style={{ border: '1px solid #e8e8e8', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
                    >
                        <div
                            className="card-header py-2"
                            style={{
                                background: 'linear-gradient(90deg, #0077b6, #0096c7)',
                                border: 'none',
                            }}
                        >
                            <div className="d-flex justify-content-between align-items-center">
                                <h6 className="mb-0" style={{ color: 'white', fontSize: 12, fontWeight: 700, letterSpacing: 0.5 }}>
                                    <i className="bi bi-graph-up me-1"></i>
                                    Environmental History
                                </h6>
                                <div className="d-flex gap-2">
                                    {/* Chart type */}
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${chartType === 'line' ? 'btn-light' : 'btn-outline-light'}`}
                                            onClick={() => setChartType('line')}
                                            title="Line Chart"
                                            style={{ fontSize: 11, padding: '2px 8px' }}
                                        >
                                            <i className="bi bi-graph-up"></i>
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${chartType === 'bar' ? 'btn-light' : 'btn-outline-light'}`}
                                            onClick={() => setChartType('bar')}
                                            title="Bar Chart"
                                            style={{ fontSize: 11, padding: '2px 8px' }}
                                        >
                                            <i className="bi bi-bar-chart-fill"></i>
                                        </button>
                                    </div>
                                    {/* Time period */}
                                    <div className="btn-group btn-group-sm" role="group">
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${timePeriod === 'today' ? 'btn-light' : 'btn-outline-light'}`}
                                            onClick={() => setTimePeriod('today')}
                                            style={{ fontSize: 11, padding: '2px 10px' }}
                                        >
                                            Today
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${timePeriod === '7days' ? 'btn-light' : 'btn-outline-light'}`}
                                            onClick={() => setTimePeriod('7days')}
                                            style={{ fontSize: 11, padding: '2px 10px' }}
                                        >
                                            7 Days
                                        </button>
                                        <button
                                            type="button"
                                            className={`btn btn-sm ${timePeriod === '30days' ? 'btn-light' : 'btn-outline-light'}`}
                                            onClick={() => setTimePeriod('30days')}
                                            style={{ fontSize: 11, padding: '2px 10px' }}
                                        >
                                            30 Days
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card-body p-2" style={{ height: 'calc(100% - 38px)', background: 'white' }}>
                            {weatherHistory.length === 0 ? (
                                <div className="d-flex justify-content-center align-items-center h-100">
                                    <div className="text-center">
                                        <div className="spinner-border text-primary" style={{ width: '2rem', height: '2rem' }} role="status">
                                            <span className="visually-hidden">Loading...</span>
                                        </div>
                                        <p className="mt-2 text-muted small">Loading chart data...</p>
                                    </div>
                                </div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    {chartType === 'line' ? (
                                        <LineChart
                                            data={chartData}
                                            margin={{ top: 5, right: 35, left: 20, bottom: 20 }}
                                        >
                                            <defs>
                                                <linearGradient id="colorIrr" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#ffc107" stopOpacity={0.15} />
                                                    <stop offset="95%" stopColor="#ffc107" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="time"
                                                angle={timePeriod === '30days' ? -45 : 0}
                                                textAnchor={timePeriod === '30days' ? 'end' : 'middle'}
                                                height={timePeriod === '30days' ? 60 : 28}
                                                interval={timePeriod === 'today' ? 1 : 0}
                                                tick={{ fontSize: 10, fill: '#888' }}
                                                stroke="#e0e0e0"
                                                tickLine={false}
                                            />
                                            <YAxis
                                                yAxisId="left"
                                                label={{ value: 'Irradiance (W/m²)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#aaa' } }}
                                                tick={{ fontSize: 10, fill: '#888' }}
                                                stroke="#e0e0e0"
                                                tickLine={false}
                                                domain={[0, 1000]}
                                            />
                                            <YAxis
                                                yAxisId="right"
                                                orientation="right"
                                                label={{ value: 'Temperature (°C)', angle: 90, position: 'insideRight', style: { fontSize: 10, fill: '#aaa' } }}
                                                tick={{ fontSize: 10, fill: '#888' }}
                                                stroke="#e0e0e0"
                                                tickLine={false}
                                                domain={[0, 70]}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                wrapperStyle={{ paddingTop: '6px', fontSize: 11 }}
                                                iconType="circle"
                                                iconSize={8}
                                            />
                                            <Line
                                                yAxisId="left"
                                                type="monotone"
                                                dataKey="irradiance"
                                                stroke="#ffc107"
                                                strokeWidth={2.5}
                                                name="Irradiance"
                                                unit=" W/m²"
                                                dot={false}
                                                activeDot={{ r: 5, fill: '#ffc107', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="ambientTemp"
                                                stroke="#0dcaf0"
                                                strokeWidth={2}
                                                name="Ambient Temp"
                                                unit="°C"
                                                dot={false}
                                                activeDot={{ r: 4, fill: '#0dcaf0', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                            <Line
                                                yAxisId="right"
                                                type="monotone"
                                                dataKey="moduleTemp"
                                                stroke="#dc3545"
                                                strokeWidth={2}
                                                name="Module Temp"
                                                unit="°C"
                                                dot={false}
                                                activeDot={{ r: 4, fill: '#dc3545', stroke: '#fff', strokeWidth: 2 }}
                                            />
                                        </LineChart>
                                    ) : (
                                        <BarChart
                                            data={chartData}
                                            margin={{ top: 5, right: 35, left: 20, bottom: 20 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                            <XAxis
                                                dataKey="time"
                                                angle={timePeriod === '30days' ? -45 : 0}
                                                textAnchor={timePeriod === '30days' ? 'end' : 'middle'}
                                                height={timePeriod === '30days' ? 60 : 28}
                                                interval={timePeriod === 'today' ? 1 : 0}
                                                tick={{ fontSize: 10, fill: '#888' }}
                                                stroke="#e0e0e0"
                                                tickLine={false}
                                            />
                                            <YAxis
                                                label={{ value: 'Irradiance (W/m²)', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: '#aaa' } }}
                                                tick={{ fontSize: 10, fill: '#888' }}
                                                stroke="#e0e0e0"
                                                tickLine={false}
                                                domain={[0, 'auto']}
                                            />
                                            <Tooltip content={<CustomTooltip />} />
                                            <Legend
                                                wrapperStyle={{ paddingTop: '6px', fontSize: 11 }}
                                                iconType="circle"
                                                iconSize={8}
                                            />
                                            <Bar
                                                dataKey="irradiance"
                                                fill="#ffc107"
                                                name="Irradiance (W/m²)"
                                                radius={[3, 3, 0, 0]}
                                            />
                                        </BarChart>
                                    )}
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EnvironmentalMonitoring
