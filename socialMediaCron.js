const TwitterPostCheckCron = require("./CronController/socialmedia/twitterPostCheckCron");
const getTwitterPosts = require("./Functions/getTwitterPosts");
const schedule = require('node-schedule');
const { sendSMS } = require("./mailer");
async function SocialMediaCron() {
    sendSMS("90", "5314570180", "deneme");
    return;
    TwitterPostCheckCron();
    schedule.scheduleJob('0 */12 * * *', async function () {
         TwitterPostCheckCron();
      });
      
}

SocialMediaCron();
