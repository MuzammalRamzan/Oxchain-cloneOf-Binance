const { default: axios } = require("axios")
require('dotenv').config();

const TwitterAuth = async () => {
    let token = await axios.post("https://api.twitter.com/oauth2/token", {
        mode: 'urlencoded',
        urlencoded: 'grant_type=client_credentials'
    }, {
        auth: {
            type: 'basic',
            basic: {
                username: process.env.TWTAPI,
                password: process.env.TWTSEC
            }
        },
        headers: {
            'Content-type': 'Content-type: application/x-www-form-urlencoded; charset: utf-8'
        },
    });

    return token.data;
}

module.exports = TwitterAuth;