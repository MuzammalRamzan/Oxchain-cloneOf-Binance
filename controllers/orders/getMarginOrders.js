const MarginOrder = require("../../models/MarginOrder");
var authFile = require("../../auth.js");

const getMarginOrders = async function (req, res) {
  const api_key_result = req.body.api_key;
  const { pair, direction, type, fromDate, toDate, status } = req.query;

  const result = await authFile.apiKeyChecker(api_key_result);
  if (!result) res.json({ status: "fail", message: "Forbidden 403" });

  const filter = { user_id: req.body.user_id };
  if (pair) filter.pair_name = pair;
  if (direction) filter.method = direction;
  if (type) filter.type = type;
  if (fromDate && toDate) filter.createdAt = { $gte: fromDate, $lte: toDate };
  if (status) filter.status = status;

  const orders = await MarginOrder.find(filter).sort({ createdAt: -1 }).lean();

  res.json({ status: "success", data: orders });
};

module.exports = getMarginOrders;
