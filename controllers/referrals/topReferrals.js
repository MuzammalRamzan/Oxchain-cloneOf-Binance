const Referral = require("../../models/Referral");
var authFile = require("../../auth.js");
const topReferrals = async (req, res) => {
  let api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result == true) {

    //find the top reffer users on Referral model and sort them by the number of referrals they have
    let refCountData = await Referral.aggregate([
      {
        $group: {
          _id: "$reffer",
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          count: -1,
        },
      },
    ]);


    res.json({ status: "success", data: refCountData });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
}

module.exports = topReferrals;