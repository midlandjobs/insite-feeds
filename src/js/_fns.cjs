//
// VALIDATION
//

// validate html with regex
function isHtmlValid(html) {
  const regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
  let is_valid = regexForHTML.test(html);
  if (is_valid) return true
  return false;
}

// validate api key with regex
const isKeyValid = function(key) {
	return /^[A-Za-z0-9]*$/.test(key);
}
exports.isKeyValid = isKeyValid;

// validate url with regex
const isUrlValid = function(url, params = {}) {
  const isValidUrl = urlString => {
    var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
      '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
      '((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
      '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
      '(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
      '(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
    return !!urlPattern.test(urlString);
  }
  if(url) {
    if(!isValidUrl(url)) return false; // validity of URL via regex
    if(params.domain && !url.includes(params.domain)) return false; // specific domain check. can perform other checks with string.includes
    if(params.ext && !url.includes(params.ext)) return false; // specific extension check
    return true
  }
  return false;
}
exports.isUrlValid = isUrlValid;

//
// CHECKS
//

// check if url is absolute
const isUrlAbsolute = function(urlString) {
  try {
    new URL(urlString);
    return true
  } catch (_) {
    return false
  }
}
exports.isUrlAbsolute = isUrlAbsolute;

// check if data is object literal
const isLiteralObject = function(obj) {
  return (!!obj) && (obj.constructor === Object);
}
exports.isLiteralObject = isLiteralObject;

// check if element is valid
const isElementValid = function (el) {
  if (el && typeof (el) != 'undefined' && el != null) return true;
  return false;
}
exports.isElementValid = isElementValid;

// general function for sorting the job's json data by a given key
const sortDataBy = function (data, byKey) {
  let sortedData;
  if (byKey == 'title') {
    sortedData = data.sort(function (a, b) {

      let x = a.title.toLowerCase();
      let y = b.title.toLowerCase();

      if (x > y) { return 1; }
      if (x < y) { return -1; }

      return 0;
    });
  }
  else if (byKey == 'date') {
    sortedData = data.sort(function (a, b) {

      let x = new Date(a.date);
      let y = new Date(b.date);

      // Compare the 2 dates
      if (x < y) return -1;
      if (x > y) return 1;

      return 0;
    });
  }
  else if (byKey == 'referencenumber') {
    sortedData = data.sort(function (a, b) {

      let x = a.referencenumber;
      let y = b.referencenumber;

      // Compare the 2 referencenumbers
      if (x < y) return -1;
      if (x > y) return 1;

      return 0;
    });
  }
  else if (byKey == 'random') {

    sortedData = data
      .map(value => ({ value, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ value }) => value);

  }
  return sortedData;
}
exports.sortDataBy = sortDataBy;

//
// OTHER
//

// give this function some json & get the jobs json back if they exist, else get an empty array
// checks .job & .source.job for jobs data
// also turns the jobs into a proper array if the jobs data is just a single object (1 job only in the source)
// used in api.js & local.js ->  fetchJobsJson()
const jsonToJobs = function(json){

  var jobs = []; // no jobs yet! we will return this empty array if no jobs get created below

  // check for job data in the json
  if(json.job) jobs = json.job;
  if(json.source && json.source.job) jobs = json.source.job;

  // if jobs is not already an array (instead its a single job object) then we turn it into an array containing the object
  // this is necessary in cases where the jobs data only has 1 job in it
  if(typeof jobs === 'object' && !Array.isArray(jobs)){
    var _jobs = [];
    _jobs.push(jobs);
    jobs = _jobs;
  }

  return jobs;

};
exports.jsonToJobs = jsonToJobs;