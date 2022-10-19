const CopyLeaderRequest = require("../models/CopyTradeLeaderRequest");
var authFile = require("../auth.js");

const copyLeaderRequest = async (req, res) => {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  let checkLeader = await CopyLeaderRequest.findOne({
    user_id: req.body.user_id,
  }).exec();

  const newLeaderRequest = new CopyLeaderRequest({
    user_id: req.body.user_id,
  });

  if (result === true) {
    if (checkLeader == null) {
      newLeaderRequest.save();
      res.json({ status: "success", data: null });
    } else {
      res.json({ status: "fail", message: "already_requested" });
    }
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = copyLeaderRequest;
