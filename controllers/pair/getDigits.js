const Pairs = require("../../models/Pairs");
var authFile = require("../../auth.js");

const getDigits = async function (req, res) {
  var api_key_result = req.body.api_key;
  var pairName = req.body.pairName;
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
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
