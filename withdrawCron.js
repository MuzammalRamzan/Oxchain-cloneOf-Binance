"use strict";
const mongoose = require("mongoose");
const Wallet = require("./models/Wallet");
require("dotenv").config();
const Connection = require('./Connection');

var mongodbPass = process.env.MONGO_DB_PASS;


main();
async function main() {
  try {
    await Connection.connection();
    let wallets = await Wallet.find({});
    
  } catch(err) {
    console.log(err);
    throw err;
  }
}
