const Company = require('../company/company.model');
const Utils = require('../../../helpers/utils');
const utils = new Utils();
const File = require('./Upload');
const JwtToken = require('../../middleware/jwt');
const jwtToken = new JwtToken();
const mongoose = require('mongoose');
const ObjectId = mongoose.Types.ObjectId;
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const moment = require('moment');
const Document = require('./document.model');
const PDF = require('../docs/PDF');

/**
 * Company Login.
 */

const getDocumentByCompanyId = async (id) => {
    return utils.join(
        'document',
        {
            from: 'company',
            localField: '_id',
            foreignField: 'companyId',
            as: 'documents'
        },
        { companyId: id }
    );
};

const saveDocument = async (id, data) => {
    const document = new Document({
        companyId: id,
        ...data
    });

    return await document.save();
};

/**
 * Get user list.
 * @property {number} req.query.skip - Number of users to be skipped.
 * @property {number} req.query.limit - Limit number of users to be returned.
 * @returns {Company[]}
 */
function list(req, res, next) {
    const { limit = 50, skip = 0, companyId } = req?.query;
    Document.list({ limit, skip, companyId })
        .then(async (users) => {
            let jsonResult;
            if (users) {
                jsonResult = utils.getJsonResponse(true, 'Users list.', users);
            } else {
                jsonResult = utils.getJsonResponse(false, 'Users list not found.', null);
            }
            res.send(jsonResult);
        })
        .catch((e) => next(e));
}

const uploadRegistrationDocuments = async (req, res) => {
    // or module.exports = async (req, res) => {
    try {
        const companyName = req.query.companyName;
        const companyId = req.query.companyId;
        const docType = req.query.docType;
        if (companyName === '' || docType === '' || companyId === '') {
            return res.status(500).json({
                success: false,
                data: null,
                message: 'Please provide companyName, companyId, docType in query string'
            });
        }

        const directoryName = `${companyName}`;
        let files = await File.upload(req, directoryName);

        const data = await saveDocument(companyId, {
            companyId,
            docType,
            docUrl: files[0].Location
        });

        res.status(200).json({
            success: true,
            data: data,
            message: 'File(s) uploaded successfully'
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, data: null, message: err.message });
    }
};

const downloadResolutionForm = async (req, res) => {
    try {
        const {
            authoriser,
            authoriser_designation,
            authorised,
            authorised_designation,
            id,
            name,
            email,
            registered_address,
            contact_number,
            isin,
            date_of_application
        } = req.body;
        const address = registered_address?.split(' ');
        const place_of_application = address[address.length - 1];
        const filePath = path.join(__dirname, '../DocumentsHTML/Board_Resolution.ejs');
        const fileName = `Board_Resolution_${Date.now()}.pdf`;
        const pdfData = await PDF.generatePdf(filePath, { ...req.body, place_of_application, fileName });
        res.contentType('application/pdf');
        res.header('Content-Length', '' + pdfData.length);
        fs.unlinkSync(fileName);
        return res.send(utils.getJsonResponse(true, 'Generated Pdf', pdfData));
    } catch (e) {
        console.log('Error:', e);
        return res.send(utils.getJsonResponse(false, e, null));
    }
};

const processDocuments = async (params) => {
    return new Promise((resolve, reject) => {
        const processDocType = [
            'rta_appointment_letter_for_equity',
            'rta_registration_form',
            'tripartite_agreement_franking_fillable'
        ];

        if (!params.gst) {
            processDocType.push('gst_declaration');
        }

        if (params.company_type === 'pvt_ltd') {
            processDocType.push('undertaking_for_private_ltd_co');
        }

        if (params.status === 'new') {
            processDocType.push('undertaking_for_balance_sheet');
        }

        try {
            const {
                name,
                email,
                cin,
                id,
                directors,
                contact_number,
                registered_address,
                date_of_application,
                place_of_application
            } = params;

            const processedDocs = processDocType.map(async (element) => {
                const filePath = path.join(__dirname, `../DocumentsHTML/${element}.ejs`);
                const directoryName = `${cin}`;
                const fileName = `${element}.pdf`;
                const pdfData = await PDF.generatePdf(filePath, {
                    name,
                    email,
                    registered_address,
                    contact_number,
                    cin,
                    date_of_application,
                    place_of_application,
                    directors,
                    fileName
                });

                let files = await File.uploadToS3(
                    pdfData,
                    {
                        fileName,
                        fileType: 'application/pdf',
                        encoding: 'text/html; charset=utf-8'
                    },
                    directoryName
                );
                fs.unlinkSync(fileName);
                return await saveDocument(cin, {
                    companyId: cin,
                    docType: element,
                    docUrl: files.Location
                });
            });

            Promise.all(processedDocs)
                .then(async (res) => {
                    console.log('All Documents processed...');
                    await Company.updateOne({ cin }, { $set: { process_status: "PROCESSING"} });
                    return resolve(res);
                })
                .catch((err) => {
                    console.log('Document processed err:', err);
                    reject(err);
                });
        } catch (e) {
            console.log('Error in process: ', e);
            reject(e);
        }
    });
};

const updateCompanyDocumentStatus = async (req, res, next) => {
    let cin = req?.query?.cin;
    //return new Promise(async(resolve, reject) => {
    const documentList = await Document.find({ $and: [{ companyId: cin }, { status: "PENDING" }] }).select({ companyId: 1, docType: 1, docUrl: 1, status: 1 });
    let jsonResult = '';
    // console.log(documentList);
    if (documentList.length > 0) {
        try {
            /*
            let jsonResult = utils.getJsonResponse(true, 'Please send userId ', documentList);
            res.send(jsonResult);
            */
            let constNumber = 1;
            const processedDocs = documentList.map(async (element) => {
                let fileName = element.docType;
                let directory = element.companyId;
                await File.removeBasket({ directory, fileName, dockType: 'pdf' });
                let aws_url = element.docUrl.replace(/share-active-docs/gi, "share-holding-docs");
                return await Document.updateOne({ _id: element._id }, { $set: { status: "ACTIVE", docUrl: aws_url } });
                //console.log(aws_url);   
            });
            Promise.all(processedDocs)
                .then(async (response) => {
                    console.log('All Documents has been updated...');
                    //return resolve(res);
                    await Company.updateOne({ cin }, { $set: { process_status: "SIGNED"} });
                    jsonResult = utils.getJsonResponse(true, 'Document updated to another bucket.', response);
                    return res.send(jsonResult);
                })
                .catch((err) => {
                    console.log('Document processed err:', err);
                    next(err);
                });
        } catch (e) {
            console.log('Error in process: ', e);
            next(e);

        }
    } else {
        jsonResult = utils.getJsonResponse(false, 'Document does not exists.', null);
        return res.send(jsonResult);
    }
};
module.exports = {
    list,
    downloadResolutionForm,
    getDocumentByCompanyId,
    uploadRegistrationDocuments,
    processDocuments,
    updateCompanyDocumentStatus
};
