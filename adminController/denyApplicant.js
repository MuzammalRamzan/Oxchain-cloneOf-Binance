const authFile = require("../auth.js");
const UserModel = require("../models/User");
const { resetApplicant } = require("../sumsub");

const denyApplicant = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const user = await UserModel.findById(userId).lean();
  await resetApplicant(user.applicantId);
  await UserModel.updateOne({ _id: userId }, { applicantStatus: 0 });

  return res.json({ status: "success", message: "Applicant updated" });
};

module.exports = denyApplicant;
