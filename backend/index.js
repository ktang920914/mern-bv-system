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
import outputRoute from './routes/output.route.js'
import maintenanceRoute from './routes/maintenance.route.js'
import caseRoute from './routes/case.route.js'
import productRoute from './routes/product.route.js'
import materialRoute from './routes/material.route.js'
import movementRoute from './routes/movement.route.js'
import extruderRoute from './routes/extruder.route.js'
import preventiveRoute from './routes/todo.route.js'
import https from 'https'
import fs from 'fs'

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
app.use('/api/machine', extruderRoute)
app.use('/api/inventory', inventoryRoute)
app.use('/api/transaction', transactionRoute)
app.use('/api/activity', activityRoute)
app.use('/api/request', orderRoute)
app.use('/api/cost', costRoute)
app.use('/api/analysis', jobRoute)
app.use('/api/output', productivityRoute)
app.use('/api/view', planningRoute)
app.use('/api/output', outputRoute)
app.use('/api/maintenance', maintenanceRoute)
app.use('/api/case', caseRoute)
app.use('/api/new', productRoute)
app.use('/api/raw', materialRoute)
app.use('/api/stock', movementRoute)
app.use('/api/preventive', preventiveRoute)

app.get('/', (req,res) => {
    res.send('<h1>Welcome to Bold Vision</h1>')
})

/*const httpsOptions = {
  key: fs.readFileSync('./server.key'),   // mkcert 私钥
  cert: fs.readFileSync('./server.crt')   // mkcert 证书
}

https.createServer(httpsOptions, app).listen(port, () => {
  console.log(`HTTPS Server running at https://localhost:${port}`)
})*/

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