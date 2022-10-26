const User = require("../../models/User");
var authFile = require("../../auth.js");

const changePhone = async function (req, res) {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var country_code = req.body.country_code;
  var phone = req.body.phone;

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
        const update = { phone: phone, country_code: country_code };
        let doc = await User.findOneAndUpdate(filter, update).exec();
        res.json({ status: "success", data: "update_success" });
      } else {
        res.json({ status: "fail", message: "2fa_failed" });
      }
    }
  }
};

module.exports = changePhone;
