const httpStatus = require('http-status');
const nodemailer = require('nodemailer');

/**
 * @extends Error
 */
class ExtendableError extends Error {
    constructor(message, status, isPublic) {
        super(message);
        this.name = this.constructor.name;
        this.message = message;
        this.status = status;
        this.isPublic = isPublic;
        this.isOperational = true; // This is required since bluebird 4 doesn't append it anymore.
        Error.captureStackTrace(this, this.constructor.name);
    }
}

/**
 * Class representing an API error.
 * @extends ExtendableError
 */
class Utils extends ExtendableError {
    /**
     * Creates an API error.
     * @param {string} message - Error message.
     * @param {number} status - HTTP status code of error.
     * @param {boolean} isPublic - Whether the message should be visible to user or not.
     */
    constructor(message, status = httpStatus.INTERNAL_SERVER_ERROR, isPublic = false) {
        super(message, status, isPublic);
    }

    getDocumentTypes = () => {
        return [
            'PAN',
            'GST_CERTIFICATE',
            'GST_DECLARATION',
            'INCORPORATION',
            'MOA',
            'AOA',
            'FIN_STATEMENT',
            'MGT',
            'MCF',
            'TRIPARTITE',
            'ISIN',
            'BALANCE_SHEET'
        ];
    };

    getJsonResponse = (status, message, data) => {
        return {
            status: status,
            message: message,
            data: data
        };
    };

    sendEmail = (data) => {
        try {
            var transporter = nodemailer.createTransport({
                service: process.env.EMAIL_TYPE,
                host: 'smtp.gmail.com',
                port: 587,
                secure: false,
                requireTLS: true,
                auth: {
                    user: process.env.FROM_EMAIL,
                    pass: process.env.EMAIL_PASS
                }
            });

            var mailOptions = {
                from: `${process.env.FROM_NAME} ${process.env.FROM_EMAIL}`,
                to: data.email,
                subject: data.subject,
                html: data.text
            };
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('mail error', error);
                    return error;
                } else {
                    console.log('mail sent: =>');
                    return true;
                }
            });
        } catch (err) {
            return err;
        }
    };

    join = (
        leftModel,
        lookup = {
            from: '',
            localField: '',
            foreignField: '',
            as: ''
        },
        condition,
        projection
    ) => {
        return new Promise((resolve, reject) => {
            leftModel
                .aggregate([
                    {
                        $match: condition,
                        $lookup: lookup,
                        $project: {
                            _id: true,
                            ...projection
                        }
                    }
                ])
                .exec((err, result) => {
                    if (err) reject(err);
                    resolve(result);
                });
        });
    };
}

module.exports = Utils;
