const RecidencyModel = require('../../models/RecidencyModel');
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

const UploadRecidency = async function (req, res) {

    let timestamp = new Date().getTime();

    var user_id = req.body.user_id;
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);

    //get 3 files from request (front, back, selfie) as base64 string and send to aws s3 


    let file1 = req.body.file1;
    let file2 = req.body.file2;


    var base64Data4 = file1.replace(/^data:image\/(png|jpeg);base64,/, "");
    let file1New = new Buffer.from(base64Data4, 'base64');

    let file2New = null;
    if (req.body.recidencyFileExtension2 != null) {
        var base64Data5 = file2.replace(/^data:image\/(png|jpeg);base64,/, "");
        file2New = new Buffer.from(base64Data5, 'base64');
    }




    if (result === true) {
        let user = await User.findOne({
            _id: user_id,
        }).exec();

        if (user != null) {

            let verification = await RecidencyModel.findOne
                ({
                    user_id: user_id,
                }).exec();



            if (verification == null) {
                let country = User.country || null;


                let params4 = {
                    params: {
                        Bucket: "oxhain",
                        Key: 'Recidency/recidency1-' + timestamp + user_id + '.' + req.body.recidencyFileExtension1,
                        Body: file1New,
                        ContentType: "image/jpg",
                    },
                };

                var upload = new AWS.S3.ManagedUpload(params4);
                var promise = upload.promise();
                promise.then(
                    function (data) {
                        console.log('Successfully uploaded photo.');
                    },
                    function (err) {
                        console.error('There was an error uploading: ', err.message);
                    }
                );



                if (req.body.recidencyFileExtension2 != null) {
                    //upload file to aws s3
                    let params4 = {
                        params: {
                            Bucket: "oxhain",
                            Key: 'Recidency/recidency2-' + timestamp + user_id + '.' + req.body.recidencyFileExtension2,
                            Body: file2New,
                            ContentType: "image/jpg",
                        },
                    };

                    var upload = new AWS.S3.ManagedUpload(params4);
                    var promise = upload.promise();
                    promise.then(
                        function (data) {
                            console.log('Successfully uploaded photo.');
                        },
                        function (err) {
                            console.error('There was an error uploading: ', err.message);
                        }
                    );

                }


                let verification = new RecidencyModel({
                    user_id: user_id,
                    status: 0,
                    url: 'https://oxhain.s3.us-east-2.amazonaws.com/Recidency/recidency1-' + timestamp + user_id + '.' + req.body.recidencyFileExtension1,
                    url2: 'https://oxhain.s3.us-east-2.amazonaws.com/Recidency/recidency2-' + timestamp + user_id + '.' + req.body.recidencyFileExtension2,
                    country: country,
                });
                verification.save(function (err) {
                    if (err) {
                        return res.json({ status: "fail", message: "error", showableMessage: "Error while uploading Recidency" });
                    } else {
                        return res.json({ status: "success", message: "success", showableMessage: "Recidency Uploaded" });
                    }
                }
                );

            }
            else {
                if (verification.status == 2) {

                    let country = User.country || null;


                    let params4 = {
                        params: {
                            Bucket: "oxhain",
                            Key: 'Recidency/recidency1-' + timestamp + user_id + '.' + req.body.recidencyFileExtension1,
                            Body: file1New,
                            ContentType: "image/jpg",
                        },
                    };

                    var upload = new AWS.S3.ManagedUpload(params4);
                    var promise = upload.promise();
                    promise.then(
                        function (data) {
                            console.log('Successfully uploaded photo.');
                        },
                        function (err) {
                            console.error('There was an error uploading: ', err.message);
                        }
                    );



                    if (req.body.recidencyFileExtension2 != null) {
                        //upload file to aws s3
                        let params4 = {
                            params: {
                                Bucket: "oxhain",
                                Key: 'Recidency/recidency2-' + timestamp + user_id + '.' + req.body.recidencyFileExtension2,
                                Body: file2New,
                                ContentType: "image/jpg",
                            },
                        };

                        var upload = new AWS.S3.ManagedUpload(params4);
                        var promise = upload.promise();
                        promise.then(
                            function (data) {
                                console.log('Successfully uploaded photo.');
                            },
                            function (err) {
                                console.error('There was an error uploading: ', err.message);
                            }
                        );

                    }

                    RecidencyModel.findOneAndUpdate
                        ({
                            user_id: user_id,
                        },
                            {
                                status: 0,
                                url: 'https://oxhain.s3.us-east-2.amazonaws.com/Recidency/Recidency1-' + timestamp + user_id + '.' + req.body.recidencyFileExtension1,
                                url2: 'https://oxhain.s3.us-east-2.amazonaws.com/Recidency/Recidency2-' + timestamp + user_id + '.' + req.body.recidencyFileExtension2,
                                country: country,
                            },
                        ).exec(function (err) {
                            if (err) {
                                return res.json({ status: "fail", message: "error", showableMessage: "Error while uploading Recidency" });
                            } else {
                                return res.json({ status: "success", message: "success", showableMessage: "Recidency Updated" });
                            }
                        }
                        );
                }
                else {
                    return res.json({ status: "fail", message: "already_uploaded", showableMessage: "Recidency Already Uploaded" });
                }

            }


        } else {
            return res.json({ status: "fail", message: "user_not_found", showableMessage: "User not found" });
        }
    } else {
        return res.json({ status: "fail", message: "api_key_error", showableMessage: "Api key error" });
    }
}

module.exports = UploadRecidency;