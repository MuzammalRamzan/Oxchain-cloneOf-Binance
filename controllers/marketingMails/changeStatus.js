const MarketingMailsModel = require('../../models/MarketingMail');
const authFile = require('../../auth.js');

const index = async function (req, res) {

    const user_id = req.body.user_id;
    const api_key_result = req.body.api_key;
    const result = await authFile.apiKeyChecker(api_key_result);

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


        const marketingMails = await MarketingMailsModel.findOne({
            user_id: user_id,
        }).exec();

        if (marketingMails != null) {
            if (marketingMails.status == 1) {
                marketingMails.status = 0;
                marketingMails.save();
                return res.json({ status: "success", data: "disabled", showableMessage: "Marketing mails are disabled" });
            }
            else {
                marketingMails.status = 1;
                marketingMails.save();
                return res.json({ status: "success", data: "enabled", showableMessage: "Marketing mails are enabled" });
            }
        }
        else {
            const newMarketingMails = new MarketingMailsModel({
                user_id: user_id,
            });

            newMarketingMails.save((err, doc) => {
                if (err) {
                    return res.json({ status: "fail", message: err });
                }
                else {
                    return res.json({ status: "success", data: "enabled", showableMessage: "Marketing mails are enabled" });
                }
            }
            );
        }
    }
    else {
        return res.json({
            status: "fail", message: "api_key is not valid"
        });
    }

};

module.exports = index;