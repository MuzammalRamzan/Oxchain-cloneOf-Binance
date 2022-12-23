const Notification = require("../models/Notifications");
const NotificationTokens = require("../models/NotificationTokens");
var authFile = require("../auth.js");
var notifications = require("../notifications.js");
var mailer = require("../mailer.js");
const UserModel = require("../models/User");
const SiteNotificationModel = require("../models/SiteNotifications");

const addNotification = async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const newNotification = new Notification({
      notificationTitle: req.body.notificationTitle,
      notificationMessage: req.body.notificationMessage,
    });
    await newNotification.save();

    let users = await UserModel.find({ status: 1 });

    for (let i = 0; i < users.length; i++) {
      let user = users[i];

      let SiteNotificationCheck = await SiteNotificationModel.findOne({
        user_id: user._id,
      });

      if (SiteNotificationCheck) {
        if (SiteNotificationCheck.system_messages == 0) {
          console.log("User " + user.email + " has disabled system messages");
          continue;
        }
        else {
          if (user.email != "" && user.email != null && user.email != undefined) {
            console.log("Sending email to " + user.email);
            mailer.sendMail(user.email, req.body.notificationTitle, req.body.notificationMessage).catch((err) => {
              console.log(err);
            }
            );
          }
        }
      }
      else {
        if (user.email != "" && user.email != null && user.email != undefined) {
          console.log("Sending email to " + user.email);
          mailer.sendMail(user.email, req.body.notificationTitle, req.body.notificationMessage).catch((err) => {
            console.log(err);
          }
          );
        }
      }

    }

    res.json({ status: "success", data: "" });

  }
};



module.exports = addNotification;
