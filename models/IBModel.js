const { default: mongoose } = require("mongoose");

const IBModel = mongoose.Schema({
    user_id : {type : mongoose.Schema.Types.ObjectId, ref : "User"},
    status : {type : Number, default: 0},
    caveat: { type: Number, default: 0 },
    lastCaveat: { type: Date },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("IBModel", IBModel);