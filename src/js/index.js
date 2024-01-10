// xmlToJson()
// import xml2js from 'xml2js'
var parseString = require('xml2js').parseString;
var http = require('http');

// getXMLfromURL()
// import xml2js from 'xml2js';
// const parser = new xml2js.Parser();
const parser = require('xml2js').Parser({explicitArray : false});

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
      console.log({e});
    }
  }

  xmlToJson(callback) {
    var req = http.get(this.url, function(res) {
      var xml = '';
      
      res.on('data', function(chunk) {
        xml += chunk;
      });
  
      res.on('error', function(e) {
        callback(e, null);
      }); 
  
      res.on('timeout', function(e) {
        callback(e, null);
      }); 
  
      res.on('end', function() {
        parseString(xml, function(err, result) {
          callback(null, result);
        });
      });
    });
  }

}

//
// filters for feed (requires jquery)
//

import $ from 'jquery';
import './filter.js';

import main_template from './static-components/main.html';
import job_template from './static-components/job.html';
import checkbox_template from './static-components/checkbox.html'; // checkbox
import option_template from './static-components/option.html'; // dropdown
// import error_template from './static-components/error.html';

export default class JobBoardFilteredFeed {

	constructor(sel, url, params = { sorting: false }) {

		//
		// 1. the constructor properties
		//
		this.sel = sel; // element id or selector
		this.url = url; // url to xml source
		this.params = params; // extra paramaters/settings
		if (this.params.scope) UIkit.container = this.params.scope; // scoping for uikit

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
		if(!this.isUrlValid(this.url)) {
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
				if(!json.source.job || json.source.job.length <= 0) {
					console.log('no jobs data available from given source, tho the url was valid'); // console log the issue
					if(this.isElementValid(document.querySelector(this.sel))) this.renderErrorTemplate(this.sel); // render the error template. this template should say no jobs found & be placed in html, but be hidden
				} 
				
				// jobs found in source, yay!
				else {
					this.jobs = json.source.job; // the jobs array, added as an object property now

					// INVALID element selector given
					if(!this.isElementValid(document.querySelector(this.sel))) {
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
	renderTheJobs(jobs){

		//
		// testing vars...
		//
		var active_filters = true;
		var active_filters_2 = true;
		var active_filters_3 = true;
		var filters_pagination = true;
		var filters_perpage = true;
		var filters_search = true;


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
		// setup data & populate filters
		//
		if(active_filters) this.populateFilters(jobs);

		//
		// job template stuff
		//
		var _template = false;
		var _template_html = job_template;
		if(this.isElementValid(document.querySelector('#job-template'))) var _template = '#job-template';
		if(this.isElementValid(document.querySelector('#job-template'))) var _template_html = false;

		//
		// pagination & perpage template stuff
		//
		var _pagination_template = false;
		var _perpage_template = false;
		if(this.isElementValid(document.querySelector('#pagination-template'))) var _pagination_template = '#pagination-template';
		if(this.isElementValid(document.querySelector('#perpage-template'))) var _perpage_template = '#perpage-template';

		//
		// filters: updating the counts - a callback for later (inside FilterJS())
		//
		var filter_callbacks = {
			afterFilter: function(result, jQ){
				var initial_results = jobs; // initial jobs/result before any filtering done to them
				if(active_filters_2){
					updateCountsLogic(result, jQ, initial_results);
					hidePagination();
					hidePerPage(result);
				}
			}
		};

		//
		// other stuff for the filters configs, selective
		//

		var the_pagi = {
			container: '#pagination', // define container for pagi
			visiblePages: 5, // set init visible pages
			perPage: {
				values: [12, 15, 18], // per page dropdown options
				container: '#per_page', // per page container
				// perPageView: _perpage_template,
			},
			// paginationView: _pagination_template,
		};
		// console.log(the_pagi);

		var the_search = { ele: '#searchbox' };
		// console.log(the_search);

		//
		// activate filters & configs
		//
		var FJS = FilterJS(jobs, '#jobs', {

			// template: '#job-template', // define template for job
			template: _template, // set to false so we can use pre rendered html template
			template_html: _template_html, // define template for job

			//search: {ele: '#searchbox', fields: ['runtime']}, // With specific fields
			search: the_search, // define search box
			
			// firing after filtering
			// callbacks: {
			//   afterFilter: this.afterFiltering() // afterfilter to reset the counts. clever!
			// },
			callbacks: filter_callbacks,

			// pagination setup
			pagination: the_pagi,

		});

		//
		// activate filter criterias
		//
		if(active_filters_3){
			FJS.addCriteria({field: 'city', ele: '#city_filter', all: 'all'});
			FJS.addCriteria({field: 'jobtypes', ele: '#jobtype_filter', all: 'all'});
			FJS.addCriteria({field: 'company', ele: '#company_filter', all: 'all'});
			FJS.addCriteria({field: 'categories', ele: '#categories_criteria input:checkbox', all: 'all'});
		}

	}

	// getting & populating the filter's data
	populateFilters(jobs) {
		if(jobs){
		
			//
			// manipulate the job items data here...
			//

			for (let job of jobs) {

				if(job.category.length > 0) job.categories = job.category.split(', '); // add as array
				if(job.jobtype.length > 0) job.jobtypes = job.jobtype.split(', '); // add as array

				if(job.companywebsite.length > 0){

					const withHttp = url => !/^https?:\/\//i.test(url) ? `http://${url}` : url;
					const companywebsiteWithHttp = withHttp(job.companywebsite);
					job.companywebsite = companywebsiteWithHttp;

				}

			}

			//
			// data for categories
			//

			const categories = [];
			for (let job of jobs) {
				for (let cat of job.categories) {
					categories.push(cat);
				}
			}
			var unique_categories = categories.filter(function (value, index, array) { 
				return array.indexOf(value) === index;
			});

			this.renderCheckboxesTemplate(unique_categories, '#categories_criteria');

			//
			// data for cities
			//

			const cities = [];
			for (let job of jobs) {
				if(Object.keys(job.city).length == 0) job.city = 'Midlands';
				cities.push(job.city);
			}
			var unique_cities = cities.filter(function (value, index, array) { 
				return array.indexOf(value) === index;
			});

			this.renderOptionsTemplate(unique_cities, '#city_filter');

			//
			// data for jobtypes
			//

			const jobtypes = [];
			for (let job of jobs) {
				for (let type of job.jobtypes) {
					jobtypes.push(type);
				}
			}
			var unique_jobtypes = jobtypes.filter(function (value, index, array) { 
				return array.indexOf(value) === index;
			});

			this.renderOptionsTemplate(unique_jobtypes, '#jobtype_filter');

			//
			// data for company
			//

			const companies = [];
			for (let job of jobs) {
				companies.push(job.company);
			}
			var unique_companies = companies.filter(function (value, index, array) { 
				return array.indexOf(value) === index;
			});

			this.renderOptionsTemplate(unique_companies, '#company_filter');

		}
		return jobs;
	}

	// render method
	renderMainTemplate(sel){

		// check if a template exists in the DOM for main.html first & use that, else just use main.html
		if(this.isElementValid(document.querySelector('#main-template'))){

			// console.log('template override exists');

			var html = $('#main-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
			// container.append(templateFn({}))
			container.empty().append(templateFn({}))

			// var theMainEle = document.querySelector(sel);
			// theMainEle.dispatchEvent(
			// 	new CustomEvent("Rendered"),
			// );

		} else {

			// console.log('template override does not exist');

			var html = main_template;
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
			// container.append(templateFn({}))
			container.empty().append(templateFn({}))

			// var theMainEle = document.querySelector(sel);
			// theMainEle.dispatchEvent(
			// 	new CustomEvent("Rendered"),
			// );

		}
	
	}

	// render method
	renderCheckboxesTemplate(data, sel){

		// check if a template exists in the DOM for #checkbox-template first & use that, else just use main.html
		if(this.isElementValid(document.querySelector('#checkbox-template'))){

			// console.log('template override exists');

			var html = $('#checkbox-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
		
			$.each(data, function(i, c){
				container.append(templateFn({ name: c, value: c }))
			});

		} else {

			// console.log('template override does not exist');

			var html = checkbox_template;
			var templateFn = FilterJS.templateBuilder(html)
			var container = $(sel);
		
			$.each(data, function(i, c){
				container.append(templateFn({ name: c, value: c }))
			});

		}
	
	}

	// render method
	renderOptionsTemplate(data, sel){

		// check if a template exists in the DOM for #checkbox-template first & use that, else just use main.html
		if(this.isElementValid(document.querySelector('#option-template'))){

			// console.log('template override exists');

			var html = $('#option-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
		
			$.each(data, function(i, c){
				container.append(templateFn({ name: c, value: c }));
			});

		} else {

			// console.log('template override does not exist');

			var html = option_template;
			var templateFn = FilterJS.templateBuilder(html)
			var container = $(sel);
		
			$.each(data, function(i, c){
				container.append(templateFn({ name: c, value: c }));
			});

		}
	
	}

	// render method
	renderErrorTemplate(sel){

		if(this.isElementValid(document.querySelector('#error-template'))){

			var html = $('#error-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
			container.empty().append(templateFn({}))

		}

	}

	// general function for sorting the job's json data by a given key
	sortDataBy(data, byKey){
		let sortedData;
		if(byKey == 'title'){
			sortedData = data.sort(function(a,b){

				let x = a.title.toLowerCase();
				let y = b.title.toLowerCase();

				if(x>y){return 1;}
				if(x<y){return -1;}

				return 0;
			});
		}
		else if(byKey == 'date'){
			sortedData = data.sort(function(a,b){

				let x = new Date(a.date);
				let y = new Date(b.date);

				// Compare the 2 dates
				if (x < y) return -1;
				if (x > y) return 1;

				return 0;
			});
		}
		else if(byKey == 'referencenumber'){
			sortedData = data.sort(function(a,b){

				let x = a.referencenumber;
				let y = b.referencenumber;

				// Compare the 2 referencenumbers
				if (x < y) return -1;
				if (x > y) return 1;

				return 0;
			});
		}
		else if(byKey == 'random'){

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

function hidePagination(){
	var paginationItems = $("#pagination nav ul").children();
	if(paginationItems.length == 1){
		$("#pagination").hide();
	} else {
		$("#pagination").show();
	}
}
function hidePerPage(result){

	var perPageOptions = $('#per_page select option');
	const result_count = result.length;

	// loop thru the per page options & hide ones where the jobs results is less than it
	// ignore 12 as it still makes sense to show 12 when jobs results are less than 12
	if(perPageOptions.length > 0){
		perPageOptions.each(function(){

			var c = $(this);
	
			// the numbers here should correspond to the values given to the pagination->perPage settings in the the FilterJS object (ignoring 12, the lowest value)
			if(c.val() == 18) {
				if(result_count < 18){
					c.hide();
				} else {
					c.show();
				}
			} else if(c.val() == 15) {
				if(result_count < 15){
					c.hide();
				} else {
					c.show();
				}
			}
	
		});
	}

}

function updateCountsLogic(result, jQ, initial_results) {

	var total = $('#total_jobs'); // get total
	var checkboxes = $("#category_criteria :input"); // get checkboxes
	var theJobtypes = $('#jobtype_filter option'); // check jobtypes
	var theCompanies = $('#company_filter option'); // check companies
	var theCities = $('#city_filter option'); // check cities
	var jobtypeSelected = $('#jobtype_filter option:selected').val(); // check jobtype select box for selections
	var companySelected = $('#company_filter option:selected').val(); // check company select box for selections
	var citySelected = $('#city_filter option:selected').val(); // check city select box for selections
	var searchBox = $('#searchbox').val(); //

	// add jobs count to total
	total.text(result.length);

	//
	// updating theCompanies counts...
	//

	// only if theCompanies dont have any currently selected (we leave them alone if them get selected)
	// conditions upon which the companies counts will change
	if(checkboxes.is(":checked") || jobtypeSelected !='all' || citySelected !='all' || searchBox.length >= 2){

		// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
		theCompanies.each(function(){
			var c = $(this), count = 0
			updateOptionsCountsAndHideEmtpies(c, count, result, jQ, 'company');
		});

	}

	// if all cats checkboxes not checked & all company selected & search box not filled, update the jobtype counts from on INITIAL results
	if(!checkboxes.is(":checked") && jobtypeSelected === 'all' && citySelected === 'all' && searchBox.length < 2){

		// we update the count based on INITIAL results instead
		theCompanies.each(function(){
			var c = $(this), count = 0
			updateOptionsCountsAndHideEmtpies(c, count, initial_results, jQ, 'company');
		});

	}

	//
	// updating theJobtypes counts...
	//

	// only if theJobtypes dont have any currently selected (we leave them alone if them get selected)
	// conditions upon which the jobtypes counts will change
	if(checkboxes.is(":checked") || companySelected !='all' || citySelected !='all' || searchBox.length >= 2){

		// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
		theJobtypes.each(function(){
			var c = $(this), count = 0
			updateOptionsCountsAndHideEmtpies(c, count, result, jQ, 'jobtypes');
		});

	}

	// if all cats checkboxes not checked & all company selected & search box not filled, update the jobtype counts from on INITIAL results
	if(!checkboxes.is(":checked") && companySelected === 'all' && citySelected === 'all' && searchBox.length < 2){

		// we update the count based on INITIAL results instead
		theJobtypes.each(function(){
			var c = $(this), count = 0
			updateOptionsCountsAndHideEmtpies(c, count, initial_results, jQ, 'jobtypes');
		});

	}

	//
	// updating theCities counts...
	//

	// only if theCities dont have any currently selected (we leave them alone if them get selected)
	// conditions upon which the companies counts will change
	if(checkboxes.is(":checked") || jobtypeSelected !='all' || companySelected !='all' || searchBox.length >= 2){

		// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
		theCities.each(function(){
			var c = $(this), count = 0
			updateOptionsCountsAndHideEmtpies(c, count, result, jQ, 'city');
		});

	}

	// if all cats checkboxes not checked & all company selected & search box not filled, update the jobtype counts from on INITIAL results
	if(!checkboxes.is(":checked") && jobtypeSelected === 'all' && companySelected === 'all' && searchBox.length < 2){

		// we update the count based on INITIAL results instead
		theCities.each(function(){
			var c = $(this), count = 0
			updateOptionsCountsAndHideEmtpies(c, count, initial_results, jQ, 'city');
		});

	}

	//
	// updating the cats counts...
	//

	// only if the cats dont have any currently checked (we leave them alone if them get checked)
	// conditions upon which the cats counts will change
	if(!checkboxes.is(":checked")){

		// if company or jobtype or searchbox selected
		if(companySelected !='all' || jobtypeSelected !='all' || citySelected !='all' || searchBox.length >= 2){

			// update the cat counts on each cat checkbox from the NEW/LIVE/LATEST results
			checkboxes.each(function(){
				var c = $(this), count = 0
				updateCheckboxesCountsAndHideEmtpies(c, count, result, jQ, 'categories');
			});
			
		}

	}

	// if all companySelected & all jobtype selected, update the cat counts from on INITIAL results
	if(companySelected === 'all' && jobtypeSelected === 'all' && citySelected === 'all' && searchBox.length < 2){

		// we update the count based on INITIAL results instead
		checkboxes.each(function(){

			var c = $(this), count = 0

			updateCheckboxesCountsAndHideEmtpies(c, count, initial_results, jQ, 'categories');

		});

	}

}
function updateCheckboxesCountsAndHideEmtpies(c, count, result, jQ, key){

	if(result.length > 0){
		jQ.records = result; // set querying from live jobs
		count = jQ.where({ [key]: c.val() }).count;
	}

	c.next().text(c.val() + '(' + count + ')');

	if(count == 0) c.parent('label').parent('.checkbox').hide();
	if(count > 0) c.parent('label').parent('.checkbox').show();

}
function updateOptionsCountsAndHideEmtpies(c, count, result, jQ, key){

	if(c.val() != 'all'){

		if(result.length > 0){
			jQ.records = result; // set querying from live jobs
			count = jQ.where({ [key]: c.val() }).count;
		}

		c.text(c.val() + '(' + count + ')');

		if(count == 0) c.hide();
		if(count > 0) c.show();

	}

}