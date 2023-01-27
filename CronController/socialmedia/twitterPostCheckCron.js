const TwitterAuth = require("../../Functions/twitterAuth");
const { TwitterApi } = require('twitter-api-v2');
const IBModel = require("../../models/IBModel");
const User = require("../../models/User");
require('dotenv').config();
const Connection = require('../../Connection');

const TwitterPostCheckCron = async () => {
    await Connection.connection();
    const twitterClient = new TwitterApi(process.env.TWTTKN);
    const readOnlyClient = twitterClient.readOnly;
    
    let program = await IBModel.find();
    
    for (var i = 0; i < program.length; i++) {
        let userInfo = await User.findOne({_id : program[i].user_id});
        if(userInfo == null) continue;
        if(userInfo.twitter_username == "") continue;

        const user = await readOnlyClient.v2.userByUsername(userInfo.twitter_username);
        if(user.errors != null) continue;
        const tweets = await readOnlyClient.v2.userTimeline(user.data.id, {});
        console.log(tweets.data);
    }
}
module.exports = TwitterPostCheckCron;