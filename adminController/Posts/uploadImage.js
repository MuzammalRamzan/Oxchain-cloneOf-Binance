require('dotenv').config();
var fs = require('fs');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const SESConfig = {
	apiVersion: '2010-12-01',
	httpOptions: { timeout: 30000, connectTimeout: 5000 },
	maxRetries: 3,
	accessKeyId: process.env.AWS_ACCESS_KEY,
	secretAccessKey: process.env.AWS_SECRET_KEY,
	region: 'us-east-2',
};
AWS.config.update(SESConfig);

const uploadImage = async (file, fileExtension) => {
	try {
		let timestamp = new Date().getTime();

		//base64 string to file
		var base64Data = file.replace(/^data:image\/(png|jpeg);base64,/, '');
		let fileNew = new Buffer.from(base64Data, 'base64');

		//upload file to aws s3
		let params2 = {
			params: {
				Bucket: 'oxhain',
				Key: 'news/cover-' + timestamp + '.' + fileExtension,
				Body: fileNew,
				ContentType: 'image/jpg',
			},
		};

		var upload2 = new AWS.S3.ManagedUpload(params2);
		var promise = upload2.promise();
		return promise.then(function (data) {
			return {
				status: true,
				data: data.Location,
			};
		});
	} catch (error) {
		return {
			status: false,
			error,
		};
	}
};

module.exports = uploadImage;
