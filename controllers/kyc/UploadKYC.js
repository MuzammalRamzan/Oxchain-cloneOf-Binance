const VerificationModel = require('../../models/VerificationId');
const User = require('../../models/User');
require('dotenv').config();
var fs = require('fs');
const AWS = require('aws-sdk');
var authFile = require('../../auth');

const SESConfig = {
    apiVersion: "2010-12-01",
    httpOptions: { timeout: 30000, connectTimeout: 5000 },
    maxRetries: 3,
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY,
    region: "us-east-2"
}
AWS.config.update(SESConfig);

const UploadKYC = async function (req, res) {

    var user_id = req.body.user_id;
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);


    if (result === true) {
        let user = await User.findOne({
            _id: user_id,
        }).exec();

        if (user != null) {

            let verification = await VerificationModel.findOne
                ({
                    user_id: user_id,
                }).exec();


            if (verification == null) {

                //get file from request
                var file = req.files;
                var file_name = file[0].originalname;

                //get file extension
                var file_extension = file_name.split('.').pop();

                let country = User.country || null;
                //upload file to aws s3
                let params = {
                    params: {
                        Bucket: "oxhain",
                        Key: 'KYC/' + user_id + '.' + file_extension,
                        Body: file[0].buffer,
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


                console.log("user_id: " + user_id, "status: 0", "url: " + 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/' + user_id + '.' + file_extension, "country: " + country)

                let verification = new VerificationModel({
                    user_id: user_id,
                    status: 0,
                    url: 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/' + user_id + '.' + file_extension,
                    country: country,
                });

                verification.save(function (err) {
                    if (err) {
                        return res.json({ status: "fail", message: "error", showableMessage: "Error while uploading KYC" });
                    } else {
                        return res.json({ status: "success", message: "success", showableMessage: "KYC Uploaded" });
                    }
                }
                );
            }




        } else {
            return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not found" });
        }
    } else {
        return res.json({ status: "fail", message: "api_key_error", showableMessage: "Api key error" });
    }
}

module.exports = UploadKYC;