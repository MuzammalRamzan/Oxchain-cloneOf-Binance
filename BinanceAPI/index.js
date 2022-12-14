const axios = require("axios");
const crypto = require('crypto');
const https = require('https');

class BinanceAPI {
    constructor() {
        this.APIKEY = "hNKS47wbp1RRGBqVisse0XujfhHs3GLkPzyL6QdQgPft0cHk3aS8mgVUJmGZ6CVj";
        this.SECRETKEY = "Wo4hyg6MWT9Zadw8MzfdmBTuqb6jxZB8iQNQwKNL2wpwCnTipJ5HYRS54dUfH1Lp";
        this.APIURL = "https://api.binance.com";
    }

    async Withdraw(coin, address, network, amount) {
        let payload = { coin: coin, address: address, amount: amount, network: network };
        const signature = await this.sign(payload);
        payload['timestamp'] = signature['time'];
        payload['signature'] = signature['sign'];

        console.log(signature);

        const options = {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                'X-MBX-APIKEY': this.APIKEY
            },
            timeout: 1000, // in ms
        }

        let url = "https://api.binance.com/sapi/v1/capital/withdraw/apply?" + signature['query'] +  "&signature=" + signature['sign'];
        console.log(url);
        const req = https.request(url, options, (res) => {
            if (res.statusCode < 200 || res.statusCode > 299) {
                console.log(res.statusCode);
                //return reject(new Error(`HTTP status code ${res.statusCode}`))
            }

            const body = []
            res.on('data', (chunk) => {
                body.push(chunk);
            })
            res.on('end', () => {
                const resString = Buffer.concat(body).toString()
                console.log(JSON.stringify(resString));

            })
        })

        req.on('error', (err) => {
            console.log(err);
            //reject(err)
        })

        req.on('timeout', () => {
            req.destroy()
            reject(new Error('Request time out'))
        })

        req.write(JSON.stringify(payload))
        req.end()




        /*
        let config = {
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Safari/537.36',
                'X-MBX-APIKEY': this.APIKEY
            }
        }
        let url = this.APIURL + "/sapi/v1/capital/withdraw/apply?signature"+ signature['sign'];
        console.log(url);
        axios.post(url, payload, config).then((response) => {
            console.log(response.data);
        }).catch((err) => {
            console.log(err);
        });
        */
    }

    async sign(map) {
        let getTime = await axios("https://api1.binance.com/api/v3/time");

        let query = 'timestamp=' + getTime.data.serverTime;
        for (const key in map) {
            if (Object.prototype.hasOwnProperty.call(map, key)) {
                const value = map[key];
                query += `&${key}=${value}`
            }
        }


        return {
            "time": getTime.data.serverTime,
            "query": query, "sign": crypto.createHmac('sha256', this.SECRETKEY)
                .update(query)
                .digest('hex')
        };
    }



}

module.exports = BinanceAPI;