const { createApplicant: createKYCApplicant } = require("../../sumsub");
const authFile = require("../../auth.js");
const User = require("../../models/User");

const createApplicant = async (req, res) => {
  const api_key_result = req.body.api_key;
  const userId = req.body.userId;
  const levelName = req.body.levelName;
  const phone = req.body.phone;
  const email = req.body.email;
  const fixedInfo = req.body.fixedInfo;
  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) res.json({ status: "fail", message: "Forbidden 403" });

  try {
    const applicant = await createKYCApplicant(
      {
        externalUserId: userId,
        email,
        phone,
        fixedInfo,
      },
      levelName
    );
    await User.updateOne(
      { _id: userId },
      { $set: { applicantId: applicant.id } }
    );
    res.json({ status: "success", data: "update_success" });
  } catch (err) {
    throw err;
  }
};

module.exports = createApplicant;
