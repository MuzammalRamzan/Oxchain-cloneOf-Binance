const TwitterAuth = require("../../Functions/twitterAuth");

const TwitterPostCheckCron = async() =>{
    
    let auth = await TwitterAuth();
    console.log(auth);
}
module.exports = TwitterPostCheckCron;