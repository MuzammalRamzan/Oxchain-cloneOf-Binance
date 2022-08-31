"use strict";
const mongoose = require("mongoose");
const Wallet = require("./models/Wallet");
require("dotenv").config();


var mongodbPass = process.env.MONGO_DB_PASS;

var connection =
  "mongodb+srv://volkansaka:" +
  mongodbPass +
  "@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority";
mongoose.connect(connection, (e) => {
  if (e) {
    throw e;
  } else {
    main();
  }
});

async function main() {
  try {
    console.log(1);
    let wallets = await Wallet.find({});
    console.log(2);
    console.log(wallets);
  } catch(err) {
    console.log(err);
    throw err;
  }
}
