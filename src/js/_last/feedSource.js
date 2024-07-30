// this works to talk back to any wordpress site using the custom endpoint, cross origin
// will get data from any valid source
// probably can change this one to talk to the proxy...
class JsonFromXml {

	#proxy;
	#proxy_url;

	constructor(url, params = { remote: false, mode: 'wp' }) {

		// public
		this.el = '';
		this.url = url;
		this.params = params;

		// private
		this.#proxy = 'https://proxy.com/'; // which ever proxy...
		if(this.params.mode == 'wp'){
			this.#proxy = '/wp-json/midlandjobs/v1/customFeed';
		}
		this.#proxy_url = encodeURI(this.#proxy) + "?url=" + encodeURIComponent(this.url);

	}

	//
	// Utility methods
	// should these be public, private, static etc...
	//
	isObjectWithData(obj) {
		const isObjectEmpty = (_obj) => {
			return (
				_obj &&
				Object.keys(_obj).length === 0 &&
				_obj.constructor === Object
			);
		};
		const isObject = (_obj) => {
			return (
				_obj != null &&
				_obj.constructor.name === "Object"
			);
		};
		if (isObject(obj)) {
			if (isObjectEmpty(obj)) {
				return false;
			}
			return true;
		}
		return false;
	}

	//
	// Validation methods
	// should these be public, private, static etc...
	//
	isFeedTargetAvailable() {
		if (document.getElementById(this.id)) return true;
		return false;
	}
	isFeedUrlValid() {
		const isValidUrl = urlString => {
			var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
				'((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
				'(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
				'(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
			return !!urlPattern.test(urlString);
		}
		if (this.url) {
			if (isValidUrl(this.url)) return true;
		}
		return false;
	}
	isFeedParamsValid() {
		if (this.isObjectWithData(this.params)) {
			return true;
		}
		return false;
	}
	isHtmlValid(html) {
		const regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
		let is_valid = regexForHTML.test(html);
		if (is_valid) return true
		return false;
	}
	isElementValid(el) {
		if (el && typeof (el) != 'undefined' && el != null) return true;
		return false;
	}

	//
	// Other methods
	// should these be public, private, static etc...
	//
	createContextFromJson(json) {
		let context = {};
		if (json.publisher) context.publisher = json.publisher;
		if (json.publisherurl) context.publisher_url = json.publisherurl;
		if (json.lastBuildDate) context.last_build_date = json.lastBuildDate;
		if (json.job) context.jobs = json.job;
		if(this.params && this.isFeedParamsValid()) context.remote = this.params.remote;
		return context;
	}

	//
	// Output/Async methods
	// return promises/data
	// uses await
	// uses try/catch
	//

	// await fetch, try/catch server/xml errors
	async fetchFeedJson(report = true) {

		let json;
		var _mode = 'cors';
		if(this.params.mode == 'wp') var _mode = 'same-origin';

		try {
			
			const response = await fetch(this.#proxy_url, {

				method: "GET", // *GET, POST, PUT, DELETE, etc.
				mode: _mode, // no-cors, *cors, same-origin
				// cache: "no-store", // *default, no-cache, reload, force-cache, only-if-cached
				// headers: {
				// 	'Midland-Jobs-Feeds-Api-Key': '614d0eca-8d94-4e13-ba09-8c61c126c69b',
				// 	'Midland-Jobs-Feeds-Api-Host': 'midlandjobs.ie',
				// },

			});
			json = response.json();

			if (report) {
				if (!response.ok) throw new Error('A valid response was not returned from fetch. bad url given. ' + response.statusText);
				if (!json || json.length == 0 || json.error == true) throw new Error('No json was returned. bad url given.');
			}

		}
		catch (err) {

			if (report) {
				if (err instanceof SyntaxError) console.log('There was a SyntaxError (Unexpected token < in JSON).', err);
				else if (err instanceof TypeError) console.log('There was an issue connecting to the necessary server.', err);
				else console.log('The response was not ok.', err)
			}

		}

		// if (json) console.log(json); // log the response. valid JSON responses should be coming from api anyway..........
		if (json) return json; // promise returned
	}

}

// same orgin source, direct file access. 
// will only get data hosted on same origin (midlandjobs.ie hosted files, within smartjobboard)
class JsonFromXml {

	constructor(url) {
		this.url = url;
	}

	async fetchFeedJson() {
		try {
			const response = await fetch(this.url);
			const content = await response.text();
			const data = await parser.parseStringPromise(content);
			return data;
		} catch (e) {
			console.log({ e });
		}
	}

	xmlToJson(callback) {
		var req = http.get(this.url, function (res) {
			var xml = '';

			res.on('data', function (chunk) {
				xml += chunk;
			});

			res.on('error', function (e) {
				callback(e, null);
			});

			res.on('timeout', function (e) {
				callback(e, null);
			});

			res.on('end', function () {
				parseString(xml, function (err, result) {
					callback(null, result);
				});
			});
		});
	}

}