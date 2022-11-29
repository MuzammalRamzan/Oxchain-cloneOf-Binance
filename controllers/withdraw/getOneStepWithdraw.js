const authFile = require("../../auth");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");

const getOneStepWithdraw = async function (req, res) {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  const data = await OneStepWithdrawModel.findOne({ user_id: userId });
  return res.json({ status: "success", data });
};

module.exports = getOneStepWithdraw;
