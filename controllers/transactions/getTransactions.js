const TransactionsModel = require("../models/transactions");

const getTransactions = async function (req, res) {
  let { user_id, api_key } = req.body;

  const result = await authFile.apiKeyChecker(api_key);

  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

  if (!user_id) {
    return res.json({ status: "fail", message: "fill_all_blanks" });
  }

  const transactions = await TransactionsModel.find({
    user_id: user_id,
  }).lean();

  res.json({ status: "success", transactions: transactions });
};

module.exports = getTransactions;
