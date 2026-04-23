import mongoose from 'mongoose'

const telemetrySchema = new mongoose.Schema(
  {
    machine: {
      type: String,
      required: true,
      trim: true,
    },
    zone: {
      type: String,
      required: true,
      trim: true,
    },
    tag: {
      type: String,
      required: true,
      trim: true, // PV / SV / MV etc
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String,
      default: '°C',
    },
    source: {
      type: String,
      default: 'node-red',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

telemetrySchema.index({ machine: 1, zone: 1, tag: 1, timestamp: -1 })

const Telemetry = mongoose.model('Telemetry', telemetrySchema)

export default Telemetry