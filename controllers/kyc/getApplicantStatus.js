const { getApplicantStatus: getKYCStatus } = require("../../sumsub");
const authFile = require("../../auth.js");
const User = require("../../models/User");

const getApplicantStatus = async (req, res) => {
  const api_key_result = req.body.api_key;
  const user_id = req.body.user_id;
  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) res.json({ status: "fail", message: "Forbidden 403" });
  try {
    const user = await User.findById(user_id).lean();

    const data = await getKYCStatus(user?.applicantId);
    const applicantStatus = data?.reviewResult?.reviewAnswer == "GREEN" ? 1 : 0;
    await User.updateOne(
      { _id: user_id },
      { $set: { applicantStatus } }
    );
    res.json({ status: "success", data: user });
  } catch (err) {
    throw err;
  }
};

module.exports = getApplicantStatus;
