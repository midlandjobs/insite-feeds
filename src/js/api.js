//
//
// requires
//
//
const fns = require('./_fns.cjs'); // general functions

//
//
// json from xml class (3rd party api version)
//
//
class __JsonFromXml {

	constructor(url = null, proxy = null, key = null) {

		// set the initial fetch mode
		this.mode = 'cors'

		// the URL: an XML resource
		if(fns.isUrlValid(url)) this.url = url;

		// if proxy is relative, make it absolute
		if(!fns.isUrlAbsolute(proxy)) proxy = new URL(proxy, document.baseURI).href;

		// if URL & valid proxy URL
		if(this.url && fns.isUrlValid(proxy)) {
			if(proxy.includes(window.location.host)) this.mode = 'same-origin'; // reset mode for local proxies (like wp)
			this.proxy_url = encodeURI(proxy) + "?url=" + encodeURIComponent(this.url); // define proxy_url property from url & proxy
		}


		//
		// key for check
		//
		this.key = null;
		if(fns.isKeyValid(key) && (typeof key === 'string' || key instanceof String)) this.key = key;

	}

	async fetchFeedJson() {

		var json = {};

		try {

			if(!this.url) throw new Error('Config error', { cause: 'URL is missing' });
			if(!fns.isUrlValid(this.proxy_url)) throw new Error('Config error', { cause: 'Proxy is missing or invalid' });
			if(!this.key) throw new Error('Config error', { cause: 'API key is missing or invalid' });

			var response = await fetch(this.proxy_url, {
				mode: this.mode,
				headers: {
					'Midland-Jobs-Feeds-Api-Key': this.key
				},
			});

			// if(response.json().length > 0)
			if(!response.ok) {
				throw new Error('Network error', { cause: 'Proxy server is online, but the location is invalid.' }); // server is online, but returns 404 or such error (page error)
			} else {
				const contentType = response.headers.get('content-type');
				if(contentType && contentType.includes('application/json')) {
					json = response.json();
				} else {
					throw new Error('Content error', { cause: 'Proxy server is online, but response is not valid Json.' }); // server & page is online, but doesnt return valid Json (content error)
				}
			}

		} catch (e) {

			if(e.cause){
				json.error = e.cause; // server is online here, but has some other error above from above....
			} else {
				json.error = 'Proxy server is down or not configured properly.'; // server error: server is down
			}

		} finally {

			return json;

		}

	}

}

//catalog the check performed 

// 1. api key***
// 2. url paramter in get request set to false or  null.yes
// 3. url paramter in get request is empty .yes
// 4. invalid URL check using FILTER_VALIDATE_URL
// url should be for q local resource only (local build).yes
// 5. check for .xml extension in url.yes

class JsonFromXml {

	constructor(url = null, proxy = null, key = null) {

    this.url = url;
    this.proxy = proxy;
    this.key = key;

		// the URL: an XML resource
		// if(fns.isUrlValid(url)) this.url = url;

		// // if proxy is relative, make it absolute
		// if(!fns.isUrlAbsolute(proxy)) proxy = new URL(proxy, document.baseURI).href;

		// // if URL & valid proxy URL
		// if(this.url && fns.isUrlValid(proxy)) {
		// 	if(proxy.includes(window.location.host)) this.mode = 'same-origin'; // reset mode for local proxies (like wp)
		// 	this.proxy_url = encodeURI(proxy) + "?url=" + encodeURIComponent(this.url); // define proxy_url property from url & proxy
		// }


		//
		// key for check
		//
		this.key = null;
		if(fns.isKeyValid(key) && (typeof key === 'string' || key instanceof String)) this.key = key;

	}

	async fetchFeedJson() {

		var json = {};
    var mode = 'cors';
    var proxy_url = '';
    var api_key = '';

		try {

      // PREVIOUS URL CHECKS
			// if(!this.url) throw new Error('Config error', { cause: 'URL is missing' });
			// if(!fns.isUrlValid(this.proxy_url)) throw new Error('Config error', { cause: 'Proxy is missing or invalid' });
			// if(!this.key) throw new Error('Config error', { cause: 'API key is missing or invalid' });

			// url check/s
			if(this.url){
				if(this.url === '') throw new Error('Bad URL', { cause: 'Please provide a URL to a valid XML source.' }); // just incase. empty url
				if(!fns.isUrlValid(this.url)) throw new Error('Bad URL', { cause: 'The URL provided is not valid.' }); // badly formed url
				if(!fns.isUrlValid(this.url, {domain: document.location.hostname})) throw new Error('Bad URL', { cause: 'The URL provided should be for a resource within the current domain: '+document.location.hostname }); // resource needs to be local
				if(!fns.isUrlValid(this.url, {ext: '.xml'})) throw new Error('Bad URL', { cause: 'The URL provided is not for valid XML resource.' }); // not an xml extension
			} else {
				throw new Error('Bad URL', { cause: 'Please provide a URL to a valid XML source.' }); // no url
			}

			// proxy url check/s
      if(this.proxy){
        if(this.proxy === '') throw new Error('Bad Proxy', { cause: 'Please provide a valid proxy URL..' }); // just incase. empty url
        if(!fns.isUrlAbsolute(this.proxy)) this.proxy = new URL(this.proxy, document.baseURI).href;
        if(!fns.isUrlValid(this.proxy)) throw new Error('Bad Proxy', { cause: 'The proxy URL provided is not valid.' }); // badly formed url
        if(this.proxy.includes(window.location.host)) mode = 'same-origin';
        proxy_url = encodeURI(this.proxy) + "?url=" + encodeURIComponent(this.url); // define proxy_url property from url & proxy
      } else {
        throw new Error('Bad Proxy', { cause: 'Please provide a valid proxy URL..' }); // no url
      }

      // key check, basic.key gets checked again @ proxy
      if(fns.isKeyValid(this.key) === false || typeof this.key !== 'string') throw new Error('Bad API key', { cause: 'The APi key provided is invalid.' });

			var response = await fetch(proxy_url, {
				mode: mode,
				headers: {
					'Midland-Jobs-Feeds-Api-Key': this.key
				},
			});

			// if(response.json().length > 0)
			if(!response.ok) {
				throw new Error('Network error', { cause: 'Proxy server is online, but the location is invalid.' }); // server is online, but returns 404 or such error (page error)
			} else {
				const contentType = response.headers.get('content-type');
				if(contentType && contentType.includes('application/json')) {
					json = response.json();
				} else {
					throw new Error('Content error', { cause: 'Proxy server is online, but response is not valid Json.' }); // server & page is online, but doesnt return valid Json (content error)
				}
			}

		} catch (e) {

			if(e.cause){
				json.error = e.cause; // server is online here, but has some other error above from above....
			} else {
				json.error = 'Proxy server is down or not configured properly.'; // server error: server is down
			}

		} finally {

			return json;

		}

	}

}

//
//
// this function is used to get jobs json from a given url to a valid xml file/source
// this function is the same between api.js & local.js, the only difference being which JsonFromXml is set above 
//
//

// proxy is designed to always return json regardless of URL given
// the proxy will validate the url and return valid json if available, otherwise it will return errors in json
// it will always return json tho

// so 
async function fetchJobsJson(url = null, params = {proxy: null, key: null}) {
  try {
    const obj = new JsonFromXml(url, params.proxy, params.key)
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
async function __fetchJobsJson(url) {
  try {
    const obj = new JsonFromXml(url)
    const xmlToJson = await obj.fetchFeedJson();
		console.log(xmlToJson);
		if(xmlToJson) var jobs = fns.jsonToJobs(xmlToJson);
		console.log(jobs);
		if(xmlToJson){
			var jobs = fns.jsonToJobs(xmlToJson);
			if(jobs){
				console.log(jobs);
				return jobs;
			} else {
				throw "myException";
			}
		} else {
			throw "myException2";
		}
  } catch (e) {
		console.log('error!!');
    console.log({ e });
  }
}
window.fetchJobsJson = fetchJobsJson; // we add this function to window context so can be used on frontend to get jobs json from xml source

//
//
// require the rest of the frontend stuff (uikit, filter.js & the windowed JobBoardFilteredFeed class)
//
//
require('./_front.cjs');