const Device = require("../../models/Device")

const CheckLogoutDevice = async (ws, user_id) => {
    Device.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
        if (data.updateDescription.updatedFields.status == 0) {
            await Device.updateOne({_id :  data.documentKey._id}, {$set : {status : -1}});
            ws.send(JSON.stringify({ command: "logout", device: data.documentKey._id  }));
        }
    });
}

module.exports = CheckLogoutDevice;