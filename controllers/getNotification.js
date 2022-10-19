const Notification = require("../models/Notifications");
const ReadNotification = require("../models/ReadNotifications");
var authFile = require("../auth.js");

const getNotification = async function (req, res) {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;
  var readStatus = "unread";

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var myArray = new Array();
    let notification = await Notification.find({})
      .sort({ createdAt: -1 })
      .exec();
    for (var i = 0; i < notification.length; i++) {
      var messageId = notification[i].id;
      var messageTitle = notification[i].notificationTitle;
      var messageMessage = notification[i].notificationMessage;
      var createdAt = notification[i].createdAt;
      createdAt = createdAt.toISOString().replace(/T/, " ").replace(/\..+/, "");
      var messageDate = notification[i].createdAt;
      let readNotification = await ReadNotification.findOne({
        user_id: user_id,
        notification_id: messageId,
      }).exec();

      if (readNotification == null) {
        readStatus = "unread";
      } else {
        readStatus = "read";
      }
      var message = {
        messageId: messageId,
        createdAt: createdAt,
        messageTitle: messageTitle,
        messageMessage: messageMessage,
        messageDate: messageDate,
        readStatus: readStatus,
      };
      myArray.push(message);
    }
    if (notification.length == 0) {
      res.json({ status: "fail", message: "no_notification" });
    } else {
      res.json({ status: "success", data: myArray });
    }
  }
};

module.exports = getNotification;
