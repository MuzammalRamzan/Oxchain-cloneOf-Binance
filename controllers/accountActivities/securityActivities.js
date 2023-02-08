const UserModel = require("../../models/User");
const authFile = require("../../auth.js");
const DevicesModel = require("../../models/Device");

const ChangeLogsModel = require("../../models/ChangeLogs");

const securityActivities = async function (req, res) {


    var user_id = req.body.user_id;
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);

    if (result === true) {
        let user = await UserModel.findOne({
            _id: user_id,
        }).exec();


        let dayCount = req.body.dayCount ?? 0;


        if (user != null) {
            let returnData = [];
            //aggregate all the devices with same ip address and city and deviceName of the user

            let devices = await DevicesModel.aggregate([
                {
                    $match: {
                        user_id: user_id,
                        ...(dayCount && { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - dayCount)) } })
                    }
                },
                {
                    $group: {
                        _id: {
                            ip: "$ip",
                            city: "$city",
                            deviceName: "$deviceName"
                        },
                        count: { $sum: 1 },
                        createdAt: { $first: "$createdAt" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        ip: "$_id.ip",
                        city: "$_id.city",
                        deviceName: "$_id.deviceName",
                        count: 1,
                        createdAt: 1
                    }
                }
            ]).exec();


            if (devices != null) {

                for (let i = 0; i < devices.length; i++) {

                    let device = devices[i];
                    let deviceData = {
                        source: device.deviceName,
                        activity: "New Device Added",
                        ip: device.ip,
                        city: device.city,
                        deviceOS: device.deviceOs,
                        createdAt: device.createdAt
                    }
                    returnData.push(deviceData);
                }
            }

            let changeLogs = await ChangeLogsModel.find({
                user_id: user_id,
                ...(dayCount && { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - dayCount)) } })
            }).exec();

            if (changeLogs != null) {

                for (let i = 0; i < changeLogs.length; i++) {

                    let changeLog = changeLogs[i];
                    let changeLogData = {
                        source: changeLog.device,
                        activity: changeLog.type,
                        ip: changeLog.ip,
                        city: changeLog.city,
                        deviceOS: changeLog.deviceOS,
                        createdAt: changeLog.createdAt
                    }
                    returnData.push(changeLogData);
                }
            }

            return res.json({
                status: "success",
                data: returnData
            });
        }
        else {
            return res.json({
                status: "fail",
                message: "user_not_found"
            });
        }
    } else {
        return res.json({
            status: "fail",
            message: "wrong api key"
        });
    }
};

module.exports = securityActivities;