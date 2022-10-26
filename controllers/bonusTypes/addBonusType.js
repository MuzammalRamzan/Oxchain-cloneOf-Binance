const BonusTypes = require('../../models/BonusTypes');
var authFile = require("../../auth.js");
const addBonusType = async (req, res) => {
    var api_key_result = req.body.api_key;
    var result = await authFile.apiKeyChecker(api_key_result);
    if (result === true) {
        let title = req.body.title;
        let amount = req.body.amount;
        let add_type = req.body.add_type;
        let description = req.body.description;

        let add = BonusTypes({
            title: title,
            amount: amount,
            add_type: add_type,
            description: description,
            status: 1
        });

        await add.save();
        res.json({ 'status': true, 'data': '' });
        return;
    } else {
        res.json({ 'status': false, 'message': 'Not auth' });
        return;
    }
}

module.exports = addBonusType;