const Orders = require("../../models/Orders");
var authFile = require("../../auth.js");

const getOrders = async function (req, res) {
  var api_key_result = req.body.api_key;
  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {
    var list = [];
    if (req.body.filter) {
      list = await Orders.find({
        user_id: req.body.user_id,
        type: req.body.filter,
        status: "0",
      })
        .sort({ createdAt: -1 })
        .exec();
    } else {
      list = await Orders.find({
        user_id: req.body.user_id,
        status: "0",
      })
        .sort({ createdAt: -1 })
        .exec();
    }

    res.json({ status: "success", data: list });
  } else {
    res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = getOrders;
