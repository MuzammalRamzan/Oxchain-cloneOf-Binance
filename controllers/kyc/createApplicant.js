const { createApplicant: createKYCApplicant } = require("../../sumsub");
const authFile = require("../../auth.js");
const User = require("../../models/User");

const createApplicant = async (req, res) => {
  const api_key_result = req.body.api_key;
  const user_id = req.body.user_id;
  const level_name = req.body.level_name;
  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) res.json({ status: "fail", message: "Forbidden 403" });

  try {
    const applicant = await createKYCApplicant(user_id, level_name);
    await User.updateOne(
      { _id: user_id },
      { $set: { applicantId: applicant.id } }
    );
    res.json({ status: "success", data: "update_success" });
  } catch (err) {
    throw err;
  }
};

module.exports = createApplicant;
