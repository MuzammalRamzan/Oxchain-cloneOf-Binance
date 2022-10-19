const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");

const getSecurityKey = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  console.log(user_id);

  let result = await authFile.apiKeyChecker(api_key_result);
  if (result === true) {
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
