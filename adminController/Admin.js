const Admin = require("../models/Admin");
const authFile = require("../auth.js");
const utilities = require("../utilities.js");

const addAdmin = async (req, res) => {
  //api key kontrolü yapılacak

  var apiKey = req.body.api_key;

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
  console.log("admin", admin)
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
  console.log("admin", admin)

  await admin.save();

  res.json({
    status: "success",
    message: "Admin added",
  });
};

const editAdmin = async (req, res) => {
  const apiKey = req.body.apiKey;
  const adminId = req.body.adminId;
  const name = req.body.name;
  const email = req.body.email;
  const password = req.body.password;
  const phone = req.body.phone;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const data = {};
  if (name) data.name = name;
  if (email) data.email = email;
  if (password) data.password = utilities.hashData(password);
  if (phone) data.phone = phone;

  await Admin.updateOne({ _id: adminId }, data);
  return res.json({ status: "success", message: "Admin updated" });
};

const getAdmin = async (req, res) => {
  const apiKey = req.body.apiKey;
  const adminId = req.body.adminId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const admin = await Admin.findOne({ _id: adminId }).lean();
  if (!admin) return res.json({ status: "error", message: "admin not found" });
  return res.json({ status: "success", data: admin });
};

const listAdmin = async (req, res) => {
  const apiKey = req.body.apiKey;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const adminUsers = await Admin.find().lean();
  return res.json({ status: "success", data: adminUsers });
};

module.exports = { addAdmin, editAdmin, getAdmin, listAdmin };
