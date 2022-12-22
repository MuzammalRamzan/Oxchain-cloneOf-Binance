const authFile = require("../../auth");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");

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
  if (email != "" && email != undefined) {

    let mailVerification = await MailVerification.findOne({
      user_id: userId,
      reason: reason,
      pin: email,
    });

    if (mailVerification) {
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
