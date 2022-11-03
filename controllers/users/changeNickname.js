const User = require("../../models/User");
var authFile = require("../../auth.js");
const changeNickname = async function (req, res) {
  var user_id = req.body.user_id;
  var nickname = req.body.nickname;

  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      const filter = { _id: user_id, status: 1 };
      const update = { nickname: nickname };

      User.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          res.json({ status: "fail", message: err });
        } else {
          res.json({ status: "success", data: "update_success" });
        }
      });
    }
  }
};

module.exports = changeNickname;
