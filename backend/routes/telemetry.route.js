import express from 'express'
import Telemetry from '../models/telemetry.model.js'

const router = express.Router()

// Node-RED 写入数据
router.post('/ingest', async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key']

    if (apiKey !== process.env.NODE_RED_API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }

    const { machine, zone, tag, value, unit, timestamp } = req.body

    if (!machine || !zone || !tag || value === undefined || value === null) {
      return res.status(400).json({
        success: false,
        message: 'machine, zone, tag, value are required',
      })
    }

    const newTelemetry = new Telemetry({
      machine,
      zone,
      tag,
      value: Number(value),
      unit: unit || '°C',
      timestamp: timestamp ? new Date(timestamp) : new Date(),
      source: 'node-red',
    })

    const saved = await newTelemetry.save()

    res.status(201).json({
      success: true,
      message: 'Telemetry saved successfully',
      data: saved,
    })
  } catch (err) {
    next(err)
  }
})

// React 拿最新值
router.get('/latest', async (req, res, next) => {
  try {
    const { machine, zone, tag } = req.query

    const filter = {}

    if (machine) filter.machine = machine
    if (zone) filter.zone = zone
    if (tag) filter.tag = tag

    const latest = await Telemetry.findOne(filter).sort({ timestamp: -1 })

    res.status(200).json({
      success: true,
      data: latest,
    })
  } catch (err) {
    next(err)
  }
})

// React 拿历史数据
router.get('/history', async (req, res, next) => {
  try {
    const { machine, zone, tag, limit = 100 } = req.query

    const filter = {}

    if (machine) filter.machine = machine
    if (zone) filter.zone = zone
    if (tag) filter.tag = tag

    const history = await Telemetry.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit))

    res.status(200).json({
      success: true,
      data: history.reverse(),
    })
  } catch (err) {
    next(err)
  }
})

export default router