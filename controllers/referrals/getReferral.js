const User = require("../../models/User");
const Referral = require("../../models/Referral");
var authFile = require("../../auth.js");

function parseUsers(ref_user, user_table) {
  console.log(user_table);
  return new Promise((resolve) => {
    let parsedUsers = [];
    for (let i = 0; i < ref_user.length; i++) {
      let a = ref_user[i].toObject();
      a.name = user_table.filter((amount) => amount._id == a.user_id)["name"];
      a.surname = user_table.filter((amount) => amount._id == a.user_id)[
        "surname"
      ];

      parsedUsers.push(a);
    }

    resolve(parsedUsers);
  });
}

const getReferral = async function (req, res) {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;
  var refCode = req.body.refCode;
  var results = [];
  var result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var ref_user = await Referral.find({ reffer: refCode }).exec();

    if (ref_user != null) {
      for (let i = 0; i < ref_user.length; i++) {
        var user_table = await User.find({
          user_id: ref_user[i].user_id,
        });
      }
      var result = await parseUsers(ref_user, user_table);
      res.json({ status: "success", data: result });
    } else {
      res.json({ status: "fail", message: "not_found" });
    }
  }
};

module.exports = getReferral;
