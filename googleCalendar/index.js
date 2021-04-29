/* eslint-disable camelcase */
const fs = require('fs');
const util = require('util');
const readline = require('readline');
const { google } = require('googleapis');

// If modifying these scopes, delete token.json.
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/calendar.events',
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = './googleCalendar/token.json';

const readFile = util.promisify(fs.readFile);

/**
 * Get and store new token after prompting for user authorization.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @returns {Promise<google.auth.OAuth2>} A Promise resolving an authorized OAuth2 client.
 */
function getAccessToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) reject(err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) reject(err);
          console.log('Token stored to', TOKEN_PATH);
          resolve(oAuth2Client);
        });
      });
    });
  });
}

/**
 * Create an OAuth2 client with the given credentials.
 * @param {Object} credentials The authorization client credentials.
 * @returns {google.auth.OAuth2} An authorized OAuth2 client.
 */
async function authorize(credentials) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  try {
    const token = await readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  } catch (err) {
    // No token found; get token.
    return getAccessToken(oAuth2Client);
  }
}

/**
 * List the next 10 events on the user's primary calendar.
 */
exports.listEvents = async () => {
  try {
    const credentials = await readFile('./googleCalendar/credentials.json');
    const auth = await authorize(JSON.parse(credentials));
    const calendar = google.calendar({ version: 'v3', auth });

    calendar.events.list({
      calendarId: 'primary',
      timeMin: (new Date()).toISOString(),
      maxResults: 10,
      singleEvents: true,
      orderBy: 'startTime',
    }, (err, res) => {
      if (err) return console.error('The API returned an error:', err);
      const events = res.data.items;
      if (events.length) {
        console.log('Upcoming 10 events:');
        events.map((event, i) => {
          const start = event.start.dateTime || event.start.date;
          console.log(`${start} - ${event.summary}`);
        });
      } else {
        console.log('No upcoming events found.');
      }
    });
  } catch (err) {
    console.error('IT DIDNT WORK', err);
  }
};

/**
 * Add an event to the authorized user's calendar via Quick Add.
 * @param {string} text The text to use as the title of the event.
 */
exports.addEvent = async (text) => {
  try {
    const credentials = await readFile('./googleCalendar/credentials.json');
    const auth = await authorize(JSON.parse(credentials));
    const calendar = google.calendar({ version: 'v3', auth });

    calendar.events.quickAdd({
      calendarId: 'primary',
      text,
    }, (err, res) => {
      if (err) return console.log('The API returned an error:', err);
      console.log('Successfully added an event!', res);
    });
  } catch (err) {
    console.log(err);
  }
};
