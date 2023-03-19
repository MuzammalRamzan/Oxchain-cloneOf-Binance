var authenticator = require("authenticator");
const jwt = require("jsonwebtoken");
const Device = require("./models/Device");

function apiKeyChecker(api_key_data) {
  return new Promise((resolve) => {
    if (api_key_data === process.env.API_KEY) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

function verifyToken(pin, twofa) {
  var formattedToken = authenticator.generateToken(twofa);
  return new Promise((resolve) => {
    console.log("pin: " + pin);
    console.log(formattedToken);
    if (pin === formattedToken) {
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

async function verifyKey(key, device_id, user_id) {

  let checkDevice = await Device.findOne(
    {
      deviceId: device_id,
      user_id: user_id,
      key: key,
    }
  ).exec();

  //check if time is expired, it expires after 4 hours

  return new Promise(async (resolve) => {

    if (checkDevice) {
      let currentTime = new Date().getTime();
      let timeDiff = currentTime - checkDevice.time;
      let hours = timeDiff / (1000 * 3600);

      let minutes = timeDiff / (1000 * 60);

      if (minutes > 30) {
        resolve("expired");
      }

      //reset the device time to current time
      checkDevice.time = currentTime;
      await checkDevice.save();
      resolve(true);
    } else {
      resolve(false);
    }
  });
}

const getToken = (user) => {
  return jwt.sign(user, 'secret');
};

module.exports = {
  apiKeyChecker: apiKeyChecker,
  verifyToken: verifyToken,
  getToken,
  verifyKey: verifyKey,
};
