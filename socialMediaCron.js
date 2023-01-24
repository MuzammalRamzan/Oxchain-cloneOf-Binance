const TwitterPostCheckCron = require("./CronController/socialmedia/twitterPostCheckCron");
const getTwitterPosts = require("./Functions/getTwitterPosts");

async function SocialMediaCron() {
    await TwitterPostCheckCron();
}

SocialMediaCron();
