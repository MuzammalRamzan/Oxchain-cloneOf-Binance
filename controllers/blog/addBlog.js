const User = require("../models/User");
const MailVerification = require("../models/MailVerification");
var authFile = require("../auth.js");
var mailer = require("../mailer.js");

const addBlog = async function (req, res) {
  var api_key_result = req.body.api_key;
  var title = req.body.title;
  var body = req.body.body;
  var writer = req.body.writer;
  var image = req.body.image;

  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    const newBlog = new Blog({
      title: title,
      body: body,
      writer: writer,
      image: image,
    });

    newBlog.save(function (err, result) {
      if (err) {
        res.json({ status: "fail", message: err });
      } else {
        res.json({ status: "success", data: "blog_added" });
      }
    });
  } else {
    res.json({ status: "fail", message: "403 Forbidden" });
  }
};

module.exports = addBlog;
