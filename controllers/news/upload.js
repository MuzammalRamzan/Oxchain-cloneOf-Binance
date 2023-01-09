const multer = require('multer');
const path = require('path');
const createDir = require('./newFolder');
const baseDir = path.resolve(__dirname, '../../');
createDir();
const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		cb(null, `${baseDir}/public/images`);
	},
	filename: (req, file, cb) => {
		cb(null, file.originalname);
	},
});

const fileFilter = (req, file, cb) => {
	if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png') {
		cb(null, true);
	} else {
		cb(null, false);
	}
};

const uploadFile = multer({
	storage: storage,
	fileFilter: fileFilter,
});
module.exports = uploadFile;
