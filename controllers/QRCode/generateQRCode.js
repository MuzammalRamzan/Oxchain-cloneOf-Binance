const QRCode = require('qrcode');

const generateQRCode = async (req, res) => {
	try {
		const { device_id, deviceName, deviceOS, ip } = req.body;
		let data = {
			device_id,
			deviceName,
			deviceOS,
			ip,
		};
		const qrCodeData = `${JSON.stringify(data)}`;

		// Generate the QR code
		const qrCode = await QRCode.toDataURL(qrCodeData);

		// Return the QR code data
		res.json({ qrCode });
	} catch (err) {
		console.error(err);
		res.status(500).json({ message: 'Internal server error' });
	}
};
module.exports = generateQRCode;
