const VerificationIdModel = require("../../models/VerificationId");
const authFile = require("../../auth.js");

const getVerificationIds = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  if (!userId)
    return res.json({
      status: "error",
      message: "Please provide user id",
    });

  const verificationIds = await VerificationIdModel.find({ userId }).lean();
  return res.json({ status: "success", data: verificationIds });
};

module.exports = getVerificationIds;
