//
//
// requires
//
//
const fns = require('./_fns.cjs'); // general functions

//
//
// json from xml class (local version)
//
//
class JsonFromXml {

	constructor(url = null) {
		this.url = url;
	}

	//
	//
	// create the class object with a url to some valid xml file
	// call this method on the object to get back the given xml as json
	// we will reform the data as jobs proper at a later point
	//
	// adds 173KB to the package
	// this method DOESNT turn job fields into arrays
	//
	//

	// this should do the same checks as done in the php api
	// this function should be deigned where it is always expecting json no matter what.
	// if the checks fail, return json with errors, as in the php api. 
	// fetchJobsJson should be the one to do the checks on the json, for like length etc
	// api and local will both expect json from fetchJobsJson, regardless of input, the json just might have jobs or an error
	// then fetchJobsJson can do the rest
	async fetchFeedJson() {

		var json = {};

		try {

			// url check/s
			if(this.url){
				if(this.url === '' || typeof this.url !== 'string') throw new Error('Bad URL', { cause: 'Please provide a URL to a valid XML source.' }); // just incase. empty url
				if(!fns.isUrlAbsolute(this.url)) this.url = new URL(this.url, document.baseURI).href;
				if(!fns.isUrlValid(this.url)) throw new Error('Bad URL', { cause: 'The URL provided is not valid.' }); // badly formed url
				if(!fns.isUrlValid(this.url, {domain: document.location.hostname})) throw new Error('Bad URL', { cause: 'The URL provided should be for a resource within the current domain: '+document.location.hostname }); // resource needs to be local
				if(!fns.isUrlValid(this.url, {ext: '.xml'})) throw new Error('Bad URL', { cause: 'The URL provided is not for valid XML resource.' }); // not an xml extension
			} else {
				throw new Error('Bad URL', { cause: 'Please provide a URL to a valid XML source.' }); // no url
			}

			// do the fetch
			var response = await fetch(this.url);

			if(response.ok) {
				const content = await response.text();
				if(content.length > 0){
					const parser = require('xml2js').Parser({ explicitArray: false });
					json = await parser.parseStringPromise(content);
				} else {
					throw new Error('Content error', { cause: 'A valid XML resource was located but it\'s content is empty.' });
				}
			} else {
				throw new Error('Content error', { cause: 'No result gotten from request. Please check the URL provided.' });
			}

		}
		
		catch (e) {

			if(e.cause){
				json.error = e.cause;
			} else {
				json.error = 'Local host is offline or not configured properly.';
			}

		}

		finally {

			return json;

		}

	}

	//
	//
	// This is an alternative way to do fetchFeedJson() using some extra/different libraries
	//
	// adds 209kb to the package, plus 172kb from parseXml()
	// this method DOES turn job fields into arrays
	//
	// leave these methods commented out to reduce the package size. above's fetchFeedJson() seems a better way anyway
	//
	//

	// async _fetchFeedJson() {
  //   return new Promise((resolve, reject) => {
	// 		const https = require('https');
	// 		const bl = require('bl');
	// 		https.get(this.url, response => {
	// 			response.setEncoding('utf8');
	// 			response.pipe(bl((err, data) => {
	// 				if(err) reject(err);
	// 				var self = this;
	// 				(async function () {
	// 					var stuff = await self.parseXml(data);
	// 					resolve(stuff);
	// 				})();
	// 			}));
	// 		});
  //   });
	// }

	// async parseXml(xml) {
	// 	return new Promise((resolve, reject) => {
	// 		const parseString = require('xml2js').parseString;
	// 		parseString(xml, (err, data) => {
	// 			if(err) reject(err);
	// 			resolve(data);
	// 		});
	// 	});
	// }

}

//
//
// this function is used to get jobs json from a given url to a valid xml file/source
// this function is the same between api.js & local.js, the only difference being which JsonFromXml is set above 
//
//
async function fetchJobsJson(url = null, proxy = null) {
  try {
    const obj = new JsonFromXml(url);
    const response = await obj.fetchFeedJson();
		if(!response.error){
			var jobs = fns.jsonToJobs(response);
			if(jobs.length <= 0) throw new Error('A valid XML resource was provided, but no jobs data was found at the source.'); // no jobs found in the data!
		} else {
			throw new Error(response.error);
		}
    return jobs;
  } catch (e) {
		return e;
  }
}
window.fetchJobsJson = fetchJobsJson; // we add this function to window context so can be used on frontend to get jobs json from xml source

//
//
// require the rest of the frontend stuff (uikit, filter.js & the windowed JobBoardFilteredFeed class)
//
//
require('./_front.cjs');