const Device = require("../../models/Device")

const SetLogoutDevice = async(ws, user_id, device_id) => {

    Device.updateOne({_id : device_id}, {$set : {status : 0}});


}

module.exports = SetLogoutDevice;