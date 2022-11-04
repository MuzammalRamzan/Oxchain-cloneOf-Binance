const Admin = require("../models/Admin");

var authFile = require("../auth.js");
const utilities = require("../utilities");
const Login = async (req, res) => {
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
  //burada email ve password ile giriş yapılacak

  var email = req.body.email;
  var password = req.body.password;

  if (email == null || password == null) {
    return res.json({
      status: "error",
      message: "Email or password is null",
    });
  }

  var admin = await Admin.findOne({
    email: email,
    password: utilities.hashData(password),
  });

  if (admin == null) {
    return res.json({
      status: "error",
      message: "Email or password is wrong",
    });
  }

  var id = admin._id;

  res.json({
    status: "success",
    message: "Login success",
    id: id,
  });
};

module.exports = Login;
