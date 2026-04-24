import React, { useEffect, useMemo, useState } from 'react'

const MAX_TEMP = 300

const normalizeTemperature = (value) => {
  const num = Number(value)
  if (Number.isNaN(num)) return null

  // 兼容旧数据：290 -> 29.0
  if (num > 100) return num / 10

  return num
}

const getStatus = (temp) => {
  if (temp === null) {
    return {
      label: 'No Data',
      color: '#64748b',
      bg: '#f1f5f9',
    }
  }

  if (temp < 100) {
    return {
      label: 'Normal',
      color: '#16a34a',
      bg: '#dcfce7',
    }
  }

  if (temp < 200) {
    return {
      label: 'Warning',
      color: '#ca8a04',
      bg: '#fef9c3',
    }
  }

  return {
    label: 'High',
    color: '#dc2626',
    bg: '#fee2e2',
  }
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'

  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return '-'

  return date.toLocaleString()
}

const CircleGauge = ({ pv, percent, status }) => {
  const degree = percent * 3.6

  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '14px',
        }}
      >
        Circle Gauge
      </div>

      <div
        style={{
          width: '180px',
          height: '180px',
          borderRadius: '50%',
          background: `conic-gradient(${status.color} 0deg ${degree}deg, #e5e7eb ${degree}deg 360deg)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto',
          boxShadow: 'inset 0 2px 8px rgba(15, 23, 42, 0.12)',
        }}
      >
        <div
          style={{
            width: '128px',
            height: '128px',
            borderRadius: '50%',
            background: '#ffffff',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(15, 23, 42, 0.08)',
          }}
        >
          <div
            style={{
              fontSize: '34px',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1,
            }}
          >
            {pv !== null ? pv.toFixed(1) : '--'}
          </div>

          <div
            style={{
              fontSize: '15px',
              fontWeight: 700,
              color: '#64748b',
              marginTop: '6px',
            }}
          >
            °C
          </div>
        </div>
      </div>

      <div
        style={{
          textAlign: 'center',
          fontSize: '13px',
          color: '#64748b',
          marginTop: '12px',
        }}
      >
        0°C - {MAX_TEMP}°C
      </div>
    </div>
  )
}

const ThermometerChart = ({ pv, percent, status }) => {
  return (
    <div
      style={{
        padding: '16px',
        borderRadius: '16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          fontSize: '16px',
          fontWeight: 700,
          color: '#0f172a',
          marginBottom: '14px',
        }}
      >
        Thermometer
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '22px',
          minHeight: '205px',
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '54px',
            height: '180px',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '34px',
              height: '145px',
              borderRadius: '999px',
              border: '4px solid #cbd5e1',
              background: '#ffffff',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: `${percent}%`,
                background: status.color,
                transition: 'height 0.4s ease',
              }}
            />
          </div>

          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              border: '4px solid #cbd5e1',
              background: status.color,
              boxShadow: '0 4px 12px rgba(15, 23, 42, 0.12)',
            }}
          />
        </div>

        <div>
          <div
            style={{
              fontSize: '36px',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1,
            }}
          >
            {pv !== null ? pv.toFixed(1) : '--'}
            <span
              style={{
                fontSize: '18px',
                color: '#64748b',
                marginLeft: '4px',
              }}
            >
              °C
            </span>
          </div>

          <div
            style={{
              marginTop: '10px',
              fontSize: '14px',
              fontWeight: 700,
              color: status.color,
            }}
          >
            {status.label}
          </div>

          <div
            style={{
              marginTop: '6px',
              fontSize: '13px',
              color: '#64748b',
            }}
          >
            Temperature visual level
          </div>
        </div>
      </div>
    </div>
  )
}

const LiveTrendChart = ({ history, status }) => {
  const chartData = useMemo(() => {
    if (history.length < 2) {
      return {
        points: '',
        min: null,
        max: null,
        yMin: null,
        yMax: null,
        mid: null,
      }
    }

    const values = history.map((item) => item.value)
    const min = Math.min(...values)
    const max = Math.max(...values)

    // Auto scale:
    // 不再固定 0°C - 300°C
    // 如果温度变化太小，就最少显示 5°C 范围
    const minDisplayRange = 5
    const actualRange = max - min
    const displayRange = Math.max(actualRange, minDisplayRange)

    const center = (min + max) / 2
    const yMin = center - displayRange / 2
    const yMax = center + displayRange / 2
    const mid = (yMin + yMax) / 2

    const points = history
      .map((item, index) => {
        const x = (index / (history.length - 1)) * 300
        const valuePercent = (item.value - yMin) / (yMax - yMin)
        const safePercent = Math.max(0, Math.min(valuePercent, 1))
        const y = 120 - safePercent * 120

        return `${x},${y}`
      })
      .join(' ')

    return {
      points,
      min,
      max,
      yMin,
      yMax,
      mid,
    }
  }, [history])

  return (
    <div
      style={{
        marginTop: '16px',
        padding: '16px',
        borderRadius: '16px',
        background: '#f8fafc',
        border: '1px solid #e2e8f0',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: '12px',
          marginBottom: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div
            style={{
              fontSize: '16px',
              fontWeight: 700,
              color: '#0f172a',
            }}
          >
            Live Trend Chart
          </div>

          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              marginTop: '4px',
            }}
          >
            Last {history.length} readings
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '999px',
              padding: '6px 10px',
              fontWeight: 700,
            }}
          >
            Min: {chartData.min !== null ? chartData.min.toFixed(1) : '--'}°C
          </div>

          <div
            style={{
              fontSize: '13px',
              color: '#64748b',
              background: '#ffffff',
              border: '1px solid #e5e7eb',
              borderRadius: '999px',
              padding: '6px 10px',
              fontWeight: 700,
            }}
          >
            Max: {chartData.max !== null ? chartData.max.toFixed(1) : '--'}°C
          </div>
        </div>
      </div>

      <div
        style={{
          background: '#ffffff',
          borderRadius: '14px',
          border: '1px solid #e5e7eb',
          overflow: 'hidden',
          padding: '12px',
        }}
      >
        {history.length < 2 ? (
          <div
            style={{
              height: '160px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              fontWeight: 700,
            }}
          >
            Waiting for trend data...
          </div>
        ) : (
          <svg
            viewBox="0 0 300 120"
            style={{
              width: '100%',
              height: '160px',
              display: 'block',
            }}
          >
            <line x1="0" y1="0" x2="300" y2="0" stroke="#f1f5f9" />
            <line x1="0" y1="40" x2="300" y2="40" stroke="#e5e7eb" />
            <line x1="0" y1="80" x2="300" y2="80" stroke="#e5e7eb" />
            <line x1="0" y1="120" x2="300" y2="120" stroke="#f1f5f9" />

            <text x="4" y="12" fontSize="9" fill="#94a3b8">
              {chartData.yMax !== null ? chartData.yMax.toFixed(1) : '--'}°C
            </text>

            <text x="4" y="44" fontSize="9" fill="#94a3b8">
              {chartData.mid !== null ? chartData.mid.toFixed(1) : '--'}°C
            </text>

            <text x="4" y="116" fontSize="9" fill="#94a3b8">
              {chartData.yMin !== null ? chartData.yMin.toFixed(1) : '--'}°C
            </text>

            <polyline
              points={chartData.points}
              fill="none"
              stroke={status.color}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {history.map((item, index) => {
              const x = (index / (history.length - 1)) * 300
              const valuePercent =
                (item.value - chartData.yMin) / (chartData.yMax - chartData.yMin)
              const safePercent = Math.max(0, Math.min(valuePercent, 1))
              const y = 120 - safePercent * 120

              return (
                <circle
                  key={`${item.time}-${index}`}
                  cx={x}
                  cy={y}
                  r="3.5"
                  fill={status.color}
                  stroke="#ffffff"
                  strokeWidth="1.5"
                />
              )
            })}
          </svg>
        )}
      </div>
    </div>
  )
}

const TelemetryCard = () => {
  const [telemetry, setTelemetry] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let intervalId

    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/telemetry/latest?machine=L10&zone=ZONE%201&tag=PV')
        const data = await res.json()

        if (data.success && data.data) {
          setTelemetry(data.data)

          const tempValue = normalizeTemperature(data.data.value)

          if (tempValue !== null) {
            setHistory((prev) => {
              const next = [
                ...prev,
                {
                  value: tempValue,
                  time: data.data.timestamp || new Date().toISOString(),
                },
              ]

              // 只保留最后 20 次 reading，避免画面太乱
              return next.slice(-20)
            })
          }

          setError('')
        } else {
          setError('No telemetry data found')
        }
      } catch (err) {
        console.log(err)
        setError('Failed to load telemetry data')
      } finally {
        setLoading(false)
      }
    }

    fetchLatest()
    intervalId = setInterval(fetchLatest, 2000)

    return () => clearInterval(intervalId)
  }, [])

  const pv = useMemo(() => {
    if (!telemetry) return null
    return normalizeTemperature(telemetry.value)
  }, [telemetry])

  const safePv = pv !== null ? Math.max(0, Math.min(pv, MAX_TEMP)) : 0
  const percent = (safePv / MAX_TEMP) * 100
  const status = getStatus(pv)

  return (
    <div
      style={{
        padding: '20px',
      }}
    >
      <div
        style={{
          background: '#ffffff',
          border: '1px solid #e5e7eb',
          borderRadius: '18px',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
          padding: '24px',
          maxWidth: '950px',
          width: '100%',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '16px',
            marginBottom: '22px',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '6px',
                letterSpacing: '0.5px',
              }}
            >
              LIVE TELEMETRY
            </div>

            <h2
              style={{
                margin: 0,
                fontSize: '32px',
                fontWeight: 700,
                color: '#0f172a',
              }}
            >
              L10 ZONE 1 PV
            </h2>
          </div>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '999px',
              background: status.bg,
              color: status.color,
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            <span
              style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: status.color,
                display: 'inline-block',
              }}
            />
            {status.label}
          </div>
        </div>

        {loading ? (
          <div
            style={{
              fontSize: '18px',
              color: '#64748b',
            }}
          >
            Loading...
          </div>
        ) : error ? (
          <div
            style={{
              padding: '14px 16px',
              borderRadius: '12px',
              background: '#fef2f2',
              color: '#dc2626',
              fontWeight: 600,
            }}
          >
            {error}
          </div>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '10px',
                marginBottom: '26px',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  fontSize: '72px',
                  lineHeight: 1,
                  fontWeight: 800,
                  color: '#111827',
                }}
              >
                {pv !== null ? pv.toFixed(1) : '--'}
              </div>

              <div
                style={{
                  fontSize: '28px',
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: '8px',
                }}
              >
                °C
              </div>
            </div>

            <div style={{ marginBottom: '10px' }}>
              <div
                style={{
                  position: 'relative',
                  height: '22px',
                  borderRadius: '999px',
                  background:
                    'linear-gradient(90deg, #22c55e 0%, #22c55e 33%, #eab308 66%, #ef4444 100%)',
                  boxShadow: 'inset 0 1px 4px rgba(0,0,0,0.12)',
                  overflow: 'visible',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(${percent}% - 9px)`,
                    top: '-8px',
                    width: '18px',
                    height: '38px',
                    borderRadius: '10px',
                    background: '#0f172a',
                    border: '3px solid #ffffff',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.18)',
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '14px',
                color: '#64748b',
                marginBottom: '18px',
              }}
            >
              <span>0°C</span>
              <span>100°C</span>
              <span>200°C</span>
              <span>300°C</span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                >
                  Machine
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {telemetry?.machine || 'L10'}
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                >
                  Zone
                </div>
                <div
                  style={{
                    fontSize: '18px',
                    fontWeight: 700,
                    color: '#0f172a',
                  }}
                >
                  {telemetry?.zone || 'ZONE 1'}
                </div>
              </div>

              <div
                style={{
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    color: '#64748b',
                    marginBottom: '4px',
                  }}
                >
                  Last Update
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#0f172a',
                    wordBreak: 'break-word',
                  }}
                >
                  {formatTime(telemetry?.timestamp)}
                </div>
              </div>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '16px',
              }}
            >
              <CircleGauge pv={pv} percent={percent} status={status} />
              <ThermometerChart pv={pv} percent={percent} status={status} />
            </div>

            <LiveTrendChart history={history} status={status} />
          </>
        )}
      </div>
    </div>
  )
}

export default TelemetryCard