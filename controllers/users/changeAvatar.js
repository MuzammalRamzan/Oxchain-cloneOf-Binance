const User = require("../../models/User");

var authFile = require("../../auth.js");
const mailer = require("../../mailer");
const SiteNotifications = require("../../models/SiteNotifications");
const changeAvatar = async function (req, res) {

  var user_id = req.body.user_id;
  var avatar = req.body.avatar;

  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    if (user != null) {
      const filter = { _id: user_id, status: 1 };
      const update = { avatar: avatar };

      User.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          res.json({ status: "fail", message: err });
        } else {


          let notificationCheck = SiteNotifications.findOne({
            user_id: user_id
          }).exec();

          if (notificationCheck != null) {

            if (notificationCheck.system_messages == 1 || notificationCheck.system_messages == "1") {
              mailer.sendMail(user.email, "Avatar changed", "Avatar changed", "Your avatar has been changed. If you did not do this, please contact us immediately.");
            }
          }

          res.json({ status: "success", data: "update_success" });
        }
      });
    }
  }
};

module.exports = changeAvatar;
