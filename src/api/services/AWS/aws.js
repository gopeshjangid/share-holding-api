const path = require('path');
var AWS = require('aws-sdk');

AWS.config = {
    accessKeyId: process.env.accessKeyId,
    secretAccessKey: process.env.secretAccessKey,
    region: 'us-east-2',
    apiVersions: {
        'me  diaconvert': '2017-08-29',
        iam: '2010-05-08',
        s3: '2006-03-01',
        sqs: '2012-11-05'
    }
};
const aws = {
    AWS: () => {
        return AWS;
    },
    S3: () => {
        return new AWS.S3();
    },
    MediaConvert: () => {
        return new AWS.MediaConvert();
    },
    IAM: () => {
        return new AWS.IAM();
    },
    SQS: () => {
        return new AWS.SQS();
    },
    S3Client: (config) => {
        return new AWS.S3(config);
    },
};

module.exports = aws;
