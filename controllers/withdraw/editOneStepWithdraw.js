const authFile = require("../../auth");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");
const SMSVerification = require("../../models/SMSVerification");
const MailVerification = require("../../models/MailVerification");

const editOneStepWithdraw = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const data = req.body.data;
  const maxAmount = data.maxAmount;

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
      verified = true;
    }
    else {
      verified = false;
    }
  }

  if (phone != "" && phone != undefined) {

    let smsVerification = await SMSVerification.findOne({
      user_id: userId,
      reason: reason,
      pin: phone,
    });

    if (smsVerification) {
      verified = true;
    }
    else {
      verified = false;
    }
  }

  if (verified == false) return res.json({ status: "error", message: "Pin is wrong" });

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
