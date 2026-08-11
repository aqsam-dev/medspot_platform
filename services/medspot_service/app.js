const express = require('express');
const cors = require('cors');
const http = require("http");
const socketService = require("./utils/socketservice");
const whatsappClient = require("./utils/whatsappClient");
const swaggerUi = require('swagger-ui-express');
const YAML = require('yaml');
const fs = require('fs');
const swaggerDocument = YAML.parse(fs.readFileSync('./openapi.yaml', 'utf8'));
require('dotenv').config();
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);
require("./utils/reservationexpiryjob");

// Test database connection
const pool = require('./config/database');
require("./config/firebase");

app.get('/test-db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ 
      success: true, 
      message: 'Database connected!',
      time: result.rows[0].now 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Database connection failed',
      error: error.message 
    });
  }
});

// Import routes
// const pharmacyRoutes = require('./routes/pharmacyRoutes');
const adminRoutes = require('./routes/adminRoutes');
const pharmacyauthRoutes = require('./routes/pharmacyauthRoutes');
const patientRoutes = require("./routes/patientRoutes");
const patientprescriptionRoutes = require('./routes/patientprescriptionRoutes');
const pharmacyprescriptionRoute = require('./routes/pharmacyPrescriptionRoutes');
const integrationRoutes=require('./routes/integrationRoutes');
const pharmacyProfileRoutes =require("./routes/pharmacyProfileRoutes");
const patientSearchRoutes=require("./routes/patientSearchRoutes");
const posDashboardRoutes=require("./routes/posDashboardRoutes");
const adminuserroute =require("./routes/adminuserroute");
const adminpharmacyroute =require("./routes/adminpharmcyroutes");
const adminprescriptionroutes = require("./routes/adminprescriptionroute");
const medicineRoutes = require("./routes/adminmedicineRoutes");
const admindashboardRoutes = require("./routes/admindashboardRoutes");
const adminreservationRoutes = require("./routes/adminreservationroutes")
const pharmacyVerificationRoutes = require("./routes/adminpharmacyVerificationRoutes");
const reservationRoutes = require("./routes/reservationRoutes");
const pharmacyStaffRoutes = require("./routes/pharmacyStaffRoutes");
const pharmacyReservationRoutes = require("./routes/pharmacyReservationRoutes");
const pharmacydashboardRoutes = require("./routes/pharmacyDashboardRoutes");
const reviewRoutes =require("./routes/reviewRoutes");
const pharmacyReviewRoutes =require("./routes/pharmacyreviewRoutes");
const auditRoutes = require("./routes/auditRoutes");
const favoritePharmacyRoutes = require("./routes/favoritepharmacyRoutes");

//adminroutes
app.use("/api/admin/dashboard",admindashboardRoutes);
app.use("/api/admin/pharmacy-verification",pharmacyVerificationRoutes);
app.use("/api/admin/pharmacies", adminpharmacyroute);
app.use("/api/admin/users",adminuserroute);
app.use("/api/admin/reservations", adminreservationRoutes);
app.use("/api/admin/prescriptions", adminprescriptionroutes);
app.use("/api/admin/medicines", medicineRoutes);
app.use("/api/admin/audit-logs", auditRoutes);
//patientroutes
app.use("/api/patient", patientRoutes);
app.use("/api/patient", patientSearchRoutes);
app.use("/api/patient/reservations", reservationRoutes);
app.use("/api/patient/prescriptions", patientprescriptionRoutes);
app.use("/api/patient/reviews",reviewRoutes);
app.use("/api/patient/favorite-pharmacies",favoritePharmacyRoutes);
//routes
app.use("/api/pharmacy", pharmacyauthRoutes);
app.use('/api/pos' ,integrationRoutes);
app.use("/api/pharmacy-profile",pharmacyProfileRoutes);
app.use("/api/pos",posDashboardRoutes);
app.use("/api/pharmacy-staff", pharmacyStaffRoutes);
app.use( "/api/pharmacy/reservations",pharmacyReservationRoutes);
app.use("/api/pharmacy-dashboard",pharmacydashboardRoutes);
app.use( "/api/notifications", require("./routes/notificationRoutes" ));
app.use("/api/pharmacy/reviews",pharmacyReviewRoutes);
app.use("/api/pharmacy/prescriptions",pharmacyprescriptionRoute);
//swaggerUIRoutesDocumentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Test route
app.get('/', (req, res) => {
  res.json({ message: 'MedSpot Backend Running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
socketService.initialize(server);
server.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on port ${PORT}`);
});