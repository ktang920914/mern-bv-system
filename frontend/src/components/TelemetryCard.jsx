import React, { useEffect, useState } from 'react'

const TelemetryCard = () => {
  const [pv, setPv] = useState(null)

  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await fetch('/api/telemetry/latest?machine=L10&zone=ZONE%201&tag=PV')
        const data = await res.json()

        if (data.success && data.data) {
          setPv(data.data.value)
        }
      } catch (err) {
        console.log(err)
      }
    }

    fetchLatest()

    const interval = setInterval(fetchLatest, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div>
      <h2>L10 ZONE 1 PV</h2>
      <p>{pv !== null ? `${pv} °C` : 'Loading...'}</p>
    </div>
  )
}

export default TelemetryCard