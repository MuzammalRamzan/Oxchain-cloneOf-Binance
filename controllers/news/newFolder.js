const fs = require('fs');

const createDir = () => {
	fs.mkdir('public/images', { recursive: true }, (error) => {
		if (error) {
			console.error(error);
		} else {
			console.log(`Directory created`);
		}
	});
};

module.exports = createDir;
