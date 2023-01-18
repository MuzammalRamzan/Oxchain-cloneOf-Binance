const authFile = require("../../auth");
const OneStepWithdrawModel = require("../../models/OneStepWithdraw");

const getOneStepWithdraw = async function (req, res) {

  let user_id = req.body.user_id;
  let api_key = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key);

  if (result == true) {
    let oneStepWithdraw = await OneStepWithdrawModel.findOne({
      user_id: user_id,
    }).exec();
    if (oneStepWithdraw != null) {
      res.json({
        status: "success",
        message: "one step withdraw found",
        oneStepWithdraw: oneStepWithdraw,
      });
    }
    else {
      res.json({
        status: "fail",
        message: "one step withdraw not found",
      });
    }
  }
  else {
    res.json("error");
  }

};

module.exports = getOneStepWithdraw;
