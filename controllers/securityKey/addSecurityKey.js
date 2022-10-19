const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");

const addSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = utilities.hashData(req.body.security_key);
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var securityKey = await SecurityKey.findOne({
      user_id: user_id,
      status: 1,
    }).exec();

    if (securityKey != null) {
      res.json({ status: "success", data: "secury_key_active" });
    } else {
      var newSecurityKey = new SecurityKey({
        user_id: user_id,
        key: security_key,
        status: 1,
        trade: trade,
        wallet: wallet,
        deposit: deposit,
        withdraw: withdraw,
      });
      newSecurityKey.save((err, doc) => {
        if (err) {
          console.log(err);
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "" });
        }
      });
    }
  }
};

module.exports = addSecurityKey;
