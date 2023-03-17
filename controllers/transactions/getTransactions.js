const TransactionsModel = require("../../models/Transactions");
var authFile = require("../../auth.js");
const getTransactions = async function (req, res) {
  let { user_id, api_key, type, from, to, page, firstDate, endDate } = req.body;
  const recordsPerPage = 10;

  const result = await authFile.apiKeyChecker(api_key);

  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

  if (!user_id) {
    return res.json({ status: "fail", message: "fill_all_blanks" });
  }

  let query = { user_id };

  if (type) {
    query.type = type;
  }
  if (from) {
    query.from = from;
  }
  if (to) {
    query.to = to;
  }

  const totalRecords = await TransactionsModel.countDocuments(query);

  const totalPages = Math.ceil(totalRecords / recordsPerPage);

  let skipRecords = 0;
  if (page && page > 1) {
    skipRecords = (page - 1) * recordsPerPage;
  }

  if (firstDate && endDate) {
    query.createdAt = {
      $gte:firstDate,
      $lte: endDate,
    };
  }

  const transactions = await TransactionsModel.find(query)
    .sort({ createdAt: -1 })
    .skip(skipRecords)
    .limit(recordsPerPage)
    .lean();

  res.json({ status: "success", transactions, totalPages, currentPage: page });
};



module.exports = getTransactions;
