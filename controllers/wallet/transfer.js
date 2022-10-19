const Wallet = require("../../models/Wallet");

const transfer = async (req, res) => {
  var from = req.body.from;
  var to = req.body.to;
  var amount = req.body.amount;
  var getFromDetail = await Wallet.findOne({ coin_id: from }).exec();
  var getToDetail = await Wallet.findOne({ coin_id: to }).exec();
  if (getFromDetail.amount < amount) {
    res.json({ status: "fail", message: "insufficient_balance" });
    return;
  }

  let fromBalance = getFromDetail.amount - amount;
  let toBalance = getToDetail.amount + amount;

  await Wallet.findOneAndUpdate(
    { coin_id: getFromDetail._id },
    { amount: fromBalance }
  );
  await Wallet.findOneAndUpdate(
    { coin_id: getToDetail._id },
    { amount: toBalance }
  );

  res.json({ status: "success", data: { from: fromBalance, to: toBalance } });
};

module.exports = transfer;
