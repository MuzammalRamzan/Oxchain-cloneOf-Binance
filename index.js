"use strict";
var authenticator = require("authenticator");
const User = require("./models/Test");
const Wallet = require("./models/Wallet");
const CoinList = require("./models/CoinList");
var uniqueValidator = require("mongoose-unique-validator");
const Referral = require("./models/Referral");
const UserRef = require("./models/UserRef");
const Pairs = require("./models/Pairs");
const Orders = require("./models/Orders");

//var formattedKey = authenticator.generateKey();
//var formattedToken = authenticator.generateToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse");
//console.log(authenticator.verifyToken("npbi sddb h5m3 24w2 i4dz 2mta hx3j pmse", "260180"));
//console.log(formattedToken);

const express = require("express");
var route = express();
const mongoose = require("mongoose");
const delay = (duration) => {
  return new Promise((resolve) => setTimeout(resolve, duration));
};
const { createHash } = require("crypto");

mongoose.connect(
  "mongodb+srv://volkansaka:NiCdH4TX4Dv7fwwb@cluster0.d1oo7iq.mongodb.net/?retryWrites=true&w=majority",
  (e) => {
    if (e) {
      console.log(e);
    } else {
      console.log("connected");
    }
  }
);

var cors = require("cors");
route.use(cors());

var port = 9595;
var bodyParser = require("body-parser");

var mysql = require("mysql");

var pool = mysql.createPool({
  connectionLimit: 10,
  host: "31.7.36.12",
  user: "dersbull_vas",
  password: "hfy*DW2XX&r$",
  database: "dersbull_nodetest",
});

var api_key = "asdasd";

const multer = require("multer");
const { Console } = require("console");
const { exit } = require("process");
const upload = multer();
route.use(bodyParser.json());
route.use(bodyParser.urlencoded());
route.use(bodyParser.urlencoded({ extended: true }));

route.get("/", (req, res) => {
  res.send("success");
});

function hashData(string) {
  return createHash("sha256").update(string).digest("hex");
}

function makeId(length) {
  var result = "";
  var characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
}

route.all("/login", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    User.findOne({
      email: req.body.email,
      password: hashData(req.body.password),
    })
      .then((user) => {
        if (user != null) {
          var twofaStatus = user["twofa"];
          var results = [];
          var refId = "";
          UserRef.findOne({
            user_id: user._id,
          })
            .then((userRef) => {
              console.log(userRef["refCode"]);
              refId = userRef["refCode"];
              results.push({
                status: user["status"],
                response: "success",
                twofa: twofaStatus,
                status: user["status"],
                user_id: user["_id"],
                ref_id: refId,
              });
            })
            .catch((e) => {
              console.log(e);
            });

          console.log(results);
          var status = user["status"];

          if (status == 1) {
            CoinList.find({})
              .then((coins) => {
                console.log(coins.length);
                for (let i = 0; i < coins.length; i++) {
                  const newWallet = new Wallet({
                    name: coins[i]["name"],
                    symbol: coins[i]["symbol"],
                    user_id: user["id"],
                    amount: 0,
                    coin_id: coins[i]["id"],
                    type: "spot",
                    address: "",
                    status: 1,
                  });

                  Wallet.findOne({
                    user_id: user["_id"],
                    coin_id: coins[i]["id"],
                  })
                    .then((wallets) => {
                      if (wallets == null) {
                        newWallet.save();
                        console.log("wallet added");
                      } else {
                        console.log("wallet already exists");
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
                res.json(results);
              })
              .catch((err) => {
                console.log("2  *** " + err);
              });
          }

          if (status == 0) {
            res.json("account_not_active");
          }
        } else {
          res.json("login_failed");
        }
      })
      .catch((err) => {
        console.log("3   ***  " + err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/register", upload.none(), (req, res) => {
  var emailUnique = "true";
  var phoneUnique = "true";
  var refStatus = "false";
  var reffer = req.body.reffer;
  if (reffer) {
    refStatus = "yes";
  } else {
    refStatus = "no";
  }
  const newUser = new User({
    name: req.body.name,
    surname: req.body.surname,
    email: req.body.email,
    country_code: req.body.country_code,
    phone_number: req.body.phone_number,
    birthday: req.body.birthday,
    birth_place: req.body.birth_place,
    city: req.body.city,
    country: req.body.country,
    address: req.body.address,
    id_type: req.body.id_type,
    id_number: req.body.id_number,
    password: hashData(req.body.password),
    api_key_result: req.body.api_key,
  });

  function uniqueChecker() {
    User.findOne({ email: req.body.email })
      .then((products) => {
        if (products != null) {
          emailUnique = "false";
        }
      })
      .catch((err) => {
        res.json(err);
      });

    User.findOne({ phone_number: req.body.phone_number })
      .then((products) => {
        if (products != null) {
          phoneUnique = "false";
        }
      })
      .catch((err) => {
        res.json(err);
      });
  }
  function register() {
    if (emailUnique == "true" && phoneUnique == "true") {
      newUser.save((err, usr) => {
        if (refStatus == "yes") {
          UserRef.findOne({ refCode: reffer }).then((user) => {
            if (user != null) {
              var newReferral = new Referral({
                user_id: usr._id,
                reffer: reffer,
              });
              newReferral.save();
            } else {
              res.json("referral_not_found");
            }
          });
        }
        var regUserId = usr._id;
        // make unique control
        var refCode = makeId(10);
        const newRef = new UserRef({
          user_id: regUserId,
          refCode: refCode,
        });
        newRef.save();
      });
      res.json("success");
    } else {
      var uniqueArray = [];
      uniqueArray.push({
        emailUnique: emailUnique,
        phoneUnique: phoneUnique,
        response: "not_unique",
      });
      res.json(uniqueArray[0]);
    }
  }

  const uniqueCheck = async () => {
    uniqueChecker();
    await delay(1000); // Delay 2s
    register();
  };

  uniqueCheck();
});

route.all("/addCoin", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;

  const newCoin = new CoinList({
    name: req.body.name,
    symbol: req.body.symbol,
    network: req.body.network,
    contract_address: req.body.contract_address,
    image_url: req.body.image_url,
  });

  if (api_key_result == api_key) {
    newCoin.save();
    res.json("success");
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/addOrders", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;

  const orders = new Orders({
    pair_id: req.body.pair_id,
    second_pair: "62bc116eb65b02b777c97b3d",
    pair_name: req.body.pair_name,
    type: req.body.type,
    user_id: req.body.user_id,
    amount: req.body.amount,
    priceAmount: req.body.priceAmount,
    method: req.body.method,
    target_price: req.body.target_price,
  });

  if (api_key_result == api_key) {
    const axios = require("axios");

    var urlPair = req.body.pair_name.replace("/", "");
    axios
      .get(
        'https://api.binance.com/api/v3/ticker/price?symbols=["' +
          urlPair +
          '"]'
      )
      .then((result) => {
        var price = result.data[0].price;
        Wallet.findOne(
          { user_id: req.body.user_id, coin_id: "62bc116eb65b02b777c97b3d" },
          { amount: 1 }
        )
          .then((list) => {
            if (list != null) {
              if (req.body.type == "Limit") {
                if (
                  parseFloat(list.amount) >=
                  parseFloat(req.body.amount * req.body.target_price)
                ) {
                  orders.save();
                  const filter = {
                    user_id: req.body.user_id,
                    coin_id: "62bc116eb65b02b777c97b3d",
                  };
                  const update = {
                    amount:
                      parseFloat(list.amount) -
                      parseFloat(req.body.amount * req.body.target_price),
                  };

                  Wallet.findOneAndUpdate(filter, update, (err, doc) => {
                    if (err) {
                      console.log(err);
                      res.json("error");
                    } else {
                      res.json("success");
                    }
                  });
                } else {
                  res.json("not_enough_balance");
                }
              } else {
                if (
                  parseFloat(list.amount) >= parseFloat(req.body.amount * price)
                ) {
                  console.log("ücret " + req.body.amount * price);
                  console.log("bakiye " + list.amount);
                  orders.save();
                  const filter = {
                    user_id: req.body.user_id,
                    coin_id: "62bc116eb65b02b777c97b3d",
                  };
                  const update = {
                    amount:
                      parseFloat(list.amount) -
                      parseFloat(req.body.amount * price),
                  };

                  Wallet.findOneAndUpdate(filter, update, (err, doc) => {
                    if (err) {
                      console.log(err);
                      res.json("error");
                    } else {
                      res.json("success");
                    }
                  });
                } else {
                  res.json("not_enough_balance");
                }
              }
            } else {
              res.json("second_pair_not_found");
            }
          })
          .catch((err) => {
            console.log(err);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getOrders", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  if (api_key_result == api_key) {
    Orders.find({ user_id: req.body.user_id, type: "Limit", status: "0" })
      .sort({ createdAt: -1 })
      .then((list) => {
        res.json(list);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getUSDTBalance", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  if (api_key_result == api_key) {
    Wallet.findOne({
      user_id: req.body.user_id,
      coin_id: "62bc116eb65b02b777c97b3d",
    })
      .then((list) => {
        res.json(list.amount);
      })
      .catch((err) => {
        res.json("error");
        console.log(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getPairs", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  if (api_key_result == api_key) {
    Pairs.find({})
      .then((list) => {
        res.json(list);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/addPair", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  if (api_key_result == api_key) {
    const newPair = new Pairs({
      name: req.body.name,
      symbolOne: req.body.symbolOne,
      symbolTwo: req.body.symbolTwo,
      digits: req.body.digits,
      type: req.body.type,
      symbolOneID: req.body.symbolOneID,
      symbolTwoID: req.body.symbolTwoID,
    });

    newPair.save();
    res.json("success");
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getDigits", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  var pairName = req.body.pairName;
  if (api_key_result == api_key) {
    Pairs.findOne({ name: pairName }, { digits: 1, _id: 1 })
      .then((list) => {
        res.json(list);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getCoinList", upload.none(), async (req, res) => {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;

  if (api_key_result == api_key) {
    CoinList.find({})
      .then(async (coins) => {
        console.log(coins.length);
        let amounst = await Wallet.find({ user_id: user_id });
        let result = await parseCoins(coins, amounst);
        res.json(result);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

function parseCoins(coins, amounts) {
  return new Promise((resolve) => {
    let parsedCoins = [];

    for (let i = 0; i < coins.length; i++) {
      let a = coins[i].toObject();
      a.balance = amounts.filter((amount) => amount.coin_id == a._id)[0].amount;
      parsedCoins.push(a);
    }
    resolve(parsedCoins);
  });
}

function parseUsers(ref_user, user_table) {
  return new Promise((resolve) => {
    let parsedUsers = [];
    for (let i = 0; i < ref_user.length; i++) {
      let a = ref_user[i].toObject();
      a.name = user_table.filter((amount) => amount._id == a.user_id)[0][
        "name"
      ];
      a.surname = user_table.filter((amount) => amount._id == a.user_id)[0][
        "surname"
      ];

      parsedUsers.push(a);
    }

    resolve(parsedUsers);
  });
}

route.all("/getCoinInfo", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    CoinList.findOne({ coin_id: req.body.coin_id })
      .then((coins) => {
        res.json(coins);
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getReferral", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;
  var refCode = req.body.refCode;
  var results = [];
  if (api_key_result == api_key) {
    Referral.find({ reffer: refCode })
      .then(async (ref_user) => {
        if (ref_user != null) {
          for (let i = 0; i < ref_user.length; i++) {
            var user_table = await User.find({ user_id: ref_user[i].user_id });
          }
          var result = await parseUsers(ref_user, user_table);

          console.log(result);
          res.json(result);
        } else {
          res.json("not_found");
        }
      })
      .catch((err) => {
        res.json(err);
      });
  }
});

route.all("/getWallet", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  if (api_key_result == api_key) {
    Wallet.find({ user_id: req.body.user_id })
      .then((wallets) => {
        res.json(wallets);
      })
      .catch((err) => {
        res.json(err);
      });
  }
});

route.all("/2fa", upload.none(), (req, res) => {
  var twofapin = req.body.twofapin;
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  if (api_key_result == api_key) {
    User.findOne({
      id: user_id,
    })
      .then((user) => {
        if (user != null) {
          var twofa = user["twofa"];

          var formattedToken = authenticator.generateToken(twofa);
          console;
          if (twofapin == formattedToken) {
            res.json("2fa_success");
          } else {
            res.json("2fa_failed");
          }
        } else {
          res.json("login_failed");
        }
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/update2fa", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var twofa = req.body.twofa;
  var twofapin = req.body.twofapin;
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    const filter = { id: user_id };
    const update = { twofa: twofa };

    var formattedToken = authenticator.generateToken(twofa);
    if (formattedToken === twofapin) {
      User.findOneAndUpdate(filter, update, (err, doc) => {
        if (err) {
          console.log(err);
          res.json("error");
        } else {
          res.json("2fa_updated");
        }
      });
    } else {
      res.json("wrong_auth_pin");
    }
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/cancelOrder", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var order_id = req.body.order_id;
  var pair_id = req.body.pair_id;

  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    const filter = { user_id: user_id, _id: order_id };
    const update = { status: "2" };
    Pairs.findOne({ id: pair_id })
      .then((pair) => {
        if (pair != null) {
          var symbolTwoID = pair.symbolTwoID;
          var symbolOneID = pair.symbolOneID;

          Wallet.findOne({ user_id: user_id, coin_id: symbolTwoID })
            .then((wallet) => {
              if (wallet != null) {
                var balance = wallet.amount;
                Orders.findOne(filter)
                  .then((order) => {
                    if (order != null) {
                      var priceAmount = order.priceAmount;
                      var newBalance =
                        parseFloat(balance) + parseFloat(priceAmount);
                      var update2 = { amount: newBalance };
                      Wallet.findOneAndUpdate(
                        { user_id: user_id, coin_id: symbolTwoID },
                        update2,
                        (err, doc) => {
                          if (err) {
                            console.log(err);
                            res.json("error");
                          } else {
                            Orders.findOneAndUpdate(
                              filter,
                              update,
                              (err, doc) => {
                                if (err) {
                                  console.log(err);
                                  res.json("error");
                                } else {
                                  res.json("cancelled");
                                }
                              }
                            );
                          }
                        }
                      );
                    } else {
                      res.json("pair_not_found");
                    }
                  })
                  .catch((err) => {
                    res.json(err);
                  });
              }
            })
            .catch((err) => {
              res.json(err);
            });
        } else {
          res.json("wallet_not_found");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/updatePhone", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var newCountryCode = req.body.country_code;
  var newPhoneNumber = req.body.phone_number;
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    User.findOne({
      user_id: user_id,
      status: 1,
    })
      .then((user) => {
        if (user != null) {
          var twofa = user["twofa"];
          const filter = { id: user_id, status: 1 };
          var formattedToken = authenticator.generateToken(twofa);
          if (formattedToken == twofapin) {
            const update = {
              country_code: country_code,
              phone_number: newPhoneNumber,
            };
            User.findOneAndUpdate(filter, update, (err, doc) => {
              if (err) {
                console.log(err);
                res.json("error");
              } else {
                res.json("update_success");
              }
            });
          } else {
            res.json("2fa_failed");
          }
        }
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/resetPassword", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var password = req.body.password;

  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    User.findOne({
      user_id: user_id,
      status: 1,
    })
      .then((user) => {
        if (user != null) {
          var twofa = user["twofa"];
          const filter = { id: user_id, status: 1 };
          var formattedToken = authenticator.generateToken(twofa);
          if (formattedToken == twofapin) {
            const update = { password: hashData(password) };
            User.findOneAndUpdate(filter, update, (err, doc) => {
              if (err) {
                console.log(err);
                res.json("error");
              } else {
                res.json("update_success");
              }
            });
          } else {
            res.json("2fa_failed");
          }
        }
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/changePassword", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var twofapin = req.body.twofapin;
  var password = req.body.password;
  var old_password = req.body.old_password;

  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    User.findOne({
      user_id: user_id,
      status: 1,
    })
      .then((user) => {
        if (user != null) {
          var twofa = user["twofa"];
          var db_password = user["password"];
          const filter = { id: user_id, status: 1 };
          if (hashData(old_password) == db_password) {
            var formattedToken = authenticator.generateToken(twofa);
            if (formattedToken == twofapin) {
              const update = { password: hashData(password) };
              User.findOneAndUpdate(filter, update, (err, doc) => {
                if (err) {
                  console.log(err);
                  res.json("error");
                } else {
                  res.json("update_success");
                }
              });
            } else {
              res.json("2fa_failed");
            }
          } else {
            res.json("wrong_old_password");
          }
        } else {
          res.json("user_not_found");
        }
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/get2fa", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    var formattedKey = authenticator.generateKey();
    res.json(formattedKey);
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getUserInfo", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    User.findOne({
      id: user_id,
    })
      .then((user) => {
        if (user != null) {
          var twofaStatus = user["twofa"];
          var results = [];
          results.push({
            name: user["name"],
            response: "success",
            surname: user["surname"],
            email: user["email"],
            country_code: user["country_code"],
            phone_number: user["phone_number"],
          });
          console.log(results);
          var status = user["status"];

          if (status == 1) {
            res.json(results);
          }

          if (status == 0) {
            res.json("account_not_active");
          }
        } else {
          res.json("login_failed");
        }
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getUserId", upload.none(), (req, res) => {
  var email = req.body.email;
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    User.findOne({
      email: email,
    })
      .then((user) => {
        if (user != null) {
          var myArray = [];
          myArray.push({
            response: "success",
            user_id: user["id"],
          });
          res.json(myArray);
        } else {
          res.json("user_not_found");
        }
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.listen(port, () => {
  console.log("Server Ayakta");
});
