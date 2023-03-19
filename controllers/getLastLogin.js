const LoginLogs = require("../models/LoginLogs");
var authFile = require("../auth.js");

const getLastLogin = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

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

    let user = await LoginLogs.findOne({
      user_id: user_id,
      status: 1,
    }).exec();

    console.log(user);
    let date = user["createdAt"]
      .toISOString()
      .replace(/T/, " ")
      .replace(/\..+/, "");

    const array = {
      date: date,
      ip: user["ip"],
    };

    if (user != null) {
      var last_login = user["createdAt"];
      res.json({ status: "success", data: array });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = getLastLogin;
