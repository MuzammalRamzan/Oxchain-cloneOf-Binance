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


    let timestamp = new Date().getTime();



    var user_id = req.body.user_id;
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);

    //get 3 files from request (front, back, selfie) as base64 string and send to aws s3 

    let file1 = req.body.file1;
    let file2 = req.body.file2;
    let file3 = req.body.file3;

    let file1extension = req.body.file1extension;
    let file2extension = req.body.file2extension;
    let file3extension = req.body.file3extension;


    //base64 string to file
    var base64Data = file1.replace(/^data:image\/(png|jpeg);base64,/, "");
    let file1New = new Buffer.from(base64Data, 'base64');

    var base64Data2 = file2.replace(/^data:image\/(png|jpeg);base64,/, "");
    let file2New = new Buffer.from(base64Data2, 'base64');

    var base64Data3 = file3.replace(/^data:image\/(png|jpeg);base64,/, "");
    let file3New = new Buffer.from(base64Data3, 'base64');


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
                let country = User.country || null;


                //upload file to aws s3
                let params2 = {
                    params: {
                        Bucket: "oxhain",
                        Key: 'KYC/front-' + timestamp + user_id + '.' + file1extension,
                        Body: file1New,
                        ContentType: "image/jpg",
                    },
                };

                var upload2 = new AWS.S3.ManagedUpload(params2);
                var promise = upload2.promise();
                promise.then(
                    function (data) {
                        console.log('Successfully uploaded front photo.');
                    },
                    function (err) {
                        console.error('There was an error uploading: ', err.message);
                    }
                );

                //second photo  

                //upload file to aws s3
                let params = {
                    params: {
                        Bucket: "oxhain",
                        Key: 'KYC/back-' + timestamp + user_id + '.' + file2extension,
                        Body: file2New,
                        ContentType: "image/jpg",
                    },
                };

                var upload = new AWS.S3.ManagedUpload(params);
                var promise = upload.promise();
                promise.then(
                    function (data) {
                        console.log('Successfully uploaded back photo.');
                    },
                    function (err) {
                        console.error('There was an error uploading: ', err.message);
                    }
                );


                //upload file to aws s3
                let params3 = {
                    params: {
                        Bucket: "oxhain",
                        Key: 'KYC/selfie-' + timestamp + user_id + '.' + file3extension,
                        Body: file3New,
                        ContentType: "image/jpg",
                    },
                };

                var upload = new AWS.S3.ManagedUpload(params3);
                var promise = upload.promise();
                promise.then(
                    function (data) {
                        console.log('Successfully uploaded selfie photo.');
                    },
                    function (err) {
                        console.error('There was an error uploading: ', err.message);
                    }
                );



                let verification = new VerificationModel({
                    user_id: user_id,
                    status: 0,
                    url: 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/front-' + timestamp + user_id + '.' + file1extension,
                    url2: 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/back-' + timestamp + user_id + '.' + file2extension,
                    url3: 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/selfie-' + timestamp + user_id + '.' + file3extension,
                    country: country || null,
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
            else {
                if (verification.status == 2) {

                    //upload file to aws s3
                    let params2 = {
                        params: {
                            Bucket: "oxhain",
                            Key: 'KYC/front-' + timestamp + user_id + '.' + file1extension,
                            Body: file1New,
                            ContentType: "image/jpg",
                        },
                    };

                    var upload2 = new AWS.S3.ManagedUpload(params2);
                    var promise = upload2.promise();
                    promise.then(
                        function (data) {
                            console.log('Successfully uploaded front photo.');
                        },
                        function (err) {
                            console.error('There was an error uploading: ', err.message);
                        }
                    );

                    //second photo  

                    //upload file to aws s3
                    let params = {
                        params: {
                            Bucket: "oxhain",
                            Key: 'KYC/back-' + timestamp + user_id + '.' + file2extension,
                            Body: file2New,
                            ContentType: "image/jpg",
                        },
                    };

                    var upload = new AWS.S3.ManagedUpload(params);
                    var promise = upload.promise();
                    promise.then(
                        function (data) {
                            console.log('Successfully uploaded back photo.');
                        },
                        function (err) {
                            console.error('There was an error uploading: ', err.message);
                        }
                    );


                    //upload file to aws s3
                    let params3 = {
                        params: {
                            Bucket: "oxhain",
                            Key: 'KYC/selfie-' + timestamp + user_id + '.' + file3extension,
                            Body: file3New,
                            ContentType: "image/jpg",
                        },
                    };

                    var upload = new AWS.S3.ManagedUpload(params3);
                    var promise = upload.promise();
                    promise.then(
                        function (data) {
                            console.log('Successfully uploaded selfie photo.');
                        },
                        function (err) {
                            console.error('There was an error uploading: ', err.message);
                        }
                    );



                    let country = User.country;
                    VerificationModel.findOneAndUpdate
                        ({
                            user_id: user_id,
                        },
                            {
                                status: 0,
                                url: 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/front-' + timestamp + user_id + '.' + file1extension,
                                url2: 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/back-' + timestamp + user_id + '.' + file2extension,
                                url3: 'https://oxhain.s3.us-east-2.amazonaws.com/KYC/selfie-' + timestamp + user_id + '.' + file3extension,
                                country: country,
                            },
                        ).exec(function (err) {
                            if (err) {
                                return res.json({ status: "fail", message: "error", showableMessage: "Error while uploading KYC" });
                            } else {
                                return res.json({ status: "success", message: "success", showableMessage: "KYC Updated" });
                            }
                        }
                        );
                }
                else {
                    return res.json({ status: "fail", message: "already_uploaded", showableMessage: "KYC Already Uploaded" });
                }

            }





        } else {
            return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not found" });
        }
    } else {
        return res.json({ status: "fail", message: "api_key_error", showableMessage: "Api key error" });
    }
}

module.exports = UploadKYC;