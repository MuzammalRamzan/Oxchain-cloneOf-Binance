const TwitterAuth = require("../../Functions/twitterAuth");
const { TwitterApi } = require('twitter-api-v2');
require('dotenv').config();

const TwitterPostCheckCron = async () => {
    const twitterClient = new TwitterApi(process.env.TWTTKN);
    const readOnlyClient = twitterClient.readOnly;
    const user = await readOnlyClient.v2.userByUsername('ddr5racm16gb');
    console.log(user);

    /*
        let ww = await readOnlyClient.v2.search("oxhain", { 'media.fields': 'url' });
    
        for await (const tweet of ww) {
            console.log(tweet);
        }
    */
    console.log("-----------------");
    const tweets = await readOnlyClient.v2.userTimeline(user.data.id, {});

    console.log(tweets.data);
    //await twitterClient.v1.tweet('Hello, this is a test.');

    /*    
    let auth = await TwitterAuth();
    console.log(auth);
    */
}
module.exports = TwitterPostCheckCron;