const User = require("../../models/User");
var authFile = require("../../auth.js");

const getUserInfo = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
    }).exec();

    if (user != null) {
      var twofaStatus = user["twofa"];

      var status = user["status"];

      if (status == 1) {
        res.json({
          status: "success",
          data: {
            avatar: user["avatar"],
            nickname: user["nickname"],
            name: user["name"],
            surname: user["surname"],
            email: user["email"],
            country_code: user["country_code"],
            phone_number: user["phone_number"],
            city: user["city"],
            country: user["country"],
            address: user["address"],
          },
        });
      }

      if (status == 0) {
        res.json({ status: "fail", message: "account_not_activated", showableMessage: "Account not Activated" });
      }
    } else {
      res.json({ status: "fail", message: "login_failed", showableMessage: "Login Failed" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
  }
};

module.exports = getUserInfo;
