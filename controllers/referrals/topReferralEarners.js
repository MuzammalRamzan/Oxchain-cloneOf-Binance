const FeeModel = require('../../models/FeeModel');
const authFile = require('../../auth.js');
const UserModel = require('../../models/User');

const getFees = async (req, res) => {

    const api_key = req.body.api_key;
    const result = await authFile.apiKeyChecker(api_key);
    let dayCount = req.body.dayCount ?? 0;

    if (result === true) {

        //list referral fees group by to_user_id and sum amount list by amount desc
        const fees = await FeeModel.aggregate([
            {
                $group: {
                    _id: {
                        to_user_id: "$to_user_id",
                        ...(dayCount && { createdAt: { $gte: new Date(new Date().setDate(new Date().getDate() - dayCount)) } })
                    },
                    amount: { $sum: "$amount" },
                }
            },
            {
                $project: {
                    _id: 0,
                    to_user_id: "$_id.to_user_id",
                    amount: 1,

                }
            }
        ]).sort({ amount: -1 }).exec();

        for (let i = 0; i < fees.length; i++) {


            const user = await UserModel.findOne({
                _id: fees[i].to_user_id,
            }).exec();

            if (user != null) {
                console.log(user);
                fees[i].name = user.name + " " + user.surname;
            }

        }

        res.json({
            status: 'success',
            data: fees,
        });




    } else {
        res.json({
            status: 'error',
            message: 'Invalid API Key',
        });
    }

};

module.exports = getFees;