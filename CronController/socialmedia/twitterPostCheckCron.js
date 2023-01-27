const TwitterAuth = require("../../Functions/twitterAuth");
const { TwitterApi } = require('twitter-api-v2');
const IBModel = require("../../models/IBModel");
const User = require("../../models/User");
require('dotenv').config();
const Connection = require('../../Connection');
const SocialMediaPostModel = require("../../models/SocialMediaPostModel");

const TwitterPostCheckCron = async () => {
    await Connection.connection();
    const twitterClient = new TwitterApi(process.env.TWTTKN);
    const readOnlyClient = twitterClient.readOnly;

    let program = await IBModel.find();

    for (var i = 0; i < program.length; i++) {
        let userInfo = await User.findOne({ _id: program[i].user_id });
        if (userInfo == null) continue;
        if (userInfo.twitter_username == "") continue;

        const user = await readOnlyClient.v2.userByUsername(userInfo.twitter_username);
        if (user.errors != null) continue;
        const tweets = await readOnlyClient.v2.userTimeline(user.data.id, {});
        for (var j = 0; j < tweets.data.data.length; j++) {
            let item = tweets.data.data[j];

            if (item.text.indexOf('Oxhain') != -1) {
                let check = await SocialMediaPostModel.findOne({ post_link: item.id });
                if (check == null) {
                    let save = new SocialMediaPostModel({ post_link: item.id, user_id: program[i].user_id, platform: "Twitter" });
                    await save.save();
                }
            }

        }
    }
}
module.exports = TwitterPostCheckCron;