const Company = require('../company/company.model');
//const CompanyTimeline = require('../company/company_timeline.model');
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
const list = (req, res, next) => {
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
};

const uploadRegistrationDocuments = async (req, res) => {
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
        const filePath = path.join(__dirname, '../DocumentsHTML/board_resolution.ejs');
        const fileName = `board_resolution_${Date.now()}.pdf`;
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
            'tripartite_agreement_franking_fillable',
            'master_creation_form'
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
                place_of_application,
                gsttin,
                pan,
                website
            } = params;

            const authorized_din = directors[0]?.din;
            const authorized_destination = directors[0]?.designation;
            const authorized_name = directors[0]?.name;
            const authorizer_din = directors[1]?.din;
            const authorizer_destination = directors[1]?.designation;
            const authorizer_name = directors[1]?.name;

            const processedDocs = processDocType.map(async (element) => {
                const filePath = path.join(__dirname, `../DocumentsHTML/${element}.ejs`);
                const directoryName = `${cin}`;
                const fileName = `${element}.pdf`;
                const pdfData = await PDF.generatePdf(filePath, {
                    name,
                    email,
                    pan,
                    registered_address,
                    contact_number,
                    cin,
                    date_of_application: moment().format('MM/DD/YY'),
                    place_of_application,
                    directors,
                    authorized_din,
                    authorized_destination,
                    authorized_name,
                    gsttin: gsttin || '',
                    website,
                    authorizer_name,
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
                    await Company.updateOne({ cin }, { $set: { process_status: 'PROCESSING'} });
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
    const documentList = await Document.find({ $and: [{ companyId: cin }] }).select({
        companyId: 1,
        docType: 1,
        docUrl: 1,
        status: 1
    });
    let jsonResult;
    if (documentList.length > 0) {
        try {
            const processedDocs = documentList.map(async (element) => {
                let fileName = element.docType;
                let directory = element.companyId;
                /////////////// Read Fron S3
                let pdfData = await File.readFromS3({ directory, fileName, dockType: 'pdf' });

                let files = await File.uploadToS3(
                    pdfData,
                    {
                        fileName: fileName + '.pdf',
                        fileType: 'application/pdf',
                        encoding: 'text/html; charset=utf-8'
                    },
                    directory,
                    'shareholding-signed-docs'
                );
                /////////
                await File.removeBasket({ directory, fileName, dockType: 'pdf' });
                let aws_url = element.docUrl.replace(/share-holding-docs/gi, 'shareholding-signed-docs');
                return await Document.updateOne({ _id: element._id }, { $set: { status: 'ACTIVE', docUrl: aws_url } });
            });
            Promise.all(processedDocs)
                .then(async (response) => {
                    console.log('All Documents has been updated...');
                    await Company.updateOne({ cin }, { $set: { process_status: 'SIGNED',"timeline.documentSigned": new Date()} });
                    /*
                    const companyData = await Company.findOne({ cin: cin }, { _id: 1 });
                    await CompanyTimeline.findOneAndUpdate(
                        { companyId: ObjectId(companyData._id) },
                        { $set: { documentSigned: new Date() } }
                    );
                    */
                    req.app.get('socketIo').to(cin).emit('SIGNED', { companyCIN: cin });
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

const connectSocket = async (io, companyCIN) => {
    io.on('connection', async (socket) => {
        socket.join(companyCIN);
        console.log('connected');
        // Leave the room if the user closes the socket
        socket.on('disconnect', () => {
            socket.leave(companyCIN);
            console.log('A disconnection has been made');
        });
        Promise.resolve('connected');
    });

    io.on('error', (info) => {
        console.log('err =>>', info);
        Promise.reject('Error');
    });
};

module.exports = {
    list,
    downloadResolutionForm,
    getDocumentByCompanyId,
    uploadRegistrationDocuments,
    processDocuments,
    updateCompanyDocumentStatus,
    connectSocket
};
