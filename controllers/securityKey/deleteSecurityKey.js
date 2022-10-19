const User = require("../../models/Test");
const SecurityKey = require("../../models/SecurityKey");
var authFile = require("../../auth.js");

const deleteSecurityKey = (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var twofapin = req.body.twofapin;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      User.findOne({
        _id: user_id,
      }).then((user) => {
        if (user != null) {
          var twofa = user["twofa"];

          authFile.verifyToken(twofapin, twofa).then((result2) => {
            if (result2 === true) {
              SecurityKey.findOneAndUpdate(
                { user_id: user_id, id: req.body.key_id },
                { status: 0 },
                (err, doc) => {
                  if (err) {
                    console.log(err);
                    res.json({ status: "fail", message: err });
                  } else {
                    res.json({ status: "success", data: "" });
                  }
                }
              );
            } else {
              res.json({ status: "fail", message: "2fa_failed" });
            }
          });
        }
      });
    } else {
      res.json({ status: "fail", message: "403 Forbidden" });
    }
  });
};

module.exports = deleteSecurityKey;
