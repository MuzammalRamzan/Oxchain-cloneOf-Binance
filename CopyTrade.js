const { createHash } = require("crypto");
const Deposits = require("./models/Deposits");
const NotificationTokens = require("./models/NotificationTokens");
var notifications = require("./notifications.js");
const Wallet = require("./models/Wallet");

function test() {
  return "yes";
}

module.exports = {
  test: test,
};
