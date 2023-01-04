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


  let oneStepChecker = await OneStepWithdrawModel.findOne({
    user_id: userId,
  });

  let verified = false;

  let user = await UserModel.findOne({
    _id: userId,
  });

  if (!user) {
    return res.json({ status: "failed", message: "user_not_found" });
  }

  if (user.email != "" && user.email != undefined) {

    if (email == undefined || email == "" || email == null) {
      return res.json({ status: "failed", message: "verification_failed", showableMessage: "Mail pin is wrong" });
    }

    let mailVerification = await MailVerification.findOne({
      user_id: userId,
      reason: reason,
      pin: email,
      status: 0,
    });

    if (mailVerification) {
    }
    else {
      return res.json({ status: "failed", message: "verification_failed", showableMessage: "Mail pin is wrong" });
    }
  }

  if (user.phone_number != "" && user.phone_number != undefined) {

    if (phone == undefined || phone == "" || phone == null) {
      return res.json({ status: "failed", message: "verification_failed", showableMessage: "Phone pin is wrong" });
    }

    let smsVerification = await SMSVerification.findOne({
      user_id: userId,
      reason: reason,
      pin: phone,
      status: 0,
    });

    if (smsVerification) {

    }
    else {
      return res.json({ status: "failed", message: "verification_failed", showableMessage: "Phone pin is wrong" });
    }
  }


  if (!oneStepChecker) {
    let oneStep = new OneStepWithdrawModel({
      user_id: userId,
      maxAmount: maxAmount,
    });

    await oneStep.save();

  } else {

    await OneStepWithdrawModel.findOneAndUpdate(
      {
        user_id: userId,
      },
      {
        maxAmount: maxAmount,
      }
    )

  }

  return res.json({
    status: "success",
    message: "Updated Successfully!",
  });
};


module.exports = editOneStepWithdraw;
