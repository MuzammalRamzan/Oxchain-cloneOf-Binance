const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");

const updateSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
  var security_key = req.body.security_key;
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
      id: req.body.id,
    }).exec();

    console.log(user_id)
    console.log(securityKey);

    if (securityKey != null) {
      const filter = { _id: req.body.id };
      const update = {
        wallet: wallet,
        deposit: deposit,
        withdraw: withdraw,
        trade: trade,
      };
      SecurityKey.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          console.log(err);
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "update_success" });
        }
      });
    } else {
      res.json({ status: "fail", message: "security_key_not_found" });
    }
  }
};

module.exports = updateSecurityKey;
