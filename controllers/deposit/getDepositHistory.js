const CoinList = require("../../models/CoinList");
const Deposits = require("../../models/Deposits");
const Network = require("../../models/Network");

const GetDepositHistory = async (req, res) => {

    let { user_id } = req.body;

    if (!user_id) {
        return res.json(
            {
                status: "fail",
                message: "user_id is required",

            }
        );
    }


    let deposits = await Deposits.find({ user_id: user_id }).exec();

    let depositsData = [];

    for (let i = 0; i < deposits.length; i++) {

        console.log(deposits[i].coin_id);

        let coinInfo = await CoinList.findOne({ _id: deposits[i].coin_id }).exec();

        let network = "";

        if (deposits[i].network_id != null && deposits[i].network_id != undefined && deposits[i].network_id != "") {
            let networkInfo = await Network.findOne({ _id: deposits[i].network_id }).exec();
            network = networkInfo.symbol;
        }

        console.log(coinInfo);

        depositsData.push({
            id: deposits[i]._id,
            coin: {
                id: deposits[i].coin_id,
                name: coinInfo.symbol,
            },
            network: network,
            hash: deposits[i].tx_id,
            amount: deposits[i].amount,
            fromAddress: deposits[i].address,
            date: deposits[i].createdAt,
            status: deposits[i].status,
        });


    }
    return res.json(
        {
            status: "success",
            message: "deposit history",
            data: depositsData
        })



}
module.exports = GetDepositHistory;