const LoginLogs = require("../models/LoginLogs");
var authFile = require("../auth.js");

const lastActivities = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var limit = req.body.limit;
  authFile.apiKeyChecker(api_key_result).then(async function (result) {
    if (result === true) {
      if (limit <= 100) {
        var sort = { createdAt: -1 };
        var logs = await LoginLogs.find({ user_id: user_id })
          .sort(sort)
          .limit(limit)
          .exec();
        res.json({ status: "success", data: logs });
      } else {
        res.json({ status: "success", data: "max_limit_100", showableMessage: 'limit should be less then 100' });
      }
    }
  });
};

module.exports = lastActivities;
