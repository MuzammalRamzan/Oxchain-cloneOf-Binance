const QRCodes = require('../../../models/QRCodes');
var authFile = require("../../../auth.js");

const authorizeQRCode = async (req, res) => {
    const { qrToken, api_key, user_id} = req.body;
    var result = await authFile.apiKeyChecker(api_key);
    if (result === true) {
        let key = req.headers["key"];
        if (!key) {
            return res.json({ status: "fail", message: "key_not_found" });
        }
        if (!req.body.device_id || !req.body.user_id) {
            return res.json({ status: "fail", message: "invalid_params (key, user id, device_id)" });
        }
        let checkKey = await authFile.verifyKey(key, req.body.device_id, req.body.user_id);
        if (checkKey === "expired") {
            return res.json({ status: "fail", message: "key_expired" });
        }
        if (!checkKey) {
            return res.json({ status: "fail", message: "invalid_key" });
        }
    }else {
        return res.json({ status: "fail", message: "Forbidden 403" });
    }
    try{
        if(!qrToken){
            return res.json({ status: "fail", message: "Required QR Token" });
        }
        if(!user_id){
            return res.json({ status: "fail", message: "User Id is Required" });
        }
        const findqrToken = await QRCodes.findOne({qrToken: qrToken}).exec();
        if(findqrToken){
            findqrToken.status = 2;
            findqrToken.save();

            //put authorization code here.



            return  res.json({ status: "success", message: "Authorization Success" });
        }else{
            return res.json({ status: "fail", message: "Invalid QR Token" });
        }
    }catch(err){
        console.error(err);
	    return res.status(500).json({ message: 'Internal server error' });
    }
};
module.exports = authorizeQRCode;
