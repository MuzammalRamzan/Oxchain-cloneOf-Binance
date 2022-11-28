const FutureOrderModel = require("./models/FutureOrder");
const Connection = require("./Connection");
const PairsModel = require("./models/Pairs");
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

  for (let i = 0; i < orders.length; i++) {
    if (orders[i].type == "sell") {
      let pair = orders[i].pair_name;
      let percentageData = percentageArray[pair];
      if (percentageData > 0) {
        // zarar etmiş
      } else {
        // kar etmiş
      }
      let pnl = orders[i].pnl;
      let amount = orders[i].usedUSDT;
      let percentage = (pnl / amount) * 100;
      console.log("Satış: " + percentage);
    } else {
      let pair = orders[i].pair_name;
      let percentageData = percentageArray[pair];
      if (percentageData > 0) {
        // kar etmiş
      } else {
        // zarar etmiş
      }
      let pnl = orders[i].pnl;
      let amount = orders[i].usedUSDT;
      let percentage = (pnl / amount) * 100;
      console.log("Alış: " + percentage);
    }
  }
}

Calculate();
