const { default: mongoose } = require("mongoose");

const IBModel = mongoose.Schema({
    user_id : {type : mongoose.Schema.Types.ObjectId, ref : "User"},
    status : {type : Number, default: 0}
});

module.exports = mongoose.model("IBModel", IBModel);