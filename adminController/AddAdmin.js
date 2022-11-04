const Admin = require("../models/Admin");

var authFile = require("../auth.js");
var utilities = require("../utilities.js");

const AddAdmin = async (req, res) => {
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

  var name = req.body.name;
  var email = req.body.email;
  var password = req.body.password;
  var phone = req.body.phone;

  if (name == null || email == null || password == null || phone == null) {
    return res.json({
      status: "error",
      message: "Name, email, password or phone is null",
    });
  }

  var admin = await Admin.findOne({ email: email });

  if (admin != null) {
    return res.json({
      status: "error",
      message: "Email is already exist",
    });
  }

  //şifreyi hashliyoruz

  var admin = new Admin({
    name: name,
    email: email,
    password: utilities.hashData(password),
    phone: phone,
  });

  await admin.save();

  res.json({
    status: "success",
    message: "Admin added",
  });
};

module.exports = AddAdmin;
