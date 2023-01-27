const { default: mongoose } = require("mongoose");

const SocialMediaPostModel = mongoose.Schema({
    user_id : {type : mongoose.Schema.Types.ObjectId, ref : "User"},
    platform: {type: String},
    post_link : {type : String}

})
module.exports = mongoose.model("SocialMediaPost", SocialMediaPostModel);