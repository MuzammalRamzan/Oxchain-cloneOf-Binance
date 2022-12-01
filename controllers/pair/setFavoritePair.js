const FavoriteCoin = require("../../models/FavoriteCoin");

const SetFavoritePair = async (req, res) => {
    try {
        let coin_id = req.body.coin_id;
        let user_id = req.body.user_id;
        let check = await FavoriteCoin.findOne({ user_id: user_id, coin_id: coin_id });
        if (check == null) {
            let save = new FavoriteCoin({
                user_id : user_id,
                coin_id : coin_id
            });
            await save.save();
            res.json({ status: 'success', data: 'OK' });
        } else {
            await check.remove();
            res.json({ status: 'success', data: 'OK' });
        }
    } catch(err) {
        res.json({ status: 'fail', msg: err.message });
    }
}
module.exports = SetFavoritePair;