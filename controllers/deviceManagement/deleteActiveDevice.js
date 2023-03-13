var authenticator = require("authenticator");
var authFile = require("../../auth.js");
var Device = require("../../models/Device");

const LoginLogs = require("../../models/LoginLogs");

const deleteActiveDevice = async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let device = await Device.findOne({
      user_id: req.body.user_id,
      _id: req.body.device_id,
      status: 1,
    }).exec();

    if (device != null) {
      device.status = 0;
      device.save();



      //update status of login logs with this device id
      await LoginLogs.updateMany({
        user_id: req.body.user_id,
        deviceId: req.body.device_id,
      }, {
        $set: {
          status: "pending",
        },
      });


      res.json({ status: "success", message: "device_deleted" });
    } else {
      res.json({ status: "fail", message: "no_device_found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = deleteActiveDevice;
