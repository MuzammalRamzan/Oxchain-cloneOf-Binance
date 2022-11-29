const authFile = require("../../auth");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");

const editOneStepWithdraw = async (req, res) => {
  const apiKey = req.body.apiKey;
  const userId = req.body.userId;
  const data = req.body.data;

  if (!apiKey) return res.json({ status: "error", message: "Api key is null" });
  const apiKeyCheck = await authFile.apiKeyChecker(apiKey);
  if (!apiKeyCheck)
    return res.json({ status: "error", message: "Api key is wrong" });

  await OneStepWithdrawModel.updateOne({ user_id: userId }, data, {
    upsert: true,
  });
  return res.json({
    status: "success",
    data,
    message: "Updated Successfully!",
  });
};

module.exports = editOneStepWithdraw;
