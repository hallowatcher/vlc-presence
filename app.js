const request = require('request');
const DiscordRpc = require('discord-rpc');
const moment = require('moment');
require('dotenv').config();

const host = process.env.VLC_HOST || 'http://127.0.0.1:8080';
const pass = process.env.VLC_PASSWORD || '';
const interval = +process.env.MS_INTERVAL || 15000;
const clientId = process.env.CLIENT_ID || '';

const auth = new Buffer(':' + pass).toString('base64');
const vlcRequest = {
  uri: `${host}/requests/status.json`,
  method: 'GET',
  headers: {
    Authorization: 'Basic ' + auth,
    'Content-Type': 'application/json'
  }
};

function updateStatus() {
  request(vlcRequest, (err, response, body) => {
    if (!rpc) {
      console.log(
        `RPC has not been initialized, trying again in ${interval /
          100} seconds...`
      );
      return;
    }

    if (err) {
      console.log(
        `HTTP server not responding, trying again in ${interval /
          100} seconds...`
      );
      rpc.setActivity();
      return;
    }

    const vidState = JSON.parse(body);
    const time = vidState.time;
    const title = cleanName(vidState.information.category.meta.filename);
    const picKey = pictureKey(title);

    rpc.setActivity({
      details: title,
      state: 'watching',
      startTimestamp: moment()
        .subtract(time, 'seconds')
        .toDate(),
      largeImageKey: `${picKey}`,
      largeImageText: title,
      smallImageKey: `${picKey}`,
      smallImageText: title,
      instance: false
    });
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
  return input
    .substr(0, 5)
    .toLowerCase()
    .trim();
}

// Initialize Discord RPC
const rpc = new DiscordRpc.Client({ transport: 'ipc' });

rpc.on('ready', () => {
  updateStatus();
  setInterval(updateStatus, interval);
});

rpc.login(clientId).catch(console.error);
