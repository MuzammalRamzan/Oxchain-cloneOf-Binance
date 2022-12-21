const UserModel = require('../../models/User');

var authFile = require('../../auth');

const removeEmail = async (req, res) => {

  let user_id = req.body.user_id;
  let api_key = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key);

  if (result == true) {

    if (user_id == null || user_id == "") {
      return res.json({ status: "error", message: "user_id is null" });
    }

    let user = await UserModel.findOne(
      {
        _id: user_id
      }
    );

    if (user == null) {
      return res.json({ status: "error", message: "user is null" });
    }
    else {
      if (user.phone_number == null || user.phone_number == "") {
        return res.json({ status: "error", message: "user phone is null", showableMessage: "You can't remove your email before adding phone number" });
      }
      else {
        user.email = null;
        user.save();
        return res.json({ status: "success", message: "email removed", showableMessage: "Email removed" });
      }
    }

  }
  else {
    res.json("error");
  }

};

module.exports = removeEmail;