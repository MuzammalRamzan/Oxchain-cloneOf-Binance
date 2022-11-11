const User = require("../models/User");
const MailVerification = require("../models/MailVerification");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");

const getBlogs = async function (req, res) {
  var api_key_result = req.body.api_key;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    Blog.find({}, function (err, result) {
      if (err) {
        res.json({ status: "fail", message: err });
      } else {
        res.json({ status: "success", data: result });
      }
    });
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = getBlogs;
