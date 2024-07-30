// validate html with regex
function isHtmlValid(html) {
  const regexForHTML = /<([A-Za-z][A-Za-z0-9]*)\b[^>]*>(.*?)<\/\1>/;
  let is_valid = regexForHTML.test(html);
  if (is_valid) return true
  return false;
}

const isUrlAbsolute = function(urlString) {
  try {
    new URL(urlString);
    return true
  } catch (_) {
    return false
  }
}
exports.isUrlAbsolute = isUrlAbsolute;

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

// give this function some json & get the jobs json back if they exist, else get an empty array
// checks .job & .source.job for jobs data
// also turns the jobs into a proper array if the jobs data is just a single object (1 job only in the source)
// used in fetchJobsJson()
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