const Pairs = require("../../models/Pairs");
var authFile = require("../../auth.js");

const getDigits = async function (req, res) {
  var api_key_result = req.body.api_key;
  var pairName = req.body.pairName;
  var result = await authFile.apiKeyChecker(api_key_result);

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

    var list = await Pairs.findOne(
      { name: pairName },
      { digits: 1, _id: 1 }
    ).exec();
    res.json({ status: "success", data: list });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = getDigits;
