const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth.js');
const UserModel = require('../../models/User');

const getFees = async (req, res) => {

    const api_key = req.body.api_key;
    const result = await authFile.apiKeyChecker(api_key);
    const user_id = req.body.user_id;

    let dayCount = req.body.dayCount ?? 0;
    if (result === true) {

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