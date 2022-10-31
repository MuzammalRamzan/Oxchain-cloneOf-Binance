var authenticator = require("authenticator");
var authFile = require("../../auth.js");
var Device = require("../../models/Device");

const getVerificationMethod = async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
   
    let device = await Device.find({
      user_id: req.body.user_id,
      status: 1,
    }).exec();

    if (device != null) {
      res.json({ status: "success", data: device });
    } else {
      res.json({ status: "fail", message: "no_device_found" });
    }


  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = getVerificationMethod;
