var authFile = require("../../auth.js");
const MarginOrder = require("../../models/MarginOrder");

const getClosedMarginOrders = async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);
  if (result !== true) {
    res.json({ status: "fail", message: "Forbidden 403" });
    return;
  }

  let orders = await MarginOrder.find({
    user_id: req.body.user_id,
    status: 1,
  }).exec();

  res.json({ status: "success", data: orders });
};

module.exports = getClosedMarginOrders;
