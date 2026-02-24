const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const moment = require('moment');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'your-super-secret-jwt-key-2024-docspot';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
app.use('/uploads', express.static(uploadDir));

// ==================== DATABASE CONNECTION ====================
mongoose.connect('mongodb://127.0.0.1:27017/docspot', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('✅ MongoDB Connected successfully'))
.catch(err => {
    console.error('❌ MongoDB Connection Error:', err);
    process.exit(1);
});

// ==================== SCHEMAS ====================

// User Schema
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['patient', 'doctor', 'admin'], default: 'patient' },
    profile: {
        phone: String,
        address: String,
        gender: String,
        dateOfBirth: Date
    },
    createdAt: { type: Date, default: Date.now }
});

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

const User = mongoose.model('User', userSchema);

// Doctor Schema
const doctorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    specialization: { type: String, required: true },
    qualification: { type: String, required: true },
    experience: { type: Number, required: true },
    consultationFee: { type: Number, required: true },
    availableSlots: [{
        day: { type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] },
        startTime: String,
        endTime: String,
        isAvailable: { type: Boolean, default: true }
    }],
    isApproved: { type: Boolean, default: false },
    hospitalName: String,
    hospitalAddress: String,
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
});

const Doctor = mongoose.model('Doctor', doctorSchema);

// Appointment Schema
const appointmentSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true },
    status: { type: String, enum: ['pending', 'confirmed', 'cancelled', 'completed'], default: 'pending' },
    symptoms: String,
    documents: [String],
    notes: String,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

appointmentSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Appointment = mongoose.model('Appointment', appointmentSchema);

// ==================== MIDDLEWARE ====================
const authMiddleware = async (req, res, next) => {
    const token = req.header('x-auth-token');
    if (!token) {
        return res.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};

const roleMiddleware = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

// Multer configuration for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images, PDFs, and documents are allowed'));
        }
    }
});

// ==================== ROUTES ====================

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ message: 'User already exists' });
        }

        user = new User({
            name,
            email,
            password,
            role: role || 'patient'
        });

        await user.save();

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // If registering as doctor, create doctor profile
        if (role === 'doctor') {
            const doctorProfile = new Doctor({
                userId: user._id,
                specialization: req.body.specialization || 'General Medicine',
                qualification: req.body.qualification || 'MBBS',
                experience: req.body.experience || 0,
                consultationFee: req.body.consultationFee || 500,
                hospitalName: req.body.hospitalName || '',
                hospitalAddress: req.body.hospitalAddress || ''
            });
            await doctorProfile.save();
        }

        res.status(201).json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.json({
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/auth/verify', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        res.json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Doctor Routes
app.get('/api/doctors/approved', async (req, res) => {
    try {
        const doctors = await Doctor.find({ isApproved: true })
            .populate('userId', 'name email profile');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/doctors/:id', async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id)
            .populate('userId', 'name email profile');
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctor);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/doctors/:id/slots', async (req, res) => {
    try {
        const { date } = req.query;
        const doctor = await Doctor.findById(req.params.id);
        
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        const dayOfWeek = moment(date).format('dddd');
        const daySlots = doctor.availableSlots.find(slot => slot.day === dayOfWeek);

        if (!daySlots || !daySlots.isAvailable) {
            return res.json({ availableSlots: [] });
        }

        // Get booked appointments for this date
        const bookedAppointments = await Appointment.find({
            doctorId: doctor.userId,
            appointmentDate: new Date(date),
            status: { $in: ['pending', 'confirmed'] }
        });

        const bookedSlots = bookedAppointments.map(apt => apt.timeSlot);

        // Generate time slots
        const slots = [];
        const start = moment(daySlots.startTime, 'HH:mm');
        const end = moment(daySlots.endTime, 'HH:mm');
        
        while (start < end) {
            const timeSlot = start.format('HH:mm');
            if (!bookedSlots.includes(timeSlot)) {
                slots.push(timeSlot);
            }
            start.add(30, 'minutes');
        }

        res.json({ availableSlots: slots });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Appointment Routes
app.post('/api/appointments', authMiddleware, roleMiddleware('patient'), upload.array('documents', 5), async (req, res) => {
    try {
        const { doctorId, appointmentDate, timeSlot, symptoms } = req.body;
        
        const files = req.files ? req.files.map(file => file.path) : [];

        const appointment = new Appointment({
            patientId: req.user.userId,
            doctorId,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            symptoms,
            documents: files,
            status: 'pending'
        });

        await appointment.save();

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
});

app.get('/api/appointments/my', authMiddleware, async (req, res) => {
    try {
        let appointments;
        if (req.user.role === 'patient') {
            appointments = await Appointment.find({ patientId: req.user.userId })
                .populate('doctorId', 'name email')
                .sort({ appointmentDate: -1 });
        } else if (req.user.role === 'doctor') {
            appointments = await Appointment.find({ doctorId: req.user.userId })
                .populate('patientId', 'name email profile')
                .sort({ appointmentDate: -1 });
        } else {
            appointments = await Appointment.find()
                .populate('patientId', 'name email')
                .populate('doctorId', 'name email')
                .sort({ appointmentDate: -1 });
        }
        
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/appointments/:id/status', authMiddleware, async (req, res) => {
    try {
        const { status } = req.body;
        const appointment = await Appointment.findById(req.params.id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Check authorization
        if (req.user.role === 'doctor' && appointment.doctorId.toString() !== req.user.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        appointment.status = status;
        await appointment.save();

        res.json({ message: 'Appointment status updated', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Admin Routes
app.get('/api/admin/doctors/pending', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const doctors = await Doctor.find({ isApproved: false })
            .populate('userId', 'name email createdAt');
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.put('/api/admin/doctors/:id/approve', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const doctor = await Doctor.findById(req.params.id);
        if (!doctor) {
            return res.status(404).json({ message: 'Doctor not found' });
        }

        doctor.isApproved = true;
        await doctor.save();

        res.json({ message: 'Doctor approved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create default admin if not exists
const createDefaultAdmin = async () => {
    try {
        const adminExists = await User.findOne({ role: 'admin' });
        if (!adminExists) {
            const admin = new User({
                name: 'Admin',
                email: 'admin@docspot.com',
                password: 'admin123',
                role: 'admin'
            });
            await admin.save();
            console.log('✅ Default admin created: admin@docspot.com / admin123');
        }
    } catch (error) {
        console.error('Error creating admin:', error);
    }
};

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    await createDefaultAdmin();
});