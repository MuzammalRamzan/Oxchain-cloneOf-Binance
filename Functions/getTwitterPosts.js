const TwitterAuth = require("./twitterAuth");

const getTwitterPosts = async(user_id) => {
    let auth = await TwitterAuth();
    console.log(auth);
}
module.exports = getTwitterPosts;