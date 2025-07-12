import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/mongodb.js'
import connectCloudinary from './config/cloudinary.js'
import adminRouter from './routes/adminRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import userRouter from './routes/userRoute.js'
import departmentRouter from './routes/departmentRoute.js'
import bedRouter from './routes/bedRoute.js'
import admissionRouter from './routes/admissionRoute.js'







const app = express()
const port = process.env.PORT || 4000;
connectDB()
connectCloudinary()





app.use(express.json())
app.use(cors())


app.use('/api/admin',adminRouter)
app.use('/api/doctor',doctorRouter)
app.use('/api/user',userRouter)
app.use('/api/departments', departmentRouter)
app.use('/api/beds', bedRouter)
app.use('/api/admissions', admissionRouter)




app.get('/',(req,res)=>{
    res.send('API WORKING')
})

app.listen(port,()=> console.log("Server Started",port))