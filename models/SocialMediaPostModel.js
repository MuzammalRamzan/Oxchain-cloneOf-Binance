const { default: mongoose } = require("mongoose");

const SocialMediaPostModel = mongoose.Schema({
    user_id : {type : mongoose.Schema.Types.ObjectId, ref : "User"},
    post_link : {type : String}

})
module.exports = mongoose.model("SocialMediaPost", SocialMediaPostModel);