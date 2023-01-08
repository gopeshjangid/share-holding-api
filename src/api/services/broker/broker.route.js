const express = require('express');
const validate = require('express-validation');
const paramValidation = require('../../../config/param-validation');
const BrokerController = require('./broker.controller');
const shareHolderAssocController = require('../shareholder/shareholder_company_assoc.controller');
//const CompanyController = require('../shareholder/shareholder.controller');
const JwtToken = require('../../middleware/jwt');
const jwtToken = new JwtToken();

const router = express.Router(); // eslint-disable-line new-cap
router
    .route('/login')
    /** POST /api/user/login -  */
    .post(BrokerController.brokerLogin);

router.route('/getShareholderByStatus').get(BrokerController.getShareholderByStatus);
router.route('/updateShareholderStatus').post(BrokerController.updateShareholderStatus);
router.route('/getDRFRequestsList').get(shareHolderAssocController.getDRFRequestsForBroker);
router.route('/sendDRFRequestToRTA/:requestId').get(shareHolderAssocController.sendDRFRequestToRTA);

module.exports = router;
