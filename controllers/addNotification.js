const Notification = require("../models/Notifications");
const NotificationTokens = require("../models/NotificationTokens");
var authFile = require("../auth.js");
var notifications = require("../notifications.js");

const addNotification = async function (req, res) {
  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const newNotification = new Notification({
      notificationTitle: req.body.notificationTitle,
      notificationMessage: req.body.notificationMessage,
    });
    await newNotification.save();

    let tokens = await NotificationTokens.find({}).exec();
    for (var i = 0; i < tokens.length; i++) {
      var token = tokens[i].token_id;
      notifications.sendPushNotification(token, req.body.notificationMessage);
    }
    res.json({ status: "success", data: "" });
  }
};

module.exports = addNotification;
