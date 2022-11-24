const WithdrawalWhiteListModel = require("../../models/WithdrawalWhiteList");

const editWithdrawalWhiteList = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const status = req.body.status;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  await WithdrawalWhiteListModel.updateOne({ user_id: userId }, { status });
  return res.json({ status: "success", message: "Updated Successfully!" });
};

module.exports = editWithdrawalWhiteList;