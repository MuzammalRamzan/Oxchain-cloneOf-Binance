const User = require("../../models/User");
var authFile = require("../../auth.js");
var utilities = require("../../utilities.js");

const resetPassword = async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var password = req.body.password;

  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      var twofa = user["twofa"];
      const filter = { _id: user_id, status: 1 };
      let result2 = await authFile.verifyToken(twofapin, twofa);

      if (result2 === true) {
        const update = { password: utilities.hashData(password) };
        User.findOneAndUpdate(filter, update, (err, doc) => {
          if (err) {
            console.log(err);
            res.json({ status: "fail", message: err });
          } else {
            res.json({ status: "succes", message: "update_success" });
          }
        });
      } else {
        res.json({ status: "fail", message: "2fa_failed", showableMessage: "2FA Failed" });
      }
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
  }
};

module.exports = resetPassword;
