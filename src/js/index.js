// xmlToJson()
// import xml2js from 'xml2js'
var parseString = require('xml2js').parseString;
var http = require('http');

// getXMLfromURL()
// import xml2js from 'xml2js';
// const parser = new xml2js.Parser();
const parser = require('xml2js').Parser({ explicitArray: false });

import UIkit from 'uikit'; // import uikit
import Icons from 'uikit/dist/js/uikit-icons'; // import uikit icons

UIkit.use(Icons); // use the Icon plugin
window.UIkit = UIkit; // Make uikit available in window for inline scripts

class JsonFromXmlFeed {

	constructor(url) {
		this.url = url;
	}

	async fetchJsonFromXmlSource() {
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

//
// filtered feeds
//

// requirements
import $ from 'jquery';
import './filter.js';

// templates: main/wrap 
import main_template from './static-components/main.html';
import main_sidebar_template from './static-components/main_sidebar.html';

// templates: partials
import job_template from './static-components/job.html';
import checkbox_template from './static-components/checkbox.html'; // checkbox
import option_template from './static-components/option.html'; // dropdown
// import error_template from './static-components/error.html';

// templates: more partials
import count_template from './static-components/_count.html';
import filters_template from './static-components/_filters.html';
import jobswrap_template from './static-components/_jobswrap.html';
import topbar_template from './static-components/_topbar.html';
import divider_template from './static-components/_divider.html';
import search_template from './static-components/_search.html';
import company_template from './static-components/_company.html';
import jobtype_template from './static-components/_jobtype.html';
import city_template from './static-components/_city.html';
import cats_template from './static-components/_cats.html';
import pagi_template from './static-components/_pagi.html';
import perpagi_template from './static-components/_perpagi.html';

// the class itself. the jobboard version...
// notes.. currently, jobs count requires pagination to be active, because the filters callback only fires when pagintion fires
export default class JobBoardFilteredFeed {

	constructor(sel, url, params = { sorting: false, scope: '.uk-scope', active_filters: false, active_pagination: false, active_perpage: false, active_search: false, active_counts: false, disable_cats: false, disable_cities: false, disable_companies: false, disable_jobtypes: false }) {

		// this.hello = 'https://stackoverflow.com/questions/20279484/how-to-access-the-correct-this-inside-a-callback';

		//
		// 1. the constructor properties
		//
		this.sel = sel; // element id or selector
		this.url = url; // url to xml source
		this.params = params; // extra paramaters/settings
		if (this.params.scope) UIkit.container = this.params.scope; // scoping for uikit

		//
		// testing properties...
		//
		// this.active_filters = this.params.active_filters;
		// this.active_pagination = this.params.active_pagination;
		// this.active_perpage = this.params.active_perpage;
		// this.active_search = this.params.active_search;
		// this.active_counts = this.params.active_counts;

		//
		// 2. here we are adding the jobs as a property of the object, if all is good...
		// we check if the given url is valid/good, & spit error if not...
		// if url IS good, we attempt to fetch the jobs using JsonFromXmlFeed object & it's fetchJsonFromXmlSource() method (using async, returning a promise etc.)
		// if NO jobs are found in data, we spit an error....
		// if we DO have jobs, we add them as class property...
		// we then check the given selector to see if it equates to an actual element in the dom
		// we check the sel WITHIN the async wrapper, coz the rest of dom SHOULD be rendered by the time the async is done..
		// this means we can write the script to init the object, both BEFORE & AFTER the html element it is trying to select...
		// this just means we can place the init script ABOVE the html element, i.e the html element doesnt have to exist before the script for it to work...
		// and finally.... if the jobs are good and the select element is good, we renderTheJobs()
		// in renderTheJobs(), we already have the jobs data, we are just setting it up with the filters functionality, and placing it into the HTML
		//

		//
		// 2.a. if the given url is INVALID
		//
		if (!this.isUrlValid(this.url)) {
			console.log('invalid source url given.'); // console log the issue
		}

		//
		// 2.b. if the given url is VALID
		//
		else {
			const feedObj = new JsonFromXmlFeed(this.url);
			(async () => {
				const json = await feedObj.fetchJsonFromXmlSource(); // xml as json, await the promise of data

				// no jobs found in source
				if (!json.source.job || json.source.job.length <= 0) {
					console.log('no jobs data available from given source, tho the url was valid'); // console log the issue
					if (this.isElementValid(document.querySelector(this.sel))) this.renderErrorTemplate(this.sel); // render the error template. this template should say no jobs found & be placed in html, but be hidden
				}

				// jobs found in source, yay!
				else {
					this.jobs = json.source.job; // the jobs array, added as an object property now

					// INVALID element selector given
					if (!this.isElementValid(document.querySelector(this.sel))) {
						console.log('invalid element selector given. jobs could not be rendered to the page, but still exist in json, as a property of the JobBoardFilteredFeed object.');
					}

					// VALID element selector given, yay!
					else {
						this.renderTheJobs(this.jobs); // finally, render the jobs....
					}

				}

			})();
		}

	}

	// the principal renderer. 
	// calls renderMainTemplate()...
	// and populateFilters(), which sets up & populates the filter's data...
	// and FilterJS(), which configs the filters scipts...
	// and also sorts the jobs & does some additional template stuff
	renderTheJobs(jobs) {

		// if jobs is not an array (a single job object) turn it into an array containing the object
		if(typeof jobs === 'object' && !Array.isArray(jobs)){
			var _jobs = [];
			_jobs.push(jobs);
			jobs = _jobs;
		}

		//
		// render the wrapper template to start... waiting for jobs first. object can be placed above or below html, but all html pops in together. can just use a loader animation...
		//
		this.renderMainTemplate(this.sel);

		//
		// sort the jobs according to object params
		//
		if (this.params.sorting == 'title') jobs = this.sortDataBy(jobs, 'title');
		if (this.params.sorting == 'date') jobs = this.sortDataBy(jobs, 'date');
		if (this.params.sorting == 'referencenumber') jobs = this.sortDataBy(jobs, 'referencenumber');
		if (this.params.sorting == 'random') jobs = this.sortDataBy(jobs, 'random');

		//
		// setup new jobs data & then populate filters (if filters are not disabled)
		//
		this.populateFilters(jobs);

		//
		// job template stuff
		//
		var _template = false;
		var _template_html = job_template;
		if (this.isElementValid(document.querySelector('#job-template'))) var _template = '#job-template';
		if (this.isElementValid(document.querySelector('#job-template'))) var _template_html = false;

		//
		// filters: updating the counts - a callback for later (inside FilterJS())
		//
		var filter_callbacks = {
			afterFilter: function (result, jQ) {
				var initial_results = jobs; // initial jobs/result before any filtering done to them
				if(this.params.active_pagination && this.params.active_counts) updateCountsLogic(result, jQ, initial_results, this.params.active_search, this.params.disable_cats, this.params.disable_cities, this.params.disable_jobtypes, this.params.disable_companies);
				if(this.params.active_pagination) hidePagination();
				if(this.params.active_pagination && this.params.active_perpage) hidePerPage(result);
			}.bind(this)
		};

		//
		// other stuff for the filters configs, selective
		//
		var _pagination_template = false;
		var _perpage_template = false;
		// pagination & perpage templates to be used in FilterJS(): if element with id is in dom, set var to that id
		if (this.isElementValid(document.querySelector('#pagination-template'))) var _pagination_template = '#pagination-template';
		if (this.isElementValid(document.querySelector('#perpage-template'))) var _perpage_template = '#perpage-template';

		var the_pagination = false;
		// setup the pagination & perpage array to be used in FilterJS(), selectivley
		if(this.params.active_pagination){
			var the_pagination = {
				container: '#pagination', // define container for pagi
				visiblePages: 5, // set init visible pages
				paginationView: _pagination_template,
				perPage: false
			};
			if(this.params.active_perpage){
				the_pagination.perPage = {
					values: [12, 15, 18], // per page dropdown options
					container: '#per_page', // per page container
					perPageView: _perpage_template,
				};
			}
		}

		var the_search = false;
		// set th ele for the searchbox, to be used in FilterJS()
		if(this.params.active_search) var the_search = { ele: '#searchbox' };

		//
		// activate filters & configs
		//
		var FJS = FilterJS(jobs, '#jobs', {
			template: _template, // set to false so we can use pre rendered html template
			template_html: _template_html, // define template for job
			search: the_search, // define search box
			pagination: the_pagination, // define pagination & perpage elements
			callbacks: filter_callbacks, // callbacks, after filtering.. redo counts, filters etc...
		});

		//
		// activate filter criterias
		//
		if (this.params.active_filters) {
			if (this.params.disable_cities != true) FJS.addCriteria({ field: 'city', ele: '#city_filter', all: 'all' });
			if (this.params.disable_jobtypes != true) FJS.addCriteria({ field: 'jobtypes', ele: '#jobtype_filter', all: 'all' });
			if (this.params.disable_companies != true) FJS.addCriteria({ field: 'company', ele: '#company_filter', all: 'all' });
			if (this.params.disable_cats != true) FJS.addCriteria({ field: 'categories', ele: '#categories_criteria input:checkbox', all: 'all' });
		}

		//
		// afterFilter wont get fired unless pagination is set...
		// so when pagination is false but active counts is still active, we set the counts here manually. 
		//
		if(this.params.active_counts && !this.params.active_pagination) setInitialCounts(jobs.length);

	}

	// getting & populating the filter's data
	populateFilters(jobs) {
		if (jobs) {

			//
			// manipulate the job items data here...
			//
			for (let job of jobs) {

				if (job.category.length > 0) job.categories = job.category.split(', '); // add as array
				if (job.jobtype.length > 0) job.jobtypes = job.jobtype.split(', '); // add as array
				if (job.companywebsite.length > 0) {
					const withHttp = url => !/^https?:\/\//i.test(url) ? `http://${url}` : url;
					const companywebsiteWithHttp = withHttp(job.companywebsite);
					job.companywebsite = companywebsiteWithHttp;
				}
				// if (job.description.length > 0) {}

			}

			//
			// reform data for categories
			//
			if(this.params.disable_cats != true){

				const categories = [];
				for (let job of jobs) {
					for (let cat of job.categories) {
						categories.push(cat);
					}
				}
	
				// filters the categories array to remove the duplicates
				var unique_categories = categories.filter(function (value, index, array) {
					return array.indexOf(value) === index;
				});
	
				// disable some cats from the categories for filtering. provided as an array in params. check the params exist first
				if(this.params.disable_cats && this.params.disable_cats.length > 0){
					var unique_categories = unique_categories.filter(function (value, index, array) {
						if(!this.params.disable_cats.includes(value)) return value;
					}.bind(this));
				}
	
				// render the new data now into the filters
				if (this.params.active_filters) this.renderCheckboxesTemplate(unique_categories, '#categories_criteria');

			}
			
			//
			// reform data for cities
			//
			if(this.params.disable_cities != true){
				const cities = [];
				for (let job of jobs) {
					if (Object.keys(job.city).length == 0) job.city = 'Midlands';
					cities.push(job.city);
				}
				var unique_cities = cities.filter(function (value, index, array) {
					return array.indexOf(value) === index;
				});
				// render the new data now into the filters
				if (this.params.active_filters) this.renderOptionsTemplate(unique_cities, '#city_filter');
			}

			//
			// reform data for jobtypes
			//
			if(this.params.disable_jobtypes != true){
				const jobtypes = [];
				for (let job of jobs) {
					for (let type of job.jobtypes) {
						jobtypes.push(type);
					}
				}
				var unique_jobtypes = jobtypes.filter(function (value, index, array) {
					return array.indexOf(value) === index;
				});
				// render the new data now into the filters
				if (this.params.active_filters) this.renderOptionsTemplate(unique_jobtypes, '#jobtype_filter');
			}

			//
			// reform data for companies
			//
			if(this.params.disable_companies != true){
				const companies = [];
				for (let job of jobs) {
					companies.push(job.company);
				}
				var unique_companies = companies.filter(function (value, index, array) {
					return array.indexOf(value) === index;
				});
				// render the new data now into the filters
				if (this.params.active_filters) this.renderOptionsTemplate(unique_companies, '#company_filter');
			}

		}
		// console.log(jobs);
		return jobs;
	}

	// render method
	// the main wrapper template
	renderMainTemplate(sel) {

		// check if a template exists in the DOM for main.html first & use that, else just use main.html
		if (this.isElementValid(document.querySelector('#main-template'))) {

			var html = $('#main-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
			container.empty().append(templateFn({}))

		} else {

			if(this.params.active_counts || this.params.active_filters || this.params.active_search){
				var html = main_sidebar_template;
			} else {
				var html = main_template;
			}

			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
			container.empty().append(templateFn({}))

		}

		// partial: test
		// var hello_html = hello_template;
		// var hello_templateFn = FilterJS.templateBuilder(hello_html);
		// var hello_container = $('#Hello');
		// hello_container.empty().append(hello_templateFn({}))

		// this.params.active_filters
		// this.params.active_pagination
		// this.params.active_perpage
		// this.params.active_search
		// this.params.active_counts

		// partial: #FiltersCount
		if(this.params.active_counts){
			var count_html = count_template;
			var count_templateFn = FilterJS.templateBuilder(count_html);
			var count_container = $('#FiltersCount');
			count_container.empty().append(count_templateFn({}))
		}
		
		// partial: #FiltersDivider
		if((this.params.active_filters || this.params.search) && this.params.active_counts){
			var divider_html = divider_template;
			var divider_templateFn = FilterJS.templateBuilder(divider_html);
			var divider_container = $('#FiltersDivider');
			divider_container.empty().append(divider_templateFn({}))
		}

		// partial: #FiltersList
		if(this.params.active_filters || this.params.active_search){
			var filters_html = filters_template;
			var filters_templateFn = FilterJS.templateBuilder(filters_html);
			var filters_container = $('#FiltersList');
			filters_container.empty().append(filters_templateFn({}))
		}

		// #searchFilters
		if(this.params.active_search){
			var search_html = search_template;
			var search_templateFn = FilterJS.templateBuilder(search_html);
			var search_container = $('#searchFilters');
			search_container.empty().append(search_templateFn({}))
		}
		if(this.params.active_filters){

			if (this.params.disable_companies != true) {
				var company_html = company_template;
				var company_templateFn = FilterJS.templateBuilder(company_html);
				var company_container = $('#companyFilters');
				company_container.empty().append(company_templateFn({}))
			}

			if (this.params.disable_jobtypes != true) {
				var jobtype_html = jobtype_template;
				var jobtype_templateFn = FilterJS.templateBuilder(jobtype_html);
				var jobtype_container = $('#jobtypeFilters');
				jobtype_container.empty().append(jobtype_templateFn({}))
			}

			if (this.params.disable_cities != true) {
				var city_html = city_template;
				var city_templateFn = FilterJS.templateBuilder(city_html);
				var city_container = $('#cityFilters');
				city_container.empty().append(city_templateFn({}))
			}

			if (this.params.disable_cats != true) {
				var cats_html = cats_template;
				var cats_templateFn = FilterJS.templateBuilder(cats_html);
				var cats_container = $('#catsFilters');
				cats_container.empty().append(cats_templateFn({}))
			}

		}

		// partial: #FiltersTopBar
		if(this.params.active_pagination){
			var topbar_html = topbar_template;
			var topbar_templateFn = FilterJS.templateBuilder(topbar_html);
			var topbar_container = $('#FiltersTopBar');
			topbar_container.empty().append(topbar_templateFn({}))

			var pagi_html = pagi_template;
			var pagi_templateFn = FilterJS.templateBuilder(pagi_html);
			var pagi_container = $('#filtersPagintion');
			pagi_container.empty().append(pagi_templateFn({}))

			if(this.params.active_perpage){
				var perpagi_html = perpagi_template;
				var perpagi_templateFn = FilterJS.templateBuilder(perpagi_html);
				var perpagi_container = $('#filtersPerPage');
				perpagi_container.empty().append(perpagi_templateFn({}))
			}
		}

		// partial: #FiltersJobsWrap
		var jobswrap_html = jobswrap_template;
		var jobswrap_templateFn = FilterJS.templateBuilder(jobswrap_html);
		var jobswrap_container = $('#FiltersJobsWrap');
		jobswrap_container.empty().append(jobswrap_templateFn({}))

	}

	// render method
	renderCheckboxesTemplate(data, sel) {

		// check if a template exists in the DOM for #checkbox-template first & use that, else just use main.html
		if (this.isElementValid(document.querySelector('#checkbox-template'))) {

			// console.log('template override exists');

			var html = $('#checkbox-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);

			$.each(data, function (i, c) {
				container.append(templateFn({ name: c, value: c }))
			});

		} else {

			// console.log('template override does not exist');

			var html = checkbox_template;
			var templateFn = FilterJS.templateBuilder(html)
			var container = $(sel);

			$.each(data, function (i, c) {
				container.append(templateFn({ name: c, value: c }))
			});

		}

	}

	// render method
	renderOptionsTemplate(data, sel) {

		// check if a template exists in the DOM for #checkbox-template first & use that, else just use main.html
		if (this.isElementValid(document.querySelector('#option-template'))) {

			// console.log('template override exists');

			var html = $('#option-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);

			$.each(data, function (i, c) {
				container.append(templateFn({ name: c, value: c }));
			});

		} else {

			// console.log('template override does not exist');

			var html = option_template;
			var templateFn = FilterJS.templateBuilder(html)
			var container = $(sel);

			$.each(data, function (i, c) {
				container.append(templateFn({ name: c, value: c }));
			});

		}

	}

	// render method
	renderErrorTemplate(sel) {

		if (this.isElementValid(document.querySelector('#error-template'))) {

			var html = $('#error-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
			container.empty().append(templateFn({}))

		}

	}

	// general function for sorting the job's json data by a given key
	sortDataBy(data, byKey) {
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

	// general function for checking if given element is a valid one
	isElementValid(el) {
		if (el && typeof (el) != 'undefined' && el != null) return true;
		return false;
	}

	// general function for checking if given url is a valid one
	isUrlValid(url) {
		const isValidUrl = urlString => {
			var urlPattern = new RegExp('^(https?:\\/\\/)?' + // validate protocol
				'((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // validate domain name
				'((\\d{1,3}\\.){3}\\d{1,3}))' + // validate OR ip (v4) address
				'(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // validate port and path
				'(\\?[;&a-z\\d%_.~+=-]*)?' + // validate query string
				'(\\#[-a-z\\d_]*)?$', 'i'); // validate fragment locator
			return !!urlPattern.test(urlString);
		}
		if (url) {
			if (isValidUrl(url)) {
				return true
				// if(url.includes("midlandjobs.ie")){
				// return true
				// }
			}
		}
		return false;
	}

}
window.JobBoardFilteredFeed = JobBoardFilteredFeed;

//
// general functions for filtered feed
//
function hidePagination() {
	var paginationItems = $("#pagination nav ul").children();
	if (paginationItems.length == 1) {
		$("#pagination").hide();
	} else {
		$("#pagination").show();
	}
}
function hidePerPage(result) {

	var perPageOptions = $('#per_page select option');
	const result_count = result.length;

	// loop thru the per page options & hide ones where the jobs results is less than it
	// ignore 12 as it still makes sense to show 12 when jobs results are less than 12
	if (perPageOptions.length > 0) {
		perPageOptions.each(function () {

			var c = $(this);

			// the numbers here should correspond to the values given to the pagination->perPage settings in the the FilterJS object (ignoring 12, the lowest value)
			if (c.val() == 18) {
				if (result_count < 18) {
					c.hide();
				} else {
					c.show();
				}
			} else if (c.val() == 15) {
				if (result_count < 15) {
					c.hide();
				} else {
					c.show();
				}
			}

		});
	}

}
function setInitialCounts(length) {
	var total = $('#total_jobs'); // get total
	total.text(length);
}
function updateCountsLogic(result, jQ, initial_results, active_search, disable_cats, disable_cities, disable_jobtypes, disable_companies) {

	var total = $('#total_jobs'); // get total
	var checkboxes = $("#category_criteria :input"); // get checkboxes
	var theJobtypes = $('#jobtype_filter option'); // check jobtypes
	var theCompanies = $('#company_filter option'); // check companies
	var theCities = $('#city_filter option'); // check cities
	var jobtypeSelected = $('#jobtype_filter option:selected').val(); // check jobtype select box for selections
	var companySelected = $('#company_filter option:selected').val(); // check company select box for selections
	var citySelected = $('#city_filter option:selected').val(); // check city select box for selections
	var searchBox = [];
	searchBox.length = 0; // default to empty array so .length = 0; allows disable of the searching properly
	if(active_search) var searchBox = $('#searchbox').val();

	// add jobs count to total
	total.text(result.length);

	//
	// updating theCompanies counts...
	//

	if (disable_companies != true) {

		// only if theCompanies dont have any currently selected (we leave them alone if them get selected)
		// conditions upon which the companies counts will change
		if (checkboxes.is(":checked") || jobtypeSelected != 'all' || citySelected != 'all' || searchBox.length >= 2) {

			// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
			theCompanies.each(function () {
				var c = $(this), count = 0
				updateOptionsCountsAndHideEmtpies(c, count, result, jQ, 'company');
			});

		}

		// if all cats checkboxes not checked & all company selected & search box not filled, update the jobtype counts from on INITIAL results
		if (!checkboxes.is(":checked") && jobtypeSelected === 'all' && citySelected === 'all' && searchBox.length < 2) {

			// we update the count based on INITIAL results instead
			theCompanies.each(function () {
				var c = $(this), count = 0
				updateOptionsCountsAndHideEmtpies(c, count, initial_results, jQ, 'company');
			});

		}

	}

	//
	// updating theJobtypes counts...
	//

	if (disable_jobtypes != true) {

		// only if theJobtypes dont have any currently selected (we leave them alone if them get selected)
		// conditions upon which the jobtypes counts will change
		if (checkboxes.is(":checked") || companySelected != 'all' || citySelected != 'all' || searchBox.length >= 2) {

			// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
			theJobtypes.each(function () {
				var c = $(this), count = 0
				updateOptionsCountsAndHideEmtpies(c, count, result, jQ, 'jobtypes');
			});

		}

		// if all cats checkboxes not checked & all company selected & search box not filled, update the jobtype counts from on INITIAL results
		if (!checkboxes.is(":checked") && companySelected === 'all' && citySelected === 'all' && searchBox.length < 2) {

			// we update the count based on INITIAL results instead
			theJobtypes.each(function () {
				var c = $(this), count = 0
				updateOptionsCountsAndHideEmtpies(c, count, initial_results, jQ, 'jobtypes');
			});

		}

	}

	//
	// updating theCities counts...
	//

	if (disable_cities != true) {

		// only if theCities dont have any currently selected (we leave them alone if them get selected)
		// conditions upon which the companies counts will change
		if (checkboxes.is(":checked") || jobtypeSelected != 'all' || companySelected != 'all' || searchBox.length >= 2) {

			// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
			theCities.each(function () {
				var c = $(this), count = 0
				updateOptionsCountsAndHideEmtpies(c, count, result, jQ, 'city');
			});

		}

		// if all cats checkboxes not checked & all company selected & search box not filled, update the jobtype counts from on INITIAL results
		if (!checkboxes.is(":checked") && jobtypeSelected === 'all' && companySelected === 'all' && searchBox.length < 2) {

			// we update the count based on INITIAL results instead
			theCities.each(function () {
				var c = $(this), count = 0
				updateOptionsCountsAndHideEmtpies(c, count, initial_results, jQ, 'city');
			});

		}

	}

	//
	// updating the cats counts...
	//
	if (disable_cats != true) {

		// only if the cats dont have any currently checked (we leave them alone if them get checked)
		// conditions upon which the cats counts will change
		if (!checkboxes.is(":checked")) {

			// if company or jobtype or searchbox selected
			if (companySelected != 'all' || jobtypeSelected != 'all' || citySelected != 'all' || searchBox.length >= 2) {

				// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
				checkboxes.each(function () {
					var c = $(this), count = 0
					updateCheckboxesCountsAndHideEmtpies(c, count, result, jQ, 'categories');
				});

			}

		}

		// if all companySelected & all jobtype selected, update the cat counts from on INITIAL results
		if (companySelected === 'all' && jobtypeSelected === 'all' && citySelected === 'all' && searchBox.length < 2) {

			// we update the count based on INITIAL results instead
			checkboxes.each(function () {

				var c = $(this), count = 0

				updateCheckboxesCountsAndHideEmtpies(c, count, initial_results, jQ, 'categories');

			});

		}

	}
	

}
function updateCheckboxesCountsAndHideEmtpies(c, count, result, jQ, key) {

	if (result.length > 0) {
		jQ.records = result; // set querying from live jobs
		count = jQ.where({ [key]: c.val() }).count;
	}

	c.next().text(c.val() + '(' + count + ')');

	if (count == 0) c.parent('label').parent('.checkbox').hide();
	if (count > 0) c.parent('label').parent('.checkbox').show();

}
function updateOptionsCountsAndHideEmtpies(c, count, result, jQ, key) {

	if (c.val() != 'all') {

		if (result.length > 0) {
			jQ.records = result; // set querying from live jobs
			count = jQ.where({ [key]: c.val() }).count;
		}

		c.text(c.val() + '(' + count + ')');

		if (count == 0) c.hide();
		if (count > 0) c.show();

	}

}