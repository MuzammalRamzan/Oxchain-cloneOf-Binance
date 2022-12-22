require('dotenv').config();
var fs = require('fs');
const AWS = require('aws-sdk');
const SESConfig = {
    apiVersion: "2010-12-01",
    httpOptions: { timeout: 30000, connectTimeout: 5000 },
    maxRetries: 3,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: "us-east-2"
}
AWS.config.update(SESConfig);

//var s3bucket = new AWS.S3({ params: { Bucket: 'oxhain' } });
let filepath = '/Users/furkandamar/Desktop/Screen Shot 2022-12-21 at 12.14.12.png';

const content = fs.readFileSync(filepath);

let params = {
    params: {
        Bucket: "oxhain",
        Key: 'KYC/NEW_FILE_NAME.jpeg',
        Body: content,
        ContentType: "image/jpg",
    },
};
var upload = new AWS.S3.ManagedUpload(params);
var promise = upload.promise();
promise.then(
    function (data) {
        console.log('Successfully uploaded photo.');
    },
    function (err) {
        console.error('There was an error uploading: ', err.message);
    }
);
