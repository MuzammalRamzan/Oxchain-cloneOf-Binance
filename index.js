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
const LoginLogs = require("./models/LoginLogs");
const SecurityKey = require("./models/SecurityKey");
const Notification = require("./models/Notifications");
const ReadNotification = require("./models/ReadNotifications");
const axios = require("axios");
const NotificationTokens = require("./models/NotificationTokens");
const Deposits = require("./models/Deposits");
const Withdraws = require("./models/Withdraw");

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
  let newRegisteredId;
  var api_key_result = req.body.api_key;
  var notificationToken = req.body.notificationToken;

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
            .then(async (userRef) => {
              //console.log(userRef["refCode"]);
              refId = userRef["refCode"];
              await results.push({
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

          var status = user["status"];

          if (status == 1) {
            CoinList.find({})
              .then((coins) => {
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
                        //console.log("wallet added");
                      } else {
                        //console.log("wallet already exists");
                      }
                    })
                    .catch((err) => {
                      console.log(err);
                    });
                }
              })
              .then(() => {
                LoginLogs.findOne({
                  user_id: user["_id"],
                  ip: req.body.ip,
                  deviceName: req.body.deviceName,
                  manufacturer: req.body.manufacturer,
                  model: req.body.deviceModel,
                })
                  .then((logs) => {
                    const newUserLog = new LoginLogs({
                      user_id: user["_id"],
                      ip: req.body.ip,
                      deviceName: req.body.deviceName,
                      manufacturer: req.body.manufacturer,
                      model: req.body.deviceModel,
                    });

                    newUserLog.save(function (err, room) {
                      newRegisteredId = room.id;
                    });

                    console.log("logs:" + logs);
                    if (logs != null) {
                      if (logs["trust"] == "yes") {
                        results.push({
                          trust: "yes",
                          log_id: logs["_id"],
                        });
                      } else {
                        results.push({
                          trust: "no",
                          log_id: logs["_id"],
                        });
                      }
                    } else {
                      results.push({
                        trust: "no",
                        log_id: newRegisteredId,
                      });
                    }

                    NotificationTokens.findOne({
                      user_id: user["_id"],
                      token_id: notificationToken,
                    })
                      .then((response) => {
                        if (response == null) {
                          const newNotificationToken = new NotificationTokens({
                            user_id: user["_id"],
                            token_id: notificationToken,
                          });
                          newNotificationToken.save(function (err, room) {
                            if (err) {
                              console.log(err);
                            } else {
                              res.json(results);
                            }
                          });
                        } else {
                          res.json(results);
                        }
                      })
                      .catch((err) => {
                        console.log(err);
                      });
                  })
                  .catch((err) => {
                    console.log(err);
                  });
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

route.all("/addNotification", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    const newNotification = new Notification({
      notificationTitle: req.body.notificationTitle,
      notificationMessage: req.body.notificationMessage,
    });
    newNotification
      .save()
      .then((notification) => {
        NotificationTokens.find({}).then((tokens) => {
          for (var i = 0; i < tokens.length; i++) {
            var token = tokens[i].token_id;
            sendPushNotification(token, notification.notificationMessage);
          }
        });
        res.json("success");
      })
      .catch((err) => {
        console.log(err);
      });
  }
});

route.all("/getNotification", upload.none(), (req, res) => {
  var api_key_result = req.body.api_key;
  var user_id = req.body.user_id;
  var readStatus = "unread";
  if (api_key_result == api_key) {
    var myArray = new Array();
    Notification.find({})
      .sort({ createdAt: -1 })
      .then((notification) => {
        for (var i = 0; i < notification.length; i++) {
          var messageId = notification[i].id;
          var messageTitle = notification[i].notificationTitle;
          var messageMessage = notification[i].notificationMessage;
          var createdAt = notification[i].createdAt;
          var messageDate = notification[i].createdAt;
          ReadNotification.findOne({
            user_id: user_id,
            notification_id: messageId,
          }).then((readNotification) => {
            if (readNotification == null) {
              readStatus = "unread";
            } else {
              readStatus = "read";
            }
          });
          var message = {
            messageId: messageId,
            createdAt: createdAt,
            messageTitle: messageTitle,
            messageMessage: messageMessage,
            messageDate: messageDate,
            readStatus: readStatus,
          };
          myArray.push(message);
        }
        if (notification.length == 0) {
          res.json("no_notification");
        } else {
          res.json(myArray);
        }
      })
      .catch((err) => {
        console.log(err);
      });
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
        res.json("asd" + err);
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
  var wantToTrust = req.body.wantToTrust;
  var log_id = req.body.log_id;
  if (api_key_result == api_key) {
    User.findOne({
      _id: user_id,
    })
      .then((user) => {
        if (user != null) {
          var twofa = user["twofa"];

          var formattedToken = authenticator.generateToken(twofa);
          if (twofapin == formattedToken) {
            console.log(wantToTrust);
            if (wantToTrust == "yes") {
              var update = { trust: "yes" };
              LoginLogs.findOneAndUpdate({ _id: log_id }, update)
                .then((log) => {
                  console.log(log);
                  res.json("2fa_success");
                })
                .catch((err) => {
                  res.json(err);
                });
            } else {
              res.json("2fa_success");
            }
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
    const filter = { _id: user_id };
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

route.all("/addSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var security_key = hashData(req.body.security_key);
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;

  if (api_key_result == api_key) {
    SecurityKey.findOne({
      user_id: user_id,
      status: 1,
    })
      .then((securityKey) => {
        if (securityKey != null) {
          res.json("security_key_active");
        } else {
          var newSecurityKey = new SecurityKey({
            user_id: user_id,
            key: security_key,
            status: 1,
            trade: trade,
            wallet: wallet,
            deposit: deposit,
            withdraw: withdraw,
          });
          newSecurityKey.save((err, doc) => {
            if (err) {
              console.log(err);
              res.json("error");
            } else {
              res.json("success");
            }
          });
        }
      })
      .catch((err) => {
        res.json(err);
      });
  }
});

route.all("/updateSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var security_key = req.body.security_key;
  var api_key_result = req.body.api_key;
  var trade = req.body.trade;
  var wallet = req.body.wallet;
  var deposit = req.body.deposit;
  var withdraw = req.body.withdraw;

  if (api_key_result == api_key) {
    SecurityKey.findOne({
      user_id: user_id,
      status: 1,
      id: req.body.id,
    })
      .then((securityKey) => {
        if (securityKey != null) {
          const filter = { id: req.body.id, status: 1 };
          const update = {
            wallet: wallet,
            deposit: deposit,
            withdraw: withdraw,
            trade: trade,
          };
          SecurityKey.findOneAndUpdate(filter, update, (err, doc) => {
            if (err) {
              console.log(err);
              res.json("error");
            } else {
              res.json("update_success");
            }
          });
        } else {
          res.json("security_key_not_found");
        }
      })
      .catch((err) => {
        res.json(err);
      });
  }
});

route.all("/lastActivities", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var limit = req.body.limit;
  if (api_key_result == api_key) {
    if (limit <= 100) {
      var sort = { createdAt: -1 };
      LoginLogs.find({ user_id: user_id })
        .sort(sort)
        .limit(limit)
        .then((logs) => {
          res.json(logs);
        })
        .catch((err) => {
          res.json(err);
        });
    } else {
      res.json("max_limit_100");
    }
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
          const filter = { _id: user_id, status: 1 };
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
          const filter = { _id: user_id, status: 1 };
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
          const filter = { _id: user_id, status: 1 };
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
  console.log(user_id);

  if (api_key_result == api_key) {
    User.findOne({
      _id: user_id,
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

route.all("/getSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    SecurityKey.findOne({
      user_id: user_id,
      status: 1,
    }).then((securityKey) => {
      if (securityKey != null) {
        var myArray = [];
        myArray.push({
          response: "success",
          createdAt: securityKey["createdAt"],
          wallet: securityKey["wallet"],
          trade: securityKey["trade"],
          deposit: securityKey["deposit"],
          withdraw: securityKey["withdraw"],
          id: securityKey["id"],
        });
        res.json(myArray);
      } else {
        var myArray = [];
        myArray.push({
          response: "security_key_not_active",
        });
        res.json(myArray);
      }
    });
  }
});

route.all("/checkSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;

  if (api_key_result == api_key) {
    SecurityKey.findOne({
      user_id: user_id,
      status: 1,
      key: hashData(req.body.key),
    }).then((securityKey) => {
      if (securityKey != null) {
        res.json("success");
      } else {
        res.json("wrong_key");
      }
    });
  }
});

route.all("/deleteSecurityKey", upload.none(), (req, res) => {
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var twofapin = req.body.twofapin;

  if (api_key_result == api_key) {
    User.findOne({
      _id: user_id,
    }).then((user) => {
      if (user != null) {
        var twofa = user["twofa"];

        var formattedToken = authenticator.generateToken(twofa);
        if (twofapin == formattedToken) {
          SecurityKey.findOneAndUpdate(
            { user_id: user_id, id: req.body.key_id },
            { status: 0 },
            (err, doc) => {
              if (err) {
                console.log(err);
                res.json("error");
              } else {
                res.json("success");
              }
            }
          );
        } else {
          res.json("2fa_failed");
        }
      }
    });
  } else {
    res.json("not_enough_balance");
  }
});

route.all("/addWithdraw", upload.none(), (req, res) => {
  console.log("asd");
  var user_id = req.body.user_id;
  var api_key_result = req.body.api_key;
  var amount = req.body.amount;
  var currency = req.body.currency;
  var withdraw_address = req.body.withdraw_address;
  var coin_id = req.body.coin_id;

  if (api_key_result == api_key) {
    Wallet.findOne({ user_id: user_id, coin_id: coin_id }, { amount: 1 })
      .then((list) => {
        if (parseFloat(list.amount) >= parseFloat(amount)) {
          const newWithdraw = new Withdraws({
            user_id: user_id,
            coin_id: coin_id,
            amount: amount,
            withdraw_address: withdraw_address,
            status: 1,
          });
          NotificationTokens.findOne({
            user_id: user_id,
          }).then((response) => {
            if (response == null) {
            } else {
              console.log(response);
              var token = response["token_id"];
              newWithdraw.save(function (err, room) {
                if (err) {
                  console.log(token);
                  res.json("error");
                } else {
                  var body =
                    "A withdraw order has been given from your account. Please wait for the admin to confirm your order.\n\n";
                  sendPushNotification(token, body);
                  res.json("success");
                }
              });
            }
          });
        } else {
          res.json("not_enough_balance");
        }
      })
      .catch((err) => {
        console.log(err);
      });
  } else {
    res.json("Forbidden 403");
  }
});

route.all("/getDepositsUSDT", upload.none(), (req, res) => {
  var coin_id = "62bc116eb65b02b777c97b3d";
  var user_id = "62a89a7bebd4b6fca58d18a0";
  var amount = 10;
  var address = "THPvaUhoh2Qn2y9THCZML3H815hhFhn5YC";
  var txid = "253f666b515d1668a7e0088130732ea1c2336825aa92638c2c8b88a9e66f2ab3";

  //find deposits here, then call addDeposit Function in while loop.
  addDeposit(user_id, coin_id, amount, address, txid);
  res.json("success");
});

async function addDeposit(user_id, coin_id, amount, address, txid) {
  const newDeposit = new Deposits({
    user_id: user_id,
    coin_id: coin_id,
    amount: amount,
    tx_id: txid,
    address: address,
    status: 1,
  });

  NotificationTokens.findOne({
    user_id: user_id,
  }).then((response) => {
    if (response == null) {
    } else {
      var token = response["token_id"];
      newDeposit.save(function (err, room) {
        if (err) {
          console.log(err);
        } else {
          var body =
            "You have received a deposit of " +
            amount +
            " " +
            coin_id +
            " from " +
            address;
          sendPushNotification(token, body);
        }
      });
    }
  });
}

async function sendPushNotification(expoPushToken, body) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Oxhain",
    body: body,
  };

  axios.post("https://exp.host/--/api/v2/push/send", message).then((result) => {
    console.log(result.data);
  });
}

route.listen(port, () => {
  console.log("Server Ayakta");
});
