const TransactionsModel = require("../../models/Transactions");
var authFile = require("../../auth.js");

const getTransactions = async function (req, res) {
  let { user_id, api_key, type } = req.body;

  const result = await authFile.apiKeyChecker(api_key);

  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

  if (!user_id) {
    return res.json({ status: "fail", message: "fill_all_blanks" });
  }

  let query = { user_id };

  if (type) {
    query.type = type;
  }

  const transactions = await TransactionsModel.find(query).lean();

  res.json({ status: "success", transactions });
};

module.exports = getTransactions;
