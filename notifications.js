const axios = require("axios");


async function sendPushNotification(expoPushToken, body) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Oxhain",
    body: body,
  };

  axios.post("https://exp.host/--/api/v2/push/send", message).then((result) => {
    console.log(result.data);
  });
}

module.exports = {
  sendPushNotification: sendPushNotification,
};
