const { addDocument: addKYCDocument } = require("../../sumsub");
const authFile = require("../../auth.js");
const User = require("../../models/User");

const addDocument = async (req, res) => {
  const api_key_result = req.body.api_key;
  const user_id = req.body.user_id;
  const country_code = req.body.country_code;
  const doc_type = req.body.doc_type;
  const doc_sub_type = req.body.doc_sub_type;
  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) res.json({ status: "fail", message: "Forbidden 403" });

  let key = req.headers["key"];

  if (!key) {
    return res.json({ status: "fail", message: "key_not_found" });
  }

  if (!req.body.device_id || !req.body.user_id) {
    return res.json({ status: "fail", message: "invalid_params" });
  }

  let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


  if (checkKey === "expired") {
    return res.json({ status: "fail", message: "key_expired" });
  }

  if (!checkKey) {
    return res.json({ status: "fail", message: "invalid_key" });
  }

  const user = await User.findById(user_id).lean();
  try {
    await addKYCDocument(user.applicantId, req.files[0].buffer, { idDocType: doc_type, country: country_code, idDocSubType: doc_sub_type });
    res.json({ status: "success", data: "update_success" });
  } catch (err) {
    throw err;
  }
};

module.exports = addDocument;
