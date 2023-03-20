const Pairs = require("../../models/Pairs");
const CoinList = require("../../models/CoinList");
var authFile = require("../../auth");

const getPairs = async function (req, res) {

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
 
};

module.exports = getPairs;
