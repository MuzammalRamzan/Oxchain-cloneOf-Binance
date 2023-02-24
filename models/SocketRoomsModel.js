const { default: mongoose } = require("mongoose");

const SocketRoomsModel = mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    token: { type: String },
    process: { type: String },
    last_active_time: {
        type: Date,
        default: Date.now,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
});

module.exports =  mongoose.model("SocketRoomsModel",SocketRoomsModel);
