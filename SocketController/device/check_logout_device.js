const Device = require("../../models/Device");

const CheckLogoutDevice = async (ws, user_id) => {
    Device.watch([{ $match: { operationType: { $in: ['update'] } } }]).on('change', async data => {
        if (data.updateDescription.updatedFields.status == 0) {
            await Device.updateOne({ _id: data.documentKey._id }, { $set: { status: -1 } });
            ws.send(JSON.stringify({ command: "logout", device: data.documentKey._id }));
        }
    });

    //check Device and see if loginRequest is 1 or 2, if 1 then send login request to device
    Device.watch([{ $match: { operationType: { $in: ['update', 'insert'] } } }]).on('change', async data => {

        if (data.operationType == "insert") {
            if (data.fullDocument.loginRequest == 1) {
                ws.send(JSON.stringify({ command: "login_request", device: data.fullDocument._id }));
            }

        }
    }
    );


}

module.exports = CheckLogoutDevice;