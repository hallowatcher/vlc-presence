const request = require('request');
require('dotenv').config();

const pass = process.env.VLC_PASSWORD;
const auth = new Buffer(':' + pass).toString('base64');
const req = {
  uri: 'http://127.0.0.1:8080/requests/status.json',
  method: 'GET',
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'application/json'
  }
};

function updateStatus() {
  request(req, (err, response, body) => {
    if (err) {
      console.log('HTTP server not responding, trying again in 15 seconds...');
      return;
    }

    const vidState = JSON.parse(body);

    const time = vidState.time;
    const title = cleanName(vidState.information.category.meta.filename);
    const picKey = pictureKey(title);

    console.log('title: ', title);
    console.log('time: ', time);
    console.log('pic key: ', picKey);
  });
}

function cleanName(input) {
  const authorRegex = new RegExp(/(\[.*?\]|\(.*?\)|\..*?$)/, 'gi');

  let original = input + '';
  let result = authorRegex.exec(original);

  while (result) {
    original = original.replace(result[0], '').trim();
    result = authorRegex.exec(input);
  }

  return original;
}

function pictureKey(input) {
  return input.substr(0, 5).toLowerCase();
}

updateStatus();
setInterval(updateStatus, 15000);
