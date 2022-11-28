const User = require("../../models/User");
var authFile = require("../../auth.js");

const update2fa = async function (req, res) {
  var user_id = req.body.user_id;
  var twofa = req.body.twofa;
  var twofapin = req.body.twofapin;
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const filter = { _id: user_id };
    const update = { twofa: twofa };

    var result2 = await authFile.verifyToken(twofapin, twofa);

    if (result2 === true) {
      User.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          console.log(err);
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "2fa_updated" });
        }
      });
    } else {
      res.json({ status: "fail", message: "wrong_auth_pin", showableMessage: "Wrong Auth Pin" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "Forbidden 403" });
  }
};

module.exports = update2fa;
