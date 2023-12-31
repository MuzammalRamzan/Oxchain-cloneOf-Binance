const QRCode = require('qrcode');
const QRCodes = require('../../../models/QRCodes');
const utilities = require('../../../utilities');

const generateQRCode = async (req, res) => {
	try {
		const { device_id, deviceName, deviceOS, ip, deviceVersion, location, deviceType} = req.body;
		let QRtoken = utilities.hashData((Math.random() + 1).toString(36)) + Date.now();
		let newQRCode = new QRCodes({
			deviceId: device_id,
			deviceName: deviceName,
			deviceType: deviceType,
			deviceOs: deviceOS,
			location: location,
			deviceVersion: deviceVersion,
			ip: ip,
			qrToken: QRtoken,
		});
		newQRCode.save();
		const query ={ "createdAt": { "$lt": new Date(Date.now() - 86400000) }}
		let qrGen = "https://oxhain.com/qr/" + QRtoken;
    	await QRCodes.deleteMany(query);
		// Generate the QR code
		const qrCode = await QRCode.toDataURL(qrGen);

		// Return the QR code data
		res.json({ qrCode, qrGen });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Internal server error' });
	}
};
module.exports = generateQRCode;
