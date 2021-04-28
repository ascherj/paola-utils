// require('dotenv').config();
// this only working with path
// const path = require('path');
// require('dotenv').config({
//   path: path.resolve('config.env'),
// });
// const GSheets = require('./googleSheets');
// const GGroups = require('./googleGroups');
// const GMail = require('./googleMail');
// const Salesforce = require('./salesforce');
// const GitHub = require('./github');
// const Learn = require('./learn');
// const Slack = require('./slack');
const GCalendar = require('./googleCalendar');
// const subjectQuery = 'upcoming deadline';
// const toList = ['paola@galvanize.com'];
// const ccList = [];
// const bccList = [];
// const mergeFields = {
//   name: 'Bob',
//   deadline: 'Nov 1, 2020',
//   part: 99,
//   days: 2,
// };
// const alias = { name: 'SEI Precourse', email: 'sei.precourse@galvanize.com' };
// GMail.sendEmailFromDraft(subjectQuery, toList, ccList, bccList, alias, mergeFields);
// ------------------------------
// API Integrations
// ------------------------------
// Prerequisites and Limitations:
//
//  ⁃ Get API credentials for each API
//  ⁃ Determine rate limits of each API
//  ⁃ Make a list of required docs page links to inform each function's implementation
//
//  TDD:
//
//  ⁃ Write tests that verify success for each function
//  ⁃ Write tests to verify successful handling of errors for each function
// TODO: Ultimately, we'll remove helloWorld. Just a test to make sure the NPM module is working :)
// exports.helloWorld = () => 'Hello World, I\'m Paola!';
// exports.GSheets = GSheets;
// exports.GGroups = GGroups;
// exports.GMail = GMail;
// exports.Salesforce = Salesforce;
// exports.GitHub = GitHub;
// exports.Learn = Learn;
// exports.Slack = Slack;
exports.GCalendar = GCalendar;
// list of student names
// const list = [
//   "test mcTesterson",
//   "prueba mcPrueba"
// ];
// console.log(Slack.createChannelPerStudent(list));
GCalendar.listEvents();
