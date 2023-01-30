const { default: mongoose } = require("mongoose");

const SocialMediaPostModel = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    platform: { type: String },
    post_link: { type: String },
    
    createdAt: {
        type: Date,
        default: Date.now,
    },
})
module.exports = mongoose.model("SocialMediaPost", SocialMediaPostModel);