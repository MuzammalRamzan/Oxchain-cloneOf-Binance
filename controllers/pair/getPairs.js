const Pairs = require("../../models/Pairs");
const CoinList = require("../../models/CoinList");
var authFile = require("../../auth");

const getPairs = async function (req, res) {


  let api_key_result = req.body.api_key;

  let result = await authFile.apiKeyChecker(api_key_result);

  if (result === true) {

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


    var list = await Pairs.find({ status: 1 }).exec();



    let returnData = [];
    for (let i = 0; i < list.length; i++) {
      let coinOne = await CoinList.findOne({ _id: list[i].symbolOneID }).exec();
      let coinTwo = await CoinList.findOne({ _id: list[i].symbolTwoID }).exec();

      if (coinOne == null || coinTwo == null) {
        continue;
      }

      let obj = {

        id: list[i]._id,
        name: list[i].name,
        symbolOne: coinOne.symbol,
        symbolTwo: coinTwo.symbol,
        symbolOneID: coinOne._id,
        symbolTwoID: coinTwo._id,
        status: list[i].status,
        icon: coinOne.image_url,
        createdAt: list[i].createdAt,
        spot_fee: list[i].spot_fee,
        margin_fee: list[i].margin_fee,
        future_fee: list[i].future_fee,
        depositFee: list[i].depositFee,
        withdrawFee: list[i].withdrawFee,
        type: list[i].type,
        digits: list[i].digits,
        tradeFee: list[i].tradeFee,
      };

      returnData.push(obj);
    }

    return res.json({ status: "success", data: returnData });
  }
  else {
    return res.json({ status: "fail", message: "Forbidden 403" });
  }
};

module.exports = getPairs;
