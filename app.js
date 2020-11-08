require('dotenv').config();

const request = require('request');
const fs = require('fs');

getSolarNoon(date => {

	let delayMS = date - new Date();
	if(delayMS <= 0) {
		console.error(`Solar noon already happened :( (${date})`);
		return;
	}

	console.log(`Solar noon is at ${date}, which is in ${delayMS / 1000} seconds!`);
	console.log(`Calling the screenshot function after ${delayMS / 1000} seconds..`);

	setTimeout(saveScreenshot, delayMS);
});


function getSolarNoon(callback) {
	function fallbackDate() {
		date = new Date();
		date.setHours(13);
		date.setMinutes(0);
		date.setSeconds(0);
		date.setMilliseconds(0);
		
		return date;
	}

	request(`https://api.sunrise-sunset.org/json?lat=${process.env.LAT}&lng=${process.env.LNG}&formatted=0&date=today`,
		(error, response, body) => {
			if(error) {
				console.error(error);

				callback(fallbackDate());

				return;
			}

			let date = undefined;
			try{
				bodyJson = JSON.parse(body);
				date = new Date(bodyJson.results.solar_noon);
			}catch(e) {
				date = undefined;
			}

			if(!date || isNaN(date.getTime())) {
				console.error(`Received an invalid date! (${date})`);
				console.error(`Response body:`);
				console.error(body);

				date = fallbackDate();
			}

			callback(date);
		}
	);
}

function saveScreenshot() {
	console.log(`Downloading a snapshot from ${process.env.SNAPSHOT_URL}`);

	request(process.env.SNAPSHOT_URL, {encoding: 'binary'}, (error, response, body) => {
		if(error) {
			console.error('Could not get a snapshot from the url.');
			console.error(error);

			return;
		}

		if(!fs.existsSync(process.env.IMAGES_FOLDER)){
			fs.mkdirSync(process.env.IMAGES_FOLDER);
		}

		let now = new Date();
		let year = now.getFullYear().toString();
		let month = (now.getMonth() + 1).toString().padStart(2, '0');
		let day = now.getDate().toString().padStart(2, '0');

		let filename = `${process.env.IMAGES_FOLDER}/${year}-${month}-${day}.${process.env.SNAPSHOT_EXTENSION}`;

		fs.writeFile(filename, body, 'binary', error => {
			if(error) {
				console.error('Could not write the screenshot to a file.');
				console.error(error);
			}
		});
	});
}
