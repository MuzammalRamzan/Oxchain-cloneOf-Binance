const LoginLogs = require("../models/LoginLogs");
var authFile = require("../auth.js");

const lastActivities = async function (req, res) {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var limit = req.body.limit;
  const date = req.body.date;
  const status = req.body.status;
  authFile.apiKeyChecker(api_key_result).then(async function (result) {
    if (result === true) {

      let key = req.headers["key"];

      if (!key) {
        return res.json({ status: "fail", message: "key_not_found" });
      }

      if (!req.body.device_id || !req.body.user_id) {
        return res.json({ status: "fail", message: "invalid_params" });
      }

      let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


      if (checkKey === "expired") {
        return res.json({ status: "fail", message: "key_expired" });
      }

      if (!checkKey) {
        return res.json({ status: "fail", message: "invalid_key" });
      }

      if (limit <= 100) {
        var sort = { createdAt: -1 };
        const query = { user_id: user_id };
        if (date) query.createdAt = { $gt: date }
        if (status) query.status = status;
        var logs = await LoginLogs.find(query)
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
