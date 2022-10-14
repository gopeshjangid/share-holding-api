const path = require('path');
var AWS = require('aws-sdk');

AWS.config.loadFromPath(path.join(__dirname, '../../../config/aws.json'));

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
    }
};

module.exports = aws;