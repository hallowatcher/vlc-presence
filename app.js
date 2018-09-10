const request = require('request');
const DiscordRpc = require('discord-rpc');
const moment = require('moment');
const anitomy = require('anitomy-js');
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
  request(vlcRequest, async (err, response, body) => {
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
    const animeData = await getAnimeData(
      vidState.information.category.meta.filename
    );

    // Gather anime data
    const title = animeData.anime_title;
    const episode = animeData.episode_number;

    // Placeholder
    const picKey = pictureKey(animeData.anime_title);

    rpc.setActivity({
      details: title,
      state: `Ep. ${episode}`,
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

function getAnimeData(input) {
  return anitomy.parse(input);
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
