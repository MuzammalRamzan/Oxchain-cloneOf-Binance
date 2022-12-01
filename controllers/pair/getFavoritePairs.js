const FavoriteCoin = require("../../models/FavoriteCoin");
const GetFavoritePairs = async(req,res) => {
    try {
        let user_id = req.body.user_id;
        let favs = await FavoriteCoin.find({user_id : user_id});
        res.json({status : 'success', data : favs});
    } catch(err) {
        res.json({status : 'fail', msg : err.message});
    }
}
module.exports = GetFavoritePairs;