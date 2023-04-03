var authenticator = require("authenticator");
var authFile = require("../../auth.js");
var Device = require("../../models/Device");

const LoginLogs = require("../../models/LoginLogs");

const deleteActiveDevice = async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {

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

    let device = await Device.findOne({
      user_id: req.body.user_id,
      deviceId: req.body.device_id,
      status: 1,
    }).exec();

    if (device != null) {
      //remove device
      await Device.deleteOne({
        user_id: req.body.user_id,
        deviceId: req.body.device_id,
        status: 1,
      }).exec();

      res.json({ status: "success", message: "device_deleted" });
    } else {
      res.json({ status: "fail", message: "no_device_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = deleteActiveDevice;
