
var authFile = require("../../auth.js");
const Orders = require("../../models/Orders.js");

const getOrders = async function (req, res) {

  const api_key_result = req.body.api_key;
  const { pair, direction, type, fromDate, toDate, status } = req.query;

  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) res.json({ status: "fail", message: "Forbidden 403" });

  let key = req.headers["key"];

  if (!key) {
    return res.json({ status: "fail", message: "key_not_found" });
  }

  if (!req.body.device_id || !req.body.user_id) {
    return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
  }

  let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


  if (checkKey === "expired") {
    return res.json({ status: "fail", message: "key_expired" });
  }

  if (!checkKey) {
    return res.json({ status: "fail", message: "invalid_key" });
  }

  const filter = { user_id: req.body.user_id };
  if (pair) filter.pair_name = pair;
  if (direction) filter.method = direction;
  if (type) filter.type = type;
  if (fromDate && toDate) filter.createdAt = { $gte: fromDate, $lte: toDate };
  if (status) filter.status = status;

  const orders = await Orders.find(filter).sort({ createdAt: -1 }).lean();

  res.json({ status: "success", data: orders });
};

module.exports = getOrders;
