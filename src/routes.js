const express = require('express');
const companyRoutes = require('./api/services/company/company.route');
const docRoutes = require('./api/services/docs/document.route');
const shareholderRoutes = require('./api/services/shareholder/shareholder.route');
const userRoutes = require('./api/services/broker/broker.route');
const brokerRoutes = require('./api/services/broker/broker.route');
const authRoutes = require('./api/auth/auth.route');
const router = express.Router(); // eslint-disable-line new-cap

/** GET /health-check - Check service health */
router.get('/health-check', (req, res) => res.send('OK'));

// mount user routes at /users
router.use('/company', companyRoutes);
router.use('/doc', docRoutes);
router.use('/shareholder', shareholderRoutes);
router.use('/user', userRoutes);
router.use('/broker', brokerRoutes);
// router.use("/order", orderRoutes);
// router.use("/event", eventRoutes);
// router.use("/admin", adminRoutes);
// router.use("/student", studentRoutes);
// router.use("/course", CourseRoutes);
// router.use("/chat", GroupChat);
// mount auth routes at /auth
router.use('/auth', authRoutes);

module.exports = router;
