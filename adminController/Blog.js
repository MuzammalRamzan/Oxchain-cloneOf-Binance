const Admin = require("../models/Admin");

const Blogs = require("../models/Blogs");

var authFile = require("../auth.js");
var utilities = require("../utilities.js");

const deleteBlog = async (req, res) => {
  //api key kontrolü yapılacak

  var apiKey = req.body.apiKey;

  if (apiKey == null) {
    return res.json({
      status: "error",
      message: "Api key is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var blog_id = req.body.blog_id;

  if (blog_id == null) {
    return res.json({
      status: "error",
      message: "Blog id is null",
    });
  }

  var blog = await Blogs.findOne({ _id: blog_id });

  if (blog == null) {
    return res.json({
      status: "error",
      message: "Blog is not found",
    });
  }

  //blog statusu 0 olacak

  await Blogs.findOneAndUpdate({ _id: blog_id }, { status: 0 });

  res.json({
    status: "success",
    message: "Blog is deleted",
  });
};

const editBlog = async (req, res) => {
  //api key kontrolü yapılacak

  var apiKey = req.body.apiKey;

  if (apiKey == null) {
    return res.json({
      status: "error",
      message: "Api key is null",
    });
  }

  var apiKeyControl = await authFile.apiKeyChecker(apiKey);

  if (apiKeyControl == false) {
    return res.json({
      status: "error",
      message: "Api key is wrong",
    });
  }

  var blog_id = req.body.blog_id;

  if (blog_id == null) {
    return res.json({
      status: "error",
      message: "Blog id is null",
    });
  }

  var blog = await Blogs.findOne({ _id: blog_id });

  if (blog == null) {
    return res.json({
      status: "error",
      message: "Blog is not found",
    });
  }

  var title = req.body.title;
  var body = req.body.body;
  var writer = req.body.writer;
  var image = req.body.image;

  if (title == null || body == null || writer == null || image == null) {
    return res.json({
      status: "error",
      message: "Blog information is null",
    });
  }

  await Blogs.findOneAndUpdate(
    { _id: blog_id },
    { title: title, body: body, writer: writer, image: image }
  );

  res.json({
    status: "success",
    message: "Blog is edited",
  });
};

module.exports = deleteBlog;
