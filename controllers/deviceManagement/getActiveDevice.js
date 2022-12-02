var authenticator = require("authenticator");
var authFile = require("../../auth.js");
var Device = require("../../models/Device");

const getActiveDevice = async function (req, res) {
  var api_key_result = req.body.api_key;
  const deviceName = req.body.deviceName;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
   const query = {
    user_id: req.body.user_id,
    status: 1,
  }
  if (deviceName) query.deviceName = deviceName;
    let device = await Device.find(query).exec();

    if (device != null) {
      res.json({ status: "success", data: device });
    } else {
      res.json({ status: "fail", message: "no_device_found", showableMessage: 'No Device found' });
    }


  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = getActiveDevice;
