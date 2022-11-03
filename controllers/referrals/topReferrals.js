const Referral = require("../../models/Referral");
var authFile = require("../../auth.js");
const topReferrals = async(req, res)  => {
    let api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result == true) {
    
    let referrals = await Referral.find({}).exec();
    let data = [];
    for (let i = 0; i < referrals.length; i++) {
      console.log(referrals[i]);

      console.log(referrals[i].reffer);
      let refCount = await Referral.find({
        reffer: referrals[i].reffer,
      }).exec();

      console.log("count: " + refCount.length);
      data.push({
        refCode: referrals[i].reffer,
        refCount: refCount.length,
      });
    }

    function removeDuplicates(originalArray, prop) {
      var newArray = [];
      var lookupObject = {};

      for (var i in originalArray) {
        lookupObject[originalArray[i][prop]] = originalArray[i];
      }

      for (i in lookupObject) {
        newArray.push(lookupObject[i]);
      }
      return newArray;
    }

    res.json({ status: "success", data: removeDuplicates(data, "refCode") });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
}

module.exports = topReferrals;