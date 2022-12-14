const VerificationIdModel = require("../../models/VerificationId");
const authFile = require("../../auth.js");
const AWS = require("aws-sdk");

const s3Client = new AWS.S3({
  accessKeyId: "your_access_key_id",
  secretAccessKey: "your_secret_access_id",
  region: "region",
});

const params = {
  Bucket: "yourBucketName",
};

const addVerificationId = async (req, res) => {
  const apiKey = req.body.apiKey;
  const data = req.body.data;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  if (!req.files || !data || !data.userId || !data.type || !data.level)
    return res.status(400).json({
      status: "error",
      message: "Please provide correct data",
    });

  params.Body = req.files[0].buffer;
  params.Key = `${req.files[0].originalname}-${data.userId}-${Date.now()}`;

  const object = await s3Client.upload().promise(params);
  data.url = object.Location;

  const verificationId = VerificationIdModel(data);
  await verificationId.save();
  return res.json({ status: "success", data: verificationId });
};

module.exports = addVerificationId;
