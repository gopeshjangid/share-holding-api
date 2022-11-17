const express = require('express');
const { validate } = require('express-validation');
const paramValidation = require('../../../config/param-validation');
const eventCtrl = require('./event.controller');
const JwtToken = require('../../middleware/jwt');

const jwtToken = new JwtToken();
const router = express.Router(); // eslint-disable-line new-cap

router
    .route('/create')
    /** GET /api/event - Get list of events */
    .get(eventCtrl.list)

    /** POST /api/event - Create new event */
    .post(eventCtrl.create);

router.route('/createPaymentIntent').post(eventCtrl.createPaymentIntent);
router.route('/book').post(validate(paramValidation.eventBooking), eventCtrl.book);

router
    .route('/paymentdone')
    /** GET /api/event - Get event details */
    .get(eventCtrl.paymentdone);

router.route('/update').put(eventCtrl.update);
router.route('/updateBooking').put(eventCtrl.updateBooking);

router
    .route('/uploadEventImages')
    /** GET /api/event - Get list of events */
    .get(eventCtrl.list)
    /** POST /api/event - Create new event */
    .post(validate(paramValidation.uploadEventImages), jwtToken.isClub, eventCtrl.uploadImages);

router
    .route('/list')
    /** GET /api/event - Get list of events */
    .get(eventCtrl.list);

router.route('/dashboardEventList').get(jwtToken.verifyToken, eventCtrl.dashboardEventList);

router.route('/getClubEventsList').get(eventCtrl.getClubEventsList);

router.route('/dashboard').get(jwtToken.verifyToken, eventCtrl.dashboard);

router.route('/adminBookingList').get(jwtToken.isAdmin, eventCtrl.adminBookingList);

router.route('/clubBookings').get(eventCtrl.clubBookings);

router
    .route('/getEventDetails')
    /** GET /api/event - Get event details */
    .get(eventCtrl.get);

router
    .route('/:eventId')
    /** GET /api/event/:eventId - Get event */
    .get(eventCtrl.get)
    /** DELETE /api/users/:eventId - Delete event */
    .delete(eventCtrl.remove);

/** Load user when API with eventId route parameter is hit */
router.param('eventId', eventCtrl.load);

router
    .route('/user/registration')
    .post(validate(paramValidation.registerClubUser), jwtToken.isStudent, eventCtrl.registerClubUser);

router
    .route('/user/create-registration-form')
    .get(eventCtrl.getRegisterFromData)
    .post(validate(paramValidation.createRegisterFormClubUser), jwtToken.isClub, eventCtrl.createRegisterFormClubUser)
    .put(validate(paramValidation.createRegisterFormClubUser), jwtToken.isClub, eventCtrl.updateRegisterFormClubUser);

router.route('/user/clubMembers').get(jwtToken.isClub, eventCtrl.getClubMembersData);
router.route('/createMembershipPaymentIntent').post(jwtToken.isStudent, eventCtrl.createMembershipPaymentIntent);
router.route('/updateMembershipBooking').put(jwtToken.isStudent, eventCtrl.updateMembershipBooking);
router.route('/updateBookingVerifiedStatus').put(jwtToken.isClub, eventCtrl.updateBookingVerifiedStatus);
module.exports = router;
