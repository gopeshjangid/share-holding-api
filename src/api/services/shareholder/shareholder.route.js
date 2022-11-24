const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../../config/param-validation');
const ShareholderController = require('./shareholder.controller');
const router = express.Router(); // eslint-disable-line new-cap
router.route('/shareholderRegistration').post(ShareholderController.registration);

module.exports = router;