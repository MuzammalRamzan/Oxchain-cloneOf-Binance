var authenticator = require("authenticator");
var authFile = require("../../auth.js");
var Device = require("../../models/Device");

const getActiveDevice = async function (req, res) {
  var api_key_result = req.body.api_key;
  const deviceName = req.body.deviceName;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {

    let key = req.headers["key"];

    if (!key) {
      return res.json({ status: "fail", message: "key_not_found" });
    }

    if (!req.body.device_id || !req.body.user_id) {
      return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
    }

    let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


    if (checkKey === "expired") {
      return res.json({ status: "fail", message: "key_expired" });
    }

    if (!checkKey) {
      return res.json({ status: "fail", message: "invalid_key" });
    }

    const query = {
      user_id: req.body.user_id,
      status: 1,
    }
    if (deviceName) query.deviceName = deviceName;
    let device = await Device.find(query).exec();

    if (device != null) {
      return res.json({ status: "success", data: device });
    } else {
      return res.json({ status: "fail", message: "no_device_found", showableMessage: 'No Device found' });
    }


  } else {
    return res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = getActiveDevice;
