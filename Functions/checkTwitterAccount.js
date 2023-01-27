const { TwitterApi } = require('twitter-api-v2');
const checkTwitterAccount = async (username) => {
    try {
        const twitterClient = new TwitterApi(process.env.TWTTKN);
        const readOnlyClient = twitterClient.readOnly;
        const user = await readOnlyClient.v2.userByUsername(username);
        if (user.errors != null) {
            return user.errors[0].title;
        }
        const tweets = await readOnlyClient.v2.userTimeline(user.data.id, {});
        if (tweets.errors.length > 0) {
            return tweets.errors[0].title;
        }
    } catch (err) {
        return err.message;
    }
    return "ok";
}
module.exports = checkTwitterAccount;