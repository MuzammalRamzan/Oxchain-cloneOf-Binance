const AITradeParticipants = require("../../models/AITradeParticipants");

const LeaveAITrade = async(req,res) => {
    try {
        let uid = req.body.uid;
        let obj_id = req.body.id;
        await AITradeParticipants.deleteOne({user_id: uid, _id : obj_id});
        return res.json({'status' : 'success', 'data' : 'OK'});
    } catch(err) 
    {
        return res.json({'status' : 'fail', 'message' :  err.message});
    }
} 

module.exports = LeaveAITrade;