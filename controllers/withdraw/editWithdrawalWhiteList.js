const WithdrawalWhiteListModel = require("../../models/WithdrawalWhiteList");
const authFile = require("../../auth.js");

const editWithdrawalWhiteList = async (req, res) => {
  const api_key = req.body.api_key;
  const user_id = req.body.user_id;

  const result = await authFile.apiKeyChecker(api_key);

  if (result === true) {

    const withdrawalWhiteList = await WithdrawalWhiteListModel.findOne({
      user_id: user_id,
    }).exec();

    if (withdrawalWhiteList != null) {

      const status = withdrawalWhiteList.status;
      let other = "";
      if (status == 0) {
        other = 1;
      } else {
        other = 0;
      }

      await WithdrawalWhiteListModel.findOneAndUpdate(
        { user_id: user_id },
        { status: other },
      );

      return res.json({ status: "success", message: "withdrawal_white_list_status_changed", showableMessage: "Withdrawal white list status changed" });

    }
    else {
      const newWithdrawalWhiteList = new WithdrawalWhiteListModel({
        user_id: user_id,
        status: 1,
      });

      if (newWithdrawalWhiteList.save()) {
        return res.json({ status: "success", message: "withdrawal_white_list_added", showableMessage: "Withdrawal white list enabled" });
      }
      else {
        return res.json({ status: "fail", message: "an_error_occured", showableMessage: "An error occured, please log in again" });
      }
    }
  } else {
    return res.json({ status: "fail", message: "api_key_invalid", showableMessage: "Api key is invalid" });
  }


};

module.exports = editWithdrawalWhiteList;