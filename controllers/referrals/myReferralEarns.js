const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth.js');
const UserModel = require('../../models/User');

const getFees = async (req, res) => {

    const api_key = req.body.api_key;
    const result = await authFile.apiKeyChecker(api_key);
    const user_id = req.body.user_id;

    let dayCount = req.body.dayCount ?? 0;
    if (result === true) {



        let key = req.headers["key"];

        if (!key) {
            return res.json({ status: "fail", message: "key_not_found" });
        }

        if (!req.body.device_id || !req.body.user_id) {
            return res.json({ status: "fail", message: "invalid_params" });
        }

        let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);


        if (checkKey === "expired") {
            return res.json({ status: "fail", message: "key_expired" });
        }

        if (!checkKey) {
            return res.json({ status: "fail", message: "invalid_key" });
        }

        let referralEarnings = await FeeModel.find(
            {
                to_user_id: user_id,
                ...(dayCount && { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - dayCount)) } })
            }
        ).exec();

        res.json({
            status: 'success',
            data: referralEarnings,
        });




    } else {
        res.json({
            status: 'error',
            message: 'Invalid API Key',
        });
    }

};

module.exports = getFees;