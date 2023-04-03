const User = require("../../models/User");
var authFile = require("../../auth.js");

const VerificationIdModel = require("../../models/VerificationId");

const getUserInfo = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

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

    let user = await User.findOne({
      _id: user_id,
    }).exec();

    if (user != null) {
      var twofaStatus = user["twofa"];

      var status = user["status"];

      let verificationStatus = "Not Verified";

      let verificationId = await VerificationIdModel.findOne({
        user_id: user_id,
      }).exec();


      if (verificationId == null) {
        verificationStatus = "Not Verified";
      }
      
      if (verificationId.status == 1 || verificationId.status == "1") {
        verificationStatus = "Verified";
      }

      if (verificationId.status == 2 || verificationId.status == "2") {
        verificationStatus = "Rejected";
      }

      if (verificationId.status == 0 || verificationId.status == "0") {
        verificationStatus = "Pending";
      }

      if (status == 1) {
        res.json({
          status: "success",
          data: {
            user_id: user["_id"],
            showableUserId: user["showableUserId"],
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
            verificationStatus: verificationStatus,
            registrationDate: user["createdAt"],
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
