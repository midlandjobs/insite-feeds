// xmlToJson()
// import xml2js from 'xml2js'
var parseString = require('xml2js').parseString;
var http = require('http');

// getXMLfromURL()
// import xml2js from 'xml2js';
// const parser = new xml2js.Parser();
const parser = require('xml2js').Parser({explicitArray : false});

class JsonFromXmlFeed {

	constructor(url) {
		this.url = url;
	}

  async getXMLfromURL() {
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
// window.HelloThere = HelloThere;

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

export default class SmartJobBoardFilteredFeed {

	constructor(sel, url, params = { sorting: false }) {

		this.sel = sel;
		this.url = url;
		this.params = params;

		if (this.params.scope) UIkit.container = this.params.scope; // scope for uikit

		// renderMain(this.sel); // render main before jobs come in... object must be placed below html

		// dont attempt anything unless given URL is valid
		if(this.isUrlValid(this.url)){

			// const feedObj = new MidlandJobsFeed(this.url); // returns a promise
      const feedObj = new JsonFromXmlFeed(this.url); // returns a promise
			(async () => {

				//
				// get jobs from Json Feed
				//
	
				const json = await feedObj.getXMLfromURL(); // xml as json, await the promise of data
				var jobs = json.source.job; // array of jobs now
	
				// only proceed to render/place stuff if we have some JOBS & the given selected Element exists in the dom
				if(jobs && jobs.length > 0 && this.isElementValid(document.querySelector(this.sel))){

					this.renderMainTemplate(this.sel); // waiting for jobs first. object can be placed above or below html, but all html pops in together. can just use a loader animation...

					// sort the jobs by key!!
					function sortDataBy (data, byKey){
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
						return sortedData;
					}

					// randomize the jobs
					if (this.params.sorting == 'random') {

						let shuffled = jobs
						.map(value => ({ value, sort: Math.random() }))
						.sort((a, b) => a.sort - b.sort)
						.map(({ value }) => value);

						// console.log(shuffled);
						jobs = shuffled;

					}

					// if (this.params.sorting == 'title') console.log(sortDataBy(jobs, 'title'));
					if (this.params.sorting == 'title') jobs = sortDataBy(jobs, 'title');
					if (this.params.sorting == 'date') jobs = sortDataBy(jobs, 'date');
					if (this.params.sorting == 'referencenumber') jobs = sortDataBy(jobs, 'referencenumber');

					this.populateFilters(jobs); // setup data & populate filters
			
					// filters callback - updating counts
					var filter_callbacks = {
						afterFilter: function(result, jQ){
							var initial_results = jobs; // initial jobs/result before any filtering done to them
							updateCountsLogic(result, jQ, initial_results);
							hidePagination();
							hidePerPage(result);
						}
					};

					var _template = false;
					var _template_html = job_template;
					// check if a template exists in the DOM for #job-template first & use that, else just use main.html
					if(this.isElementValid(document.querySelector('#job-template'))) var _template = '#job-template';
					if(this.isElementValid(document.querySelector('#job-template'))) var _template_html = false;

					var _pagination_template = false;
					var _perpage_template = false;
					// check if a template exists in the DOM for #job-template first & use that, else just use main.html
					if(this.isElementValid(document.querySelector('#pagination-template'))) var _pagination_template = '#pagination-template';
					if(this.isElementValid(document.querySelector('#perpage-template'))) var _perpage_template = '#perpage-template';
			
					// activate filters & configs
					var FJS = FilterJS(jobs, '#jobs', {
			
						// template: '#job-template', // define template for job
						template: _template, // set to false so we can use pre rendered html template
						template_html: _template_html, // define template for movie
			
						//search: {ele: '#searchbox', fields: ['runtime']}, // With specific fields
						search: { ele: '#searchbox' }, // define search box
						
						// firing after filtering
						// callbacks: {
						//   afterFilter: this.afterFiltering() // afterfilter to reset the counts. clever!
						// },
						callbacks: filter_callbacks,
			
						// pagination setup
						pagination: {
							container: '#pagination', // define container for pagi
							visiblePages: 5, // set init visible pages
							perPage: {
								values: [12, 15, 18], // per page dropdown options
								container: '#per_page', // per page container
								perPageView: _perpage_template,
							},
							paginationView: _pagination_template,
						},
			
					});
			
					// activate filter criterias
					FJS.addCriteria({field: 'city', ele: '#city_filter', all: 'all'});
					FJS.addCriteria({field: 'jobtypes', ele: '#jobtype_filter', all: 'all'});
					FJS.addCriteria({field: 'company', ele: '#company_filter', all: 'all'});
					FJS.addCriteria({field: 'categories', ele: '#categories_criteria input:checkbox', all: 'all'});
	
				} else {

					this.renderErrorTemplate(this.sel); // this should say no jobs found & be placed in html, but be hidden...

					if(!jobs || !jobs.length > 0) console.log('no jobs available from given source');
					if(!this.isElementValid(document.querySelector(this.sel))) console.log('invalid element selector given');

				}
	
			})();
			
		} else {

			if(!this.isUrlValid(this.url)) console.log('invalid source url given');

		}

	}

	renderErrorTemplate(sel){

		if(this.isElementValid(document.querySelector('#error-template'))){

			var html = $('#error-template').html();
			var templateFn = FilterJS.templateBuilder(html);
			var container = $(sel);
			container.empty().append(templateFn({}))

		}

	}

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

	isElementValid(el) {
		if (el && typeof (el) != 'undefined' && el != null) return true;
		return false;
	}
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
window.SmartJobBoardFilteredFeed = SmartJobBoardFilteredFeed;

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