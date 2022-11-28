const User = require("../../models/User");
var authFile = require("../../auth.js");

const getUserId = async function (req, res) {
  var email = req.body.email;
  var api_key_result = req.body.api_key;

  authFile.apiKeyChecker(api_key_result).then((result) => {
    if (result === true) {
      User.findOne({
        email: email,
      })
        .then((user) => {
          if (user != null) {
            var myArray = [];
            myArray.push({
              response: "success",
              user_id: user["id"],
            });
            res.json({ status: "success", data: myArray });
          } else {
            res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" });
          }
        })
        .catch((err) => {
          res.json({ status: "fail", message: err });
        });
    } else {
      res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
    }
  });
};

module.exports = getUserId;
