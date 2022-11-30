const FutureOrderModel = require("./models/FutureOrder");
const Connection = require("./Connection");
const PairsModel = require("./models/Pairs");
const FutureWalletModel = require("./models/FutureWalletModel");
const TransactionModel = require("./models/Transactions");
var bodyParser = require("body-parser");
const multer = require("multer");
const express = require("express");
var cors = require("cors");
require("dotenv").config();
const axios = require("axios");

Connection.connection();

async function Calculate() {
  const orders = await FutureOrderModel.find({
    method: "market",
    status: "0",
  }).exec();
  let percentageArray = [];

  const PairData = await PairsModel.find({
    status: 1,
  }).exec();
  for (let x = 0; x < PairData.length; x++) {
    if (PairData[x].name == "Tether" || PairData[x].name == "Margin") {
      continue;
    }
    let pair = PairData[x].name.replace("/", "");
    let binanceData = await axios.get(
      "https://api.binance.com/api/v3/klines?symbol=" +
        pair +
        "&interval=1h&limit=8"
    );

    let price8HoursAgo = binanceData.data[0][4];

    let priceNow = binanceData.data[7][4];

    let changeInPrice = priceNow - price8HoursAgo;
    let percentageChange = (changeInPrice / price8HoursAgo) * 100;

    percentageArray[PairData[x].name] = percentageChange;
  }

  let userZararArray = [];
  let userKarArray = [];

  let komisyon = "";
  let bolunecekKisi = 0;
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].type == "sell") {
      let pair = orders[i].pair_name;
      let pnl = orders[i].pnl;
      let amount = orders[i].usedUSDT;
      let percentage = (pnl / amount) * 100;
      let percentageData = percentageArray[pair];
      if (percentageData > 0) {
        // zarar etmiş
        bolunecekKisi = bolunecekKisi + 1;
        userZararArray.push(orders[i].user_id);
      } else {
        if (amount * percentageData * 0.00075 < 0) {
          komisyon += amount * percentageData * 0.00075 * -1;
        } else {
          komisyon += amount * percentageData * 0.00075;
        }
        userKarArray.push(orders[i].user_id);
        // kar etmiş
      }
    } else {
      let pair = orders[i].pair_name;
      let percentageData = percentageArray[pair];
      let pnl = orders[i].pnl;
      let amount = orders[i].usedUSDT;
      let percentage = (pnl / amount) * 100;

      if (percentageData > 0) {
        // kar etmiş
        if (amount * percentageData * 0.00075 < 0) {
          komisyon += amount * percentageData * 0.00075 * -1;
        } else {
          komisyon += amount * percentageData * 0.00075;
        }
        userKarArray.push(orders[i].user_id);
      } else {
        bolunecekKisi = bolunecekKisi + 1;
        // zarar etmiş
        userZararArray.push(orders[i].user_id);
      }
    }
  }

  //get percentageData elements which are greater than 0

  console.log(
    "Bölünecek kişi: " +
      bolunecekKisi +
      " Total Komisyon: " +
      komisyon +
      " Alacağı Komisyon: " +
      komisyon / bolunecekKisi
  );

  console.log("Zarar Edenler: " + userZararArray);
  console.log("Kar Edenler: " + userKarArray);

  for (let i = 0; i < userZararArray.length; i++) {
    let user_id = userZararArray[i];
    let wallet = await FutureWalletModel.findOne({
      user_id: user_id,
    }).exec();
    let amount = wallet.amount;
    let newAmount = amount + komisyon / bolunecekKisi;
    wallet.amount = newAmount;
    console.log(newAmount);
    //save edilecek

    let transaction = new TransactionModel({
      user_id: user_id,
      amount: (komisyon / bolunecekKisi) * -1,
      type: "commission",
    });

    await transaction.save();
  }

  for (let i = 0; i < userKarArray.length; i++) {
    let user_id = userKarArray[i];
    let wallet = await FutureWalletModel.findOne({
      user_id: user_id,
    }).exec();
    let amount = wallet.amount;
    let newAmount = amount - komisyon / bolunecekKisi;
    wallet.amount = newAmount;
    console.log(newAmount);
    //save edilecek

    let transaction = new TransactionModel({
      user_id: user_id,
      amount: komisyon / bolunecekKisi,
      type: "commission",
    });

    await transaction.save();
  }
}

Calculate();
