const authFile = require("../../auth.js");
const { default: axios } = require("axios");
const PairsModel = require("../../models/Pairs");


const getMarket = async (req, res) => {

    const isAuthenticated = await authFile.apiKeyChecker(req.body.api_key);
    if (!isAuthenticated) {
        return res.status(403).json({
            status: 'Failed',
            message: '403 Forbidden',
            showableMessage: 'Forbidden 403, Please provide valid api key'
        });
    }

    try {
        const PairData = await PairsModel.find({
            status: 1,
        }).exec();
        if (!PairData) {
            return res.status(401).json({
                status: 'Failed',
                message: "Pairs not found",
                showableMessage: 'Pairs not found',
            });
        }
        let pairs = []
        for (let x = 0; x < PairData.length; x++) {
            pairs.push(PairData[x].name.replace("/", ""))
        }
        let array = [];
        for (let i = 0; i < PairData.length; i++) {
            let data = await axios("https://api.binance.com/api/v3/ticker/24hr");
            var symbol = pairs[i];
            if (symbol != null) {
                let item = data.data.filter((x) => x.symbol == symbol);
                array = [...array, ...item]
            }
        }

        return res.status(200).json({
            status: 'Success',
            data: array
        });

    } catch (error) {
        return res.status(500).json({
            status: 'Failed',
            message: error.message,
            showableMessage: 'Internal Server Error',
        });
    }
};

module.exports = getMarket;
