import validator from 'validator'
import bcrypt from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'
import Notification from '../models/notificationModel.js';
import dotenv from 'dotenv'

dotenv.config()


const registerUser = async (req, res) => {
    try {
        const { name, email, password, phone, gender, dob, address } = req.body

        if (!name || !password || !email || !phone) {
            return res.json({ success: false, message: "Missing Details" })
        }
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "enter a valid email" })
        }
        if (password.length < 8) {
            return res.json({ success: false, message: "enter a strong password" })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        let parsedAddress = { line1: '', line2: '' }
        if (address) {
          try {
            parsedAddress = typeof address === 'string' ? JSON.parse(address) : address
          } catch {
            parsedAddress = { line1: address, line2: '' }
          }
        }

        const userData = {
            name,
            email,
            password: hashedPassword,
            phone: phone || '0000000000',
            gender: gender || 'Not Selected',
            dob: dob || 'Not Selected',
            address: parsedAddress,
        }
        const newUser = new userModel(userData)
        const user = await newUser.save()

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET)

        res.json({ success: true, token })


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const loginStaff = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email, role: 'staff' });
    if (!user) {
      return res.json({ success: false, message: 'Staff does not exist' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};

// Update loginUser to only allow patients
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userModel.findOne({ email, $or: [{ role: 'patient' }, { role: { $exists: false } }] });
    if (!user) {
      return res.json({ success: false, message: 'User does not exist' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ success: true, token });
    } else {
      res.json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body
        const userData = await userModel.findById(userId).select('-password')
        res.json({ success: true, userData })

    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
const updateProfile = async (req,res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body
        const imageFile = req.file

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Data Missing" })

        }

        await userModel.findByIdAndUpdate(userId, {
            name,
            phone,
            address: JSON.parse(address),
            dob,
            gender
          });
          
          
if (imageFile) {

    const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'})
    const imageURL = imageUpload.secure_url

    await userModel.findByIdAndUpdate(userId,{image:imageURL})
}
res.json({success:true, message:"Profile Updated"})


    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}
const bookAppointment = async (req,res) =>{
    try {
        const { userId, docId, slotDate, slotTime, departmentId } = req.body;
        const docData = await doctorModel.findById(docId).select('-password');
        if (!docData.available) {
            return res.json({success:false,message:'Doctor not available'});
        }
        // Validate doctor belongs to department
        if (!docData.departments || !docData.departments.map(String).includes(String(departmentId))) {
            return res.json({success:false,message:'Doctor does not belong to selected department'});
        }
        let slots_booked = docData.slots_booked;
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({success:false,message:'Slot not available'});
            } else {
                slots_booked[slotDate].push(slotTime);
            }
        } else {
            slots_booked[slotDate] = [];
            slots_booked[slotDate].push(slotTime);
        }
        const userData = await userModel.findById(userId).select('-password');
        delete docData.slots_booked;
        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date: Date.now(),
            departmentId
        };
        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();
        await doctorModel.findByIdAndUpdate(docId, {slots_booked});
        res.json({success:true,message: 'Appointment Booked'});
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const listAppointment = async (req,res) =>{
    try {
        
        const {userId} = req.body
        const appointments =  await appointmentModel.find({userId})

        res.json({success:true, appointments})
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

const cancelAppointment = async (req,res) =>{

    try {
        const {userId, appointmentId} = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData.userId !== userId) {
            return res.json({success:false,message:'Unauthorized action'})
            
        }
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true})

        const {docId, slotDate, slotTime} = appointmentData

        const doctorData = await doctorModel.findById(docId)
        let slots_booked =doctorData.slots_booked
        
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, {slots_booked})

        res.json({success:true, message:'Appointment Cancelled'})

    } catch (error) {
         console.log(error)
        res.json({ success: false, message: error.message })
    }
}
const razorpayInstance = new razorpay({

    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})

const paymentRazorpay = async (req,res) => {
    try {
        const {appointmentId} =  req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
    
        if (!appointmentData || appointmentData.cancelled) {
            return res.json({success:false,message:"Appointment Cancelled or not found"})
            
        }
    
    
        
     const options = {
        amount: appointmentData.amount * 100,
        currency: process.env.CURRENCY,
        receipt: appointmentId,
    
    }
    
    const order = razorpayInstance.orders.create(options)
    
    res.json({success:true,order})
    
        
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
   
}

// Get notifications for a user
const getNotifications = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId required' });
    const notifications = await Notification.find({ user: userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Mark a notification as read
const markNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findByIdAndUpdate(id, { read: true }, { new: true });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all patients (users) for admin
const getAllPatients = async (req, res) => {
    try {
        const patients = await userModel.find({ role: 'patient' }).select('-password');
        res.json({ success: true, patients });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

const getStaffNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ user: req.staffId }).sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Staff can add patients
const addPatientByStaff = async (req, res) => {
  try {
    const { name, email, password, phone, gender, dob, address } = req.body;
    const staffId = req.staffId; // From auth middleware

    if (!name || !email || !password || !phone) {
      return res.json({ success: false, message: "Missing required details" });
    }

    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Enter a valid email" });
    }

    if (password.length < 8) {
      return res.json({ success: false, message: "Password must be at least 8 characters" });
    }

    // Check if email already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.json({ success: false, message: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email,
      password: hashedPassword,
      phone: phone || '0000000000',
      gender: gender || 'Not Selected',
      dob: dob || 'Not Selected',
      address: address ? JSON.parse(address) : { line1: '', line2: '' },
      role: 'patient'
    };

    const newUser = new userModel(userData);
    await newUser.save();

    res.json({ success: true, message: "Patient added successfully" });

  } catch (error) {
    console.log(error);
    res.json({ success: false, message: error.message });
  }
};


export { registerUser, loginUser, loginStaff, getProfile, updateProfile,bookAppointment, listAppointment, cancelAppointment, paymentRazorpay, getNotifications, markNotificationRead, getAllPatients, getStaffNotifications, addPatientByStaff }
