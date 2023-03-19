const TransactionsModel = require("../../models/Transactions");
var authFile = require("../../auth.js");
const getTransactions = async function (req, res) {
  let { user_id, api_key, type, from, to, page, firstDate, endDate } = req.body;
  const recordsPerPage = 10;

  const result = await authFile.apiKeyChecker(api_key);

  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

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
      $gte: firstDate,
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
