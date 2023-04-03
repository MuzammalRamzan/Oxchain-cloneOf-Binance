const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");

const getSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
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

    let securityKey = await SecurityKey.find({
      user_id: user_id,
      status: 1,
    }).exec();

    if (securityKey.length > 0) {
      console.log(securityKey);
      res.json({
        status: "success",
        data: {
          response: "success",
          createdAt: securityKey[0]["createdAt"],
          wallet: securityKey[0]["wallet"],
          trade: securityKey[0]["trade"],
          deposit: securityKey[0]["deposit"],
          withdraw: securityKey[0]["withdraw"],
          id: securityKey[0]["id"],
        },
      });
    } else {
      res.json({ status: "fail", message: "security_key_not_active" });
    }
  }
};

module.exports = getSecurityKey;
