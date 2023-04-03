const QRCodes = require('../../../models/QRCodes');
var authFile = require("../../../auth.js");

const validateQRCode = async (req, res) => {
    const { qrToken, api_key} = req.body;
    var result = await authFile.apiKeyChecker(api_key);
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
    }else {
        return res.json({ status: "fail", message: "Forbidden 403" });
    }
    try{
        if(!qrToken){
            return res.json({ status: "fail", message: "Required QR Token" });
        }
        const findqrToken = await QRCodes.findOne({qrToken: qrToken}).exec();
        if(findqrToken){
            //prepare data
            let data = {
                ip: findqrToken.ip??null,
                location: findqrToken.location??null,
                device: (findqrToken.deviceName??null) + " (" + (findqrToken.deviceOs??null) +")"
            };
            findqrToken.status = 1;
            findqrToken.save();
            return  res.json({ status: "success", message: "QR Token Found", data: data });
        }else{
            return res.json({ status: "fail", message: "Invalid QR Token" });
        }
    }catch(err){
        console.error(err);
	    return res.status(500).json({ message: 'Internal server error' });
    }
};
module.exports = validateQRCode;
