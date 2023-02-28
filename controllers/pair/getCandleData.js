const { default: axios } = require("axios");

const GetCandleData = async(req,res) => {
    try {
        let symbol = req.query.symbol;
        if(symbol == null)
        return res.send({status : 'fail', message : 'Symbol not found'});
        let dt = new Date();
        let now = dt.getTime();
        dt.setDate(dt.getDate() - 1);
        let yesterday = dt.getTime();

        symbol = symbol.replace('/', '_');
        
        let uri = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&startTime="+yesterday+"&endTime=" + now + "";
        let candleData = axios.get(uri);
        let data = (await candleData).data;
        let ret = [];
        data.forEach(x => {
            ret.push(x[2]);
        });
        return res.json({status : 'success', data : ret});
    } catch(err) {
        console.log(err);
        return res.json({status : 'fail', message : "Unknow error"});
    }
}

module.exports = GetCandleData;