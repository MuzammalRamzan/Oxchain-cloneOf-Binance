const authFile = require("../../auth");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");
const UserModel = require("../../models/User");

const editOneStepWithdraw = async (req, res) => {
  const apiKey = req.body.api_key;
  const userId = req.body.user_id;
  const data = req.body.data;
  const maxAmount = req.body.maxAmount;

  const email = req.body.emailPin;
  const phone = req.body.phonePin;

  let reason = "oneStepWithdraw";
  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });

  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });


  let user = await UserModel.findOne({
    _id: userId,
  }).exec();

  if (!user) return res.json({ status: "error", message: "User not found" });
  let twofa = user.twofa;

  let oneStepChecker = await OneStepWithdrawModel.findOne({
    user_id: userId,
  });
  let verified = false;


  if (email != "" && email != undefined) {

    let mailVerification = await MailVerification.findOne({
      user_id: userId,
      reason: reason,
      pin: email,
      status: 0

    });
    if (mailVerification) {
      await MailVerification.findOneAndUpdate(mailVerification._id, {
        user_id: userId,
        reason: reason,
        pin: email,
        status: 1
      });
    }
    else {
      return res.json({ status: "failed", message: "verification_failed", showableMessage: "Mail pin is wrong" });
    }
  }

  if (phone != "" && phone != undefined) {

    let smsVerification = await SMSVerification.findOne({
      user_id: userId,
      reason: reason,
      pin: phone,
      status: 0
    });

    if (smsVerification) {
      await SMSVerification.findOneAndUpdate(smsVerification._id, {
        user_id: userId,
        reason: reason,
        pin: phone,
        status: 1
      });
    }
    else {
      return res.json({ status: "failed", message: "verification_failed", showableMessage: "Phone pin is wrong" });
    }
  }

  if (twofa != undefined && twofa != null && twofa != "") {

    if (req.body.twofapin == undefined || req.body.twofapin == null || req.body.twofapin == "") {
      return res.json({ status: "fail", message: "verification_failed, send 'twofapin'", showableMessage: "Wrong 2FA Pin" });
    }

    let resultt = await authFile.verifyToken(req.body.twofapin, twofa);

    if (resultt === false) {
      return res.json({ status: "fail", message: "verification_failed", showableMessage: "Wrong 2FA Pin" });
    }
  }

  if (!oneStepChecker) {
    let oneStep = new OneStepWithdrawModel({
      user_id: userId,
      maxAmount: maxAmount,
    });

    await oneStep.save();

  } else {

    if (req.body.status != undefined && req.body.status != null && req.body.status != "" && req.body.status != "null") {

      if (req.body.status == 0 || req.body.status == "0" || req.body.status == 1 || req.body.status == "1") {
        await OneStepWithdrawModel.findOneAndUpdate(
          {
            user_id: userId,
          },
          {
            status: req.body.status,
          }
        )
      }
      else {
        return res.json({ status: "failed", message: "status_is_wrong, send only 1 and 0", showableMessage: "Status is wrong" });
      }
    }
    else {
      await OneStepWithdrawModel.findOneAndUpdate(
        {
          user_id: userId,
        },
        {
          maxAmount: maxAmount,
        }
      )
    }
  }

  return res.json({
    status: "success",
    message: "Updated Successfully!",
  });
};


module.exports = editOneStepWithdraw;
