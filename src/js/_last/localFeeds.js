// xmlToJson()
// import xml2js from 'xml2js'
var parseString = require('xml2js').parseString;
var http = require('http');

// getXMLfromURL()
// import xml2js from 'xml2js';
// const parser = new xml2js.Parser();
const parser = require('xml2js').Parser({ explicitArray: false });

import './filteredFeeds.js';
// import JobBoardFilteredFeed from './feeds.js';
// window.JobBoardFilteredFeed = JobBoardFilteredFeed;