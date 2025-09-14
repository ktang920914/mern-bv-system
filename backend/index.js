import express from 'express'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import cookieParser from 'cookie-parser'
import authRoute from './routes/auth.route.js'
import purchaseRoute from './routes/purchase.route.js'
import inventoryRoute from './routes/inventory.route.js'
import transactionRoute from './routes/transaction.route.js'
import activityRoute from './routes/activity.route.js'
import orderRoute from './routes/order.route.js'
import costRoute from './routes/cost.route.js'
import jobRoute from './routes/job.route.js'
import productivityRoute from './routes/productivity.route.js'
import planningRoute from './routes/planning.route.js'

dotenv.config()
const app = express()
const port = process.env.port

app.use(express.json())
app.use(cookieParser())

mongoose.connect(process.env.mongodb)
.then(() => console.log('Mongodb is connected'))
.catch((err) => console.log(err))

app.use('/api/auth', authRoute)
app.use('/api/purchase', purchaseRoute)
app.use('/api/inventory', inventoryRoute)
app.use('/api/transaction', transactionRoute)
app.use('/api/activity', activityRoute)
app.use('/api/request', orderRoute)
app.use('/api/cost', costRoute)
app.use('/api/analysis', jobRoute)
app.use('/api/output', productivityRoute)
app.use('/api/view', planningRoute)

app.get('/', (req,res) => {
    res.send('<h1>Welcome to Bold Vision</h1>')
})

app.listen(port, () => {
    console.log(`http://localhost:${port}`)
})

app.use((err,req,res,next) => {
    const statusCode = err.statusCode || 500
    const message = err.message || 'Internal Server Error'
    res.status(statusCode).json({
        success:false,
        statusCode,
        message
    })
})