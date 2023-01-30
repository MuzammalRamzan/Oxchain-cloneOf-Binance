const TwitterPostCheckCron = require("./CronController/socialmedia/twitterPostCheckCron");
const getTwitterPosts = require("./Functions/getTwitterPosts");
const schedule = require('node-schedule');
async function SocialMediaCron() {
    TwitterPostCheckCron();
    schedule.scheduleJob('0 */12 * * *', async function () {
         TwitterPostCheckCron();
      });
    
}

SocialMediaCron();
