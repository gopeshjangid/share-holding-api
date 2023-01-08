const express = require('express');
const Upload = require('./Upload');
const Document = require('./document.controller');
const PDF = require('./PDF');

const router = express.Router(); // eslint-disable-line new-cap

router
    .route('/uploadFile')
    /** GET /api/users - Get list of users */
    .post(Upload.uploadDocs);

router
    .route('/uploadRegistrationDocuments')
    /** GET /api/users - Get list of users */
    .post(Document.uploadRegistrationDocuments);
router
    .route('/generatePdf')
    /** GET /api/users - Get list of users */
    .post(PDF.generatePdf);

router
    .route('/downloadResolutionForm')
    /** GET /api/users - Get list of users */
    .post(Document.downloadResolutionForm);

router.route('/updateCompanyDocumentStatus').get(Document.updateCompanyDocumentStatus);

router
    .route('/getCompanyDocumentsList')
    /** GET /api/users - Get list of users */
    .get(Document.getCompanyDocumentsList);

router
    .route('/addDocumentRemark')
    /** PATCH /addDocumentRemark - Update the remark of a document */
    .patch(Document.addDocumentRemark);

router.route('/readZipFromS3').get(Document.readZipFromS3);
router.route('/downloadCompanyDocsZip/:companyCIN').get(Document.downloadCompanyDocsZip);

// /api/users/verifyOtp
module.exports = router;
