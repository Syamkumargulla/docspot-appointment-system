import React, { createContext, useState, useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { Container, Navbar, Nav, Button, Form, Card, Row, Col, Alert, Table, Modal } from 'react-bootstrap';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import moment from 'moment';

// ==================== CONTEXT ====================
const AuthContext = createContext();

const useAuth = () => useContext(AuthContext);

const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                axios.defaults.headers.common['x-auth-token'] = token;
                const response = await axios.get('/api/auth/verify');
                setUser(response.data.user);
            } catch (error) {
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['x-auth-token'];
            }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
            const response = await axios.post('/api/auth/login', { email, password });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            axios.defaults.headers.common['x-auth-token'] = token;
            setUser(user);
            
            toast.success('Login successful!');
            
            if (user.role === 'patient') navigate('/dashboard');
            else if (user.role === 'doctor') navigate('/doctor/dashboard');
            else if (user.role === 'admin') navigate('/admin/dashboard');
            
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
            return false;
        }
    };

    const register = async (userData) => {
        try {
            const response = await axios.post('/api/auth/register', userData);
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            axios.defaults.headers.common['x-auth-token'] = token;
            setUser(user);
            
            toast.success('Registration successful!');
            navigate('/dashboard');
            return true;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed');
            return false;
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
        toast.info('Logged out successfully');
        navigate('/');
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

// ==================== COMPONENTS ====================

// Private Route Component
const PrivateRoute = ({ children, roles = [] }) => {
    const { user, loading } = useAuth();
    
    if (loading) return <div>Loading...</div>;
    
    if (!user) return <Navigate to="/login" />;
    
    if (roles.length > 0 && !roles.includes(user.role)) {
        return <Navigate to="/" />;
    }
    
    return children;
};

// Navbar Component
const NavigationBar = () => {
    const { user, logout } = useAuth();
    
    return (
        <Navbar bg="primary" variant="dark" expand="lg">
            <Container>
                <Navbar.Brand as={Link} to="/">DocSpot</Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link as={Link} to="/">Home</Nav.Link>
                        <Nav.Link as={Link} to="/doctors">Find Doctors</Nav.Link>
                        {user && user.role === 'patient' && (
                            <>
                                <Nav.Link as={Link} to="/dashboard">Dashboard</Nav.Link>
                                <Nav.Link as={Link} to="/my-appointments">My Appointments</Nav.Link>
                            </>
                        )}
                        {user && user.role === 'doctor' && (
                            <Nav.Link as={Link} to="/doctor/dashboard">Dashboard</Nav.Link>
                        )}
                        {user && user.role === 'admin' && (
                            <Nav.Link as={Link} to="/admin/dashboard">Admin Panel</Nav.Link>
                        )}
                    </Nav>
                    <Nav>
                        {user ? (
                            <>
                                <Navbar.Text className="me-3 text-white">
                                    Welcome, {user.name}
                                </Navbar.Text>
                                <Button variant="outline-light" onClick={logout}>Logout</Button>
                            </>
                        ) : (
                            <>
                                <Nav.Link as={Link} to="/login">Login</Nav.Link>
                                <Nav.Link as={Link} to="/register">Register</Nav.Link>
                            </>
                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
};

// ==================== PAGES ====================

// Home Page
const HomePage = () => {
    const { user } = useAuth();
    
    return (
        <Container>
            <Row className="my-5 text-center">
                <Col>
                    <h1 className="display-4 mb-4">DocSpot: Seamless Appointment Booking for Health</h1>
                    <p className="lead mb-4">
                        Book your doctor's appointment from the comfort of your home. 
                        No more waiting on hold or playing phone tag with busy receptionists.
                    </p>
                    {!user && (
                        <div>
                            <Button as={Link} to="/register" variant="primary" size="lg" className="me-3">
                                Get Started
                            </Button>
                            <Button as={Link} to="/login" variant="outline-primary" size="lg">
                                Login
                            </Button>
                        </div>
                    )}
                </Col>
            </Row>

            <Row className="my-5">
                <h2 className="text-center mb-4">Why Choose DocSpot?</h2>
                <Col md={4} className="mb-4">
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>Easy Booking</Card.Title>
                            <Card.Text>
                                Browse through a wide range of doctors and healthcare providers. 
                                Find the perfect match for your needs with just a few clicks.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>Real-time Availability</Card.Title>
                            <Card.Text>
                                Choose from a range of open slots that fit your schedule. 
                                Early morning, evening, or weekend appointments available.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4} className="mb-4">
                    <Card className="h-100">
                        <Card.Body>
                            <Card.Title>Manage Appointments</Card.Title>
                            <Card.Text>
                                View and manage your upcoming appointments. Cancel or reschedule 
                                easily through your dashboard.
                            </Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// Login Page
const LoginPage = () => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(formData.email, formData.password);
    };

    return (
        <Container>
            <Row className="justify-content-center mt-5">
                <Col md={6}>
                    <Card>
                        <Card.Header>
                            <h3 className="text-center">Login to DocSpot</h3>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        placeholder="Enter email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                    />
                                </Form.Group>
                                <div className="d-grid">
                                    <Button type="submit" variant="primary">Login</Button>
                                </div>
                            </Form>
                            <div className="text-center mt-3">
                                <p>Demo Credentials:</p>
                                <p>Patient: patient@test.com / password123</p>
                                <p>Doctor: doctor@test.com / password123</p>
                                <p>Admin: admin@docspot.com / admin123</p>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// Register Page
const RegisterPage = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'patient',
        specialization: '',
        qualification: '',
        experience: '',
        consultationFee: '',
        hospitalName: '',
        hospitalAddress: ''
    });
    const { register } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await register(formData);
    };

    return (
        <Container>
            <Row className="justify-content-center mt-5">
                <Col md={8}>
                    <Card>
                        <Card.Header>
                            <h3 className="text-center">Register for DocSpot</h3>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Row>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Full Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Enter name"
                                                value={formData.name}
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Email</Form.Label>
                                            <Form.Control
                                                type="email"
                                                placeholder="Enter email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                                
                                <Form.Group className="mb-3">
                                    <Form.Label>Password</Form.Label>
                                    <Form.Control
                                        type="password"
                                        placeholder="Enter password"
                                        value={formData.password}
                                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Register as</Form.Label>
                                    <div>
                                        <Form.Check
                                            inline
                                            type="radio"
                                            label="Patient"
                                            name="role"
                                            value="patient"
                                            checked={formData.role === 'patient'}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        />
                                        <Form.Check
                                            inline
                                            type="radio"
                                            label="Doctor"
                                            name="role"
                                            value="doctor"
                                            checked={formData.role === 'doctor'}
                                            onChange={(e) => setFormData({...formData, role: e.target.value})}
                                        />
                                    </div>
                                </Form.Group>

                                {formData.role === 'doctor' && (
                                    <>
                                        <h5 className="mt-3">Doctor Details</h5>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Specialization</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="e.g., Cardiologist"
                                                        value={formData.specialization}
                                                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Qualification</Form.Label>
                                                    <Form.Control
                                                        type="text"
                                                        placeholder="e.g., MBBS, MD"
                                                        value={formData.qualification}
                                                        onChange={(e) => setFormData({...formData, qualification: e.target.value})}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Experience (years)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        placeholder="Years of experience"
                                                        value={formData.experience}
                                                        onChange={(e) => setFormData({...formData, experience: e.target.value})}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                            <Col md={6}>
                                                <Form.Group className="mb-3">
                                                    <Form.Label>Consultation Fee ($)</Form.Label>
                                                    <Form.Control
                                                        type="number"
                                                        placeholder="Fee per consultation"
                                                        value={formData.consultationFee}
                                                        onChange={(e) => setFormData({...formData, consultationFee: e.target.value})}
                                                        required
                                                    />
                                                </Form.Group>
                                            </Col>
                                        </Row>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Hospital/Clinic Name</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Hospital name"
                                                value={formData.hospitalName}
                                                onChange={(e) => setFormData({...formData, hospitalName: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                        <Form.Group className="mb-3">
                                            <Form.Label>Hospital Address</Form.Label>
                                            <Form.Control
                                                as="textarea"
                                                rows={2}
                                                placeholder="Full address"
                                                value={formData.hospitalAddress}
                                                onChange={(e) => setFormData({...formData, hospitalAddress: e.target.value})}
                                                required
                                            />
                                        </Form.Group>
                                    </>
                                )}

                                <div className="d-grid">
                                    <Button type="submit" variant="primary">Register</Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// Doctors List Page
const DoctorsListPage = () => {
    const [doctors, setDoctors] = useState([]);
    const [filteredDoctors, setFilteredDoctors] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [filters, setFilters] = useState({ specialization: '', search: '' });
    const { user } = useAuth();

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            const response = await axios.get('/api/doctors/approved');
            setDoctors(response.data);
            setFilteredDoctors(response.data);
            
            const uniqueSpecialties = [...new Set(response.data.map(d => d.specialization))];
            setSpecialties(uniqueSpecialties);
        } catch (error) {
            toast.error('Failed to load doctors');
        }
    };

    useEffect(() => {
        let filtered = [...doctors];
        if (filters.specialization) {
            filtered = filtered.filter(d => d.specialization === filters.specialization);
        }
        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            filtered = filtered.filter(d => 
                d.userId?.name?.toLowerCase().includes(searchLower) ||
                d.specialization?.toLowerCase().includes(searchLower) ||
                d.hospitalName?.toLowerCase().includes(searchLower)
            );
        }
        setFilteredDoctors(filtered);
    }, [filters, doctors]);

    return (
        <Container>
            <h2 className="mb-4">Find a Doctor</h2>

            <Row className="mb-4">
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Search</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Search by name, specialty, or hospital"
                            value={filters.search}
                            onChange={(e) => setFilters({...filters, search: e.target.value})}
                        />
                    </Form.Group>
                </Col>
                <Col md={4}>
                    <Form.Group>
                        <Form.Label>Specialization</Form.Label>
                        <Form.Select
                            value={filters.specialization}
                            onChange={(e) => setFilters({...filters, specialization: e.target.value})}
                        >
                            <option value="">All Specializations</option>
                            {specialties.map(spec => (
                                <option key={spec} value={spec}>{spec}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>

            <Row>
                {filteredDoctors.length === 0 ? (
                    <Col><p className="text-center">No doctors found</p></Col>
                ) : (
                    filteredDoctors.map(doctor => (
                        <Col md={6} lg={4} key={doctor._id} className="mb-4">
                            <Card className="h-100">
                                <Card.Body>
                                    <Card.Title>Dr. {doctor.userId?.name}</Card.Title>
                                    <Card.Subtitle className="mb-2 text-muted">
                                        {doctor.specialization}
                                    </Card.Subtitle>
                                    <Card.Text>
                                        <strong>Experience:</strong> {doctor.experience} years<br />
                                        <strong>Qualification:</strong> {doctor.qualification}<br />
                                        <strong>Fee:</strong> ${doctor.consultationFee}<br />
                                        <strong>Hospital:</strong> {doctor.hospitalName}
                                    </Card.Text>
                                    {user && user.role === 'patient' && (
                                        <Button 
                                            as={Link} 
                                            to={`/book-appointment/${doctor._id}`}
                                            variant="primary"
                                            className="w-100"
                                        >
                                            Book Appointment
                                        </Button>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    ))
                )}
            </Row>
        </Container>
    );
};

// Book Appointment Page
const BookAppointmentPage = () => {
    const { doctorId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [doctor, setDoctor] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState('');
    const [symptoms, setSymptoms] = useState('');
    const [files, setFiles] = useState([]);

    useEffect(() => {
        fetchDoctorDetails();
    }, [doctorId]);

    useEffect(() => {
        if (doctor && selectedDate) {
            fetchAvailableSlots();
        }
    }, [doctor, selectedDate]);

    const fetchDoctorDetails = async () => {
        try {
            const response = await axios.get(`/api/doctors/${doctorId}`);
            setDoctor(response.data);
        } catch (error) {
            toast.error('Failed to load doctor details');
        }
    };

    const fetchAvailableSlots = async () => {
        try {
            const dateStr = moment(selectedDate).format('YYYY-MM-DD');
            const response = await axios.get(`/api/doctors/${doctorId}/slots?date=${dateStr}`);
            setAvailableSlots(response.data.availableSlots);
        } catch (error) {
            console.error('Error fetching slots:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedSlot) {
            toast.error('Please select a time slot');
            return;
        }

        const formData = new FormData();
        formData.append('doctorId', doctor.userId._id);
        formData.append('appointmentDate', selectedDate);
        formData.append('timeSlot', selectedSlot);
        formData.append('symptoms', symptoms);
        
        for (let i = 0; i < files.length; i++) {
            formData.append('documents', files[i]);
        }

        try {
            await axios.post('/api/appointments', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Appointment booked successfully!');
            navigate('/my-appointments');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to book appointment');
        }
    };

    if (!doctor) return <Container>Loading...</Container>;

    return (
        <Container>
            <Row>
                <Col md={8} className="mx-auto">
                    <Card>
                        <Card.Header>
                            <h3>Book Appointment with Dr. {doctor.userId?.name}</h3>
                        </Card.Header>
                        <Card.Body>
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Select Date</Form.Label>
                                    <DatePicker
                                        selected={selectedDate}
                                        onChange={date => setSelectedDate(date)}
                                        minDate={new Date()}
                                        className="form-control"
                                        dateFormat="MMMM d, yyyy"
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Available Time Slots</Form.Label>
                                    <div className="d-flex flex-wrap gap-2">
                                        {availableSlots.map(slot => (
                                            <Button
                                                key={slot}
                                                variant={selectedSlot === slot ? 'primary' : 'outline-primary'}
                                                onClick={() => setSelectedSlot(slot)}
                                            >
                                                {slot}
                                            </Button>
                                        ))}
                                    </div>
                                    {availableSlots.length === 0 && (
                                        <Alert variant="info" className="mt-2">
                                            No available slots for this date
                                        </Alert>
                                    )}
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Symptoms/Reason for Visit</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={3}
                                        value={symptoms}
                                        onChange={(e) => setSymptoms(e.target.value)}
                                        required
                                    />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label>Upload Documents (Optional)</Form.Label>
                                    <Form.Control
                                        type="file"
                                        multiple
                                        onChange={(e) => setFiles([...e.target.files])}
                                    />
                                </Form.Group>

                                <div className="d-grid">
                                    <Button type="submit" variant="primary" disabled={!selectedSlot}>
                                        Book Appointment
                                    </Button>
                                </div>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// My Appointments Page
const MyAppointmentsPage = () => {
    const [appointments, setAppointments] = useState([]);
    const { user } = useAuth();

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get('/api/appointments/my');
            setAppointments(response.data);
        } catch (error) {
            toast.error('Failed to load appointments');
        }
    };

    const cancelAppointment = async (id) => {
        try {
            await axios.put(`/api/appointments/${id}/status`, { status: 'cancelled' });
            toast.success('Appointment cancelled');
            fetchAppointments();
        } catch (error) {
            toast.error('Failed to cancel appointment');
        }
    };

    return (
        <Container>
            <h2 className="mb-4">My Appointments</h2>
            
            {appointments.length === 0 ? (
                <Alert variant="info">No appointments found</Alert>
            ) : (
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Time</th>
                            <th>Doctor/Patient</th>
                            <th>Symptoms</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments.map(apt => (
                            <tr key={apt._id}>
                                <td>{moment(apt.appointmentDate).format('MMM DD, YYYY')}</td>
                                <td>{apt.timeSlot}</td>
                                <td>
                                    {user.role === 'patient' 
                                        ? `Dr. ${apt.doctorId?.name}`
                                        : apt.patientId?.name
                                    }
                                </td>
                                <td>{apt.symptoms}</td>
                                <td>
                                    <span className={`badge bg-${
                                        apt.status === 'confirmed' ? 'success' :
                                        apt.status === 'pending' ? 'warning' :
                                        apt.status === 'cancelled' ? 'danger' : 'info'
                                    }`}>
                                        {apt.status}
                                    </span>
                                </td>
                                <td>
                                    {apt.status === 'pending' && (
                                        <Button 
                                            variant="danger" 
                                            size="sm"
                                            onClick={() => cancelAppointment(apt._id)}
                                        >
                                            Cancel
                                        </Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

// Patient Dashboard
const PatientDashboard = () => {
    const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });
    const { user } = useAuth();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await axios.get('/api/appointments/my');
            const appointments = response.data;
            setStats({
                total: appointments.length,
                upcoming: appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length,
                completed: appointments.filter(a => a.status === 'completed').length
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    return (
        <Container>
            <h2 className="mb-4">Patient Dashboard</h2>
            <Row>
                <Col md={4}>
                    <Card className="text-center mb-3">
                        <Card.Body>
                            <h3>{stats.total}</h3>
                            <Card.Text>Total Appointments</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center mb-3">
                        <Card.Body>
                            <h3>{stats.upcoming}</h3>
                            <Card.Text>Upcoming Appointments</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={4}>
                    <Card className="text-center mb-3">
                        <Card.Body>
                            <h3>{stats.completed}</h3>
                            <Card.Text>Completed</Card.Text>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
            <Row>
                <Col>
                    <Card>
                        <Card.Header>Quick Actions</Card.Header>
                        <Card.Body>
                            <Button as={Link} to="/doctors" variant="primary" className="me-2">
                                Find Doctors
                            </Button>
                            <Button as={Link} to="/my-appointments" variant="info">
                                View Appointments
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
};

// Doctor Dashboard
const DoctorDashboard = () => {
    const [appointments, setAppointments] = useState([]);

    useEffect(() => {
        fetchAppointments();
    }, []);

    const fetchAppointments = async () => {
        try {
            const response = await axios.get('/api/appointments/my');
            setAppointments(response.data);
        } catch (error) {
            toast.error('Failed to load appointments');
        }
    };

    const updateStatus = async (id, status) => {
        try {
            await axios.put(`/api/appointments/${id}/status`, { status });
            toast.success(`Appointment ${status}`);
            fetchAppointments();
        } catch (error) {
            toast.error('Failed to update appointment');
        }
    };

    return (
        <Container>
            <h2 className="mb-4">Doctor Dashboard</h2>
            
            <h4>Today's Appointments</h4>
            {appointments.filter(a => moment(a.appointmentDate).isSame(new Date(), 'day')).length === 0 ? (
                <Alert variant="info">No appointments for today</Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Time</th>
                            <th>Patient</th>
                            <th>Symptoms</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {appointments
                            .filter(a => moment(a.appointmentDate).isSame(new Date(), 'day'))
                            .map(apt => (
                                <tr key={apt._id}>
                                    <td>{apt.timeSlot}</td>
                                    <td>{apt.patientId?.name}</td>
                                    <td>{apt.symptoms}</td>
                                    <td>{apt.status}</td>
                                    <td>
                                        {apt.status === 'pending' && (
                                            <>
                                                <Button 
                                                    variant="success" 
                                                    size="sm"
                                                    onClick={() => updateStatus(apt._id, 'confirmed')}
                                                    className="me-2"
                                                >
                                                    Confirm
                                                </Button>
                                                <Button 
                                                    variant="danger" 
                                                    size="sm"
                                                    onClick={() => updateStatus(apt._id, 'cancelled')}
                                                >
                                                    Cancel
                                                </Button>
                                            </>
                                        )}
                                        {apt.status === 'confirmed' && (
                                            <Button 
                                                variant="info" 
                                                size="sm"
                                                onClick={() => updateStatus(apt._id, 'completed')}
                                            >
                                                Mark Completed
                                            </Button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

// Admin Dashboard
const AdminDashboard = () => {
    const [pendingDoctors, setPendingDoctors] = useState([]);

    useEffect(() => {
        fetchPendingDoctors();
    }, []);

    const fetchPendingDoctors = async () => {
        try {
            const response = await axios.get('/api/admin/doctors/pending');
            setPendingDoctors(response.data);
        } catch (error) {
            toast.error('Failed to load pending doctors');
        }
    };

    const approveDoctor = async (id) => {
        try {
            await axios.put(`/api/admin/doctors/${id}/approve`);
            toast.success('Doctor approved successfully');
            fetchPendingDoctors();
        } catch (error) {
            toast.error('Failed to approve doctor');
        }
    };

    return (
        <Container>
            <h2 className="mb-4">Admin Dashboard</h2>
            
            <h4>Pending Doctor Approvals</h4>
            {pendingDoctors.length === 0 ? (
                <Alert variant="info">No pending doctor approvals</Alert>
            ) : (
                <Table striped bordered hover>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Specialization</th>
                            <th>Qualification</th>
                            <th>Experience</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pendingDoctors.map(doc => (
                            <tr key={doc._id}>
                                <td>{doc.userId?.name}</td>
                                <td>{doc.userId?.email}</td>
                                <td>{doc.specialization}</td>
                                <td>{doc.qualification}</td>
                                <td>{doc.experience} years</td>
                                <td>
                                    <Button 
                                        variant="success" 
                                        size="sm"
                                        onClick={() => approveDoctor(doc._id)}
                                    >
                                        Approve
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            )}
        </Container>
    );
};

// ==================== MAIN APP ====================
const App = () => {
    return (
        <Router>
            <AuthProvider>
                <NavigationBar />
                <Container className="mt-4" style={{ minHeight: '80vh' }}>
                    <Routes>
                        <Route path="/" element={<HomePage />} />
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/register" element={<RegisterPage />} />
                        <Route path="/doctors" element={<DoctorsListPage />} />
                        
                        <Route path="/dashboard" element={
                            <PrivateRoute roles={['patient']}>
                                <PatientDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/doctor/dashboard" element={
                            <PrivateRoute roles={['doctor']}>
                                <DoctorDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/admin/dashboard" element={
                            <PrivateRoute roles={['admin']}>
                                <AdminDashboard />
                            </PrivateRoute>
                        } />
                        <Route path="/book-appointment/:doctorId" element={
                            <PrivateRoute roles={['patient']}>
                                <BookAppointmentPage />
                            </PrivateRoute>
                        } />
                        <Route path="/my-appointments" element={
                            <PrivateRoute roles={['patient']}>
                                <MyAppointmentsPage />
                            </PrivateRoute>
                        } />
                    </Routes>
                </Container>
                <footer className="bg-light text-center py-3 mt-5">
                    <Container>
                        <p className="mb-0">&copy; 2024 DocSpot - Seamless Appointment Booking for Health</p>
                    </Container>
                </footer>
                <ToastContainer position="top-right" autoClose={3000} />
            </AuthProvider>
        </Router>
    );
};

export default App;