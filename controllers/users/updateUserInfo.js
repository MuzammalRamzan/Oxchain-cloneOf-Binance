const User = require("../../models/User");
const RegisterMail = require("../../models/RegisterMail");
var authFile = require("../../auth.js");

const updateUserInfo = async function (req, res) {
  
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var name = req.body.name;
  var surname = req.body.surname;
  var email = req.body.email;
  var country_code = req.body.country_code;
  var phone_number = req.body.phone_number;
  var city = req.body.city;
  var country = req.body.country;
  var address = req.body.address;

  var api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    let user = await User.findOne({
      _id: user_id,
      status: 1,
    }).exec();

    var result2 = "";
    if (user != null) {
      var twofa = user["twofa"];
      if (twofa != null) {
        result2 = await authFile.verifyToken(twofapin, twofa);
      } else {
        var email = user["email"];
        let check = await RegisterMail.findOne({
          email: email,
          pin: twofapin,
        }).exec();

        if (check != null) {
          result2 = true;
        }
      }

      if (result2 === true) {
        const filter = { _id: user_id, status: 1 };
        const update = {
          name: name,
          surname: surname,
          email: email,
          country_code: country_code,
          phone_number: phone_number,
          city: city,
          country: country,
          address: address,
        };
        User.findOneAndUpdate(filter, update, (err, doc) => {
          if (err) {
            res.json({ status: "fail", message: err });
          } else {
            res.json({ status: "success", data: "update_success" });
          }
        });
      } else {
        res.json({ status: "fail", message: "2fa_failed", showableMessage: "2FA Failed" });
      }
    } else {
      res.json({ status: "fail", message: "user_not_found", showableMessage: "User not Found" });
    }
  } else {
    res.json({ status: "fail", message: "403 Forbidden", showableMessage: "403 Forbidden" });
  }
};

module.exports = updateUserInfo;
