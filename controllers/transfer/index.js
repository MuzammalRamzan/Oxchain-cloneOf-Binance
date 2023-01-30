const WalletModel = require("../../models/Wallet");
const MarginIsolatedWallet = require("../../models/MarginIsolatedWallet");
const MarginCrossWallet = require("../../models/MarginCrossWallet");
const FutureWalletModel = require("../../models/FutureWalletModel");
const TransactionsModel = require("../../models/Transactions");

var authFile = require("../../auth.js");

const transferWallet = async function (req, res) {
  let { user_id, amount, from, to, api_key } = req.body;

  const result = await authFile.apiKeyChecker(api_key);

  if (!result) return res.json({ status: "fail", message: "403 Forbidden" });

  if (!user_id || !amount || !from || !to) {
    return res.json({ status: "fail", message: "fill_all_blanks" });
  }

  const transaction = new TransactionsModel({
    user_id: user_id,
    type: "transfer",
    amount: amount,
  });

  

  if (from == "spot") {
    const wallet = await WalletModel.findOne({
      user_id: user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).lean();

    if (wallet.amount < amount) {
      return res.json({ status: "fail", message: "insufficient_balance" });
    }

    await WalletModel.updateOne(
      { user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" },
      { $inc: { amount: -amount } }
    );
  }

  if (from == "margin_isolated") {
    const wallet = await MarginIsolatedWallet.findOne({
      user_id: user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).lean();

    if (wallet.amount < amount) {
      return res.json({ status: "fail", message: "insufficient_balance" });
    }

    await MarginIsolatedWallet.updateOne(
      { user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" },
      { $inc: { amount: -amount } }
    );
  }

  if (from == "margin_cross") {
    const wallet = await MarginCrossWallet.findOne({
      user_id: user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).lean();

    if (wallet.amount < amount) {
      return res.json({ status: "fail", message: "insufficient_balance" });
    }

    await MarginCrossWallet.updateOne(
      { user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" },
      { $inc: { amount: -amount } }
    );
  }

  if (from == "future") {
    const wallet = await FutureWalletModel.findOne({
      user_id: user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).lean();

    if (wallet.amount < amount) {
      return res.json({ status: "fail", message: "insufficient_balance" });
    }

    await FutureWalletModel.updateOne(
      { user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" },
      { $inc: { amount: -amount } }
    );
  }

  if (to == "spot") {
    const wallet = await WalletModel.findOne({
      user_id: user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).lean();

    if (wallet) {
      await WalletModel.updateOne(
        { user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" },
        { $inc: { amount: amount } }
      );

      await transaction.save();

      return res.json({ status: "success", message: "transfer_success" });
    } else {
      res.json({ status: "fail", message: "wallet_not_found" });
    }
  }

  if (to == "margin_isolated") {
    const wallet = await MarginIsolatedWallet.findOne({
      user_id: user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).lean();

    if (wallet) {
      await MarginIsolatedWallet.updateOne(
        { user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" },
        { $inc: { amount: amount } }
      );

      await transaction.save();

      return res.json({ status: "success", message: "transfer_success" });
    } else {
      res.json({ status: "fail", message: "wallet_not_found" });
    }
  }

  if (to == "margin_cross") {
    const wallet = await MarginCrossWallet.findOne({
      user_id: user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    }).lean();

    if (wallet) {
      await MarginCrossWallet.updateOne(
        { user_id: user_id, coin_id: "62bc116eb65b02b777c97b3d" },
        { $inc: { amount: amount } }
      );

      await transaction.save();

      return res.json({ status: "success", message: "transfer_success" });
    } else {
      res.json({ status: "fail", message: "wallet_not_found" });
    }
  }

  if (to == "future") {
    const wallet = await FutureWalletModel.findOne({
      user_id: user_id,
      coin_id: "62ff3c742bebf06a81be98fd",
    }).lean();

    if (wallet) {
      await FutureWalletModel.updateOne(
        { user_id: user_id, coin_id: "62ff3c742bebf06a81be98fd" },
        { $inc: { amount: amount } }
      );
      await transaction.save();
      return res.json({ status: "success", message: "transfer_success" });
    } else {
      res.json({ status: "fail", message: "wallet_not_found" });
    }
  }
};

module.exports = transferWallet;
