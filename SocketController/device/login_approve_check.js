const DeviceModel = require("../../models/Device");

const loginApproveCheck = async (ws, device_id) => {


    DeviceModel.watch([{ $match: { operationType: { $in: ['update'] }, "documentKey._id": device_id } }]).on('change', async data => {
        if (data.updateDescription.updatedFields.loginRequest == 2) {
            ws.send(JSON.stringify({ command: "login_request_approved", device: data.documentKey._id }));
        }
    });
}

module.exports = loginApproveCheck;