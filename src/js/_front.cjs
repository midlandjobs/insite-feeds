//
//
// requires
//
//
// var _ = require('lodash'); // Load the full build.
const fns = require('./_fns.cjs'); // general functions

//
//
// UIkit
//
//
// const UIkit = require('uikit');
// const Icons = require('uikit/dist/js/uikit-icons');
if(typeof UIkit !== 'undefined' && typeof Icons !== 'undefined') UIkit.use(Icons); // use the Icon plugin
if(typeof UIkit !== 'undefined') window.UIkit = UIkit; // Make uikit available in window for inline scripts

//
//
// filter.js
//
// requires jquery. can deconvert from jquery at a later point
//
//
// require('./_filter.js');
require('./_old/_filter.js');

//
//
// JobBoardFilteredFeeds
//
//
//
//
// the filtered feed class itself
// currently, jobs count requires pagination to be active, because the filters callback only fires when pagintion fires???
//
//
const JobBoardFilteredFeed = class {

	#main_template_static;
	#main_sidebar_template_static;
	#job_template_static;
	#checkbox_template_static;
	#option_template_static;
	#count_template_static
	#filters_template_static
	#jobs_wrap_template_static
	#topbar_template_static
	#divider_template_static
	#search_template_static
	#company_template_static
	#jobtype_template_static
	#city_template_static
	#cats_template_static
	#pagination_wrap_template_static
	#perpage_wrap_template_static

	constructor(jobs = [], params = { 

		id: null, // can be null or string/int. for template overrides you need to set an ID. for multiple feeds on a page (and with template overrides), you need to set a unique ID for each feed.
		scope: null, // for uikit scoping

		sorting: false, // possible settings: 'title', 'date', 'referencenumber' & 'random'... remove this or set to false to leave sorting as default

		// decide whats active
		active_filters: true, 
		active_pagination: true, 
		active_perpage: true, 
		active_search: true, 
		active_counts: true,

		// decide whats disabled
		disable_cats: false, 
		disable_cities: false, 
		disable_companies: false, 
		disable_jobtypes: false,

		// filter the results
		query_by: null

	}){

		var movies = [
			{
				"name":"Once Upon a Time in the West",
				"rating":8.7,
				"director":"Sergio Leone",
				"year":1968,
				"actor":
				"Henry Fonda"
			},
			{
				"name":"Terminator 2: Judgment Day",
				"rating":8.6,
				"director":"James Cameron",
				"year":1991,
				"actor":"Arnold Schwarzenegger"
			},
		];
		var Movie = JsonQuery(movies); //Initialize the Query Engine
		var movieResults = Movie.where({'rating': 8.6}).exec();
		console.log(movieResults);

		// templates: mains/wraps
		this.#main_template_static = require('components/main.html').default;
		this.#main_sidebar_template_static = require('components/main_sidebar.html').default;

		// templates: dynamic partials
		this.#job_template_static = require('components/job.html').default;
		this.#checkbox_template_static = require('components/checkbox.html').default;
		this.#option_template_static = require('components/option.html').default;

		// templates: static partials
		this.#count_template_static = require('components/count.html').default;
		this.#filters_template_static = require('components/filters.html').default;
		this.#jobs_wrap_template_static = require('components/jobs_wrap.html').default;
		this.#topbar_template_static = require('components/topbar.html').default;
		this.#divider_template_static = require('components/divider.html').default;
		this.#search_template_static = require('components/search.html').default;
		this.#company_template_static = require('components/company.html').default;
		this.#jobtype_template_static = require('components/jobtype.html').default;
		this.#city_template_static = require('components/city.html').default;
		this.#cats_template_static = require('components/cats.html').default;
		this.#pagination_wrap_template_static = require('components/pagination_wrap.html').default;
		this.#perpage_wrap_template_static = require('components/perpage_wrap.html').default;
		// this.#error_template = require('components/error.html').default;

    // all optionals or defaults can be done thru params
    this.params = params;

    // reform the jobs data according to params, before anything else happens with it
    // defined after this.params!!!
    this.jobs = this.reformTheJobs(jobs); 

    // uikit thingy
		if(this.params.scope && typeof UIkit != "undefined") UIkit.container = this.params.scope;

	}

  //
  //
  // setup methods
  //
  //

	// called at constructor()
  reformTheJobs(jobs){
    if (jobs) {

      // loop thru & manipulate the job items data here
      for(let job of jobs) {

        // add as array (job.category string changed to job.categories array if any exist)
        if (job.category.length > 0) job.categories = job.category.split(', ');

        // add as array (job.jobtype string changed to job.jobtypes array if any exist)
        if (job.jobtype.length > 0) job.jobtypes = job.jobtype.split(', ');

				if(job.jobtypes){
					job.jobtypes.forEach(function(item, index, arr) {
						if(arr[index] == 'Full time') arr[index] = 'Full-time';
						if(arr[index] == 'Part time') arr[index] = 'Part-time';
						if(arr[index] == 'Live-In Employee') arr[index] = 'Live-in';
					});
				}
        
        // reform company website urls to include http/s
        if (job.companywebsite.length > 0) {
          const withHttp = url => !/^https?:\/\//i.test(url) ? `http://${url}` : url;
          const companywebsiteWithHttp = withHttp(job.companywebsite);
          job.companywebsite = companywebsiteWithHttp;
        }

        // more...
        // if (job.description.length > 0) {}
  
      }

			// filter the jobs here...
			if(this.params.query_by){
				console.log('query_by exists');
				if(fns.isLiteralObject(this.params.query_by)){
					console.log('isLiteralObject');

					// good to go & check the data


				}
			}

      // sort the jobs according params
      if (this.params && this.params.sorting == 'title') jobs = fns.sortDataBy(jobs, 'title');
      if (this.params && this.params.sorting == 'date') jobs = fns.sortDataBy(jobs, 'date');
      if (this.params && this.params.sorting == 'referencenumber') jobs = fns.sortDataBy(jobs, 'referencenumber');
      if (this.params && this.params.sorting == 'random') jobs = fns.sortDataBy(jobs, 'random');

    }
    return jobs;
  }

  // called on frontend
	renderTheJobs(sel = null) {
		// dont do anything for rendering unless is provided & a string
		if(sel && typeof sel === "string"){

			var jobs = this.jobs;

			//
			// STEP 1 - render the wrappers
			//
			// render the wrapper template to start... 
			// waiting for jobs first. object can be placed above or below html
			// but all html pops in together. can just use a loader animation...
			//
			this.renderFilteredFeedWrappers(sel);

			//
			// STEP 2 - populate the filters
			//
			// setup new jobs data & then populate filters (if filters are not disabled)
			//
			this.populateFilters(sel); // populate the filters (using the jobs data)

			//
			// STEP - define our job templates (and custom template override)
			//
			// defines which job template is to be used. the inbuilt one (default), 
			//
			var _template = false;
			var _template_html = this.#job_template_static;
			if (fns.isElementValid(document.querySelector('#job-template'))) var _template = '#job-template';
			if (fns.isElementValid(document.querySelector('#job-template'+'_'+this.params.id))) var _template = '#job-template'+'_'+this.params.id;
			if (fns.isElementValid(document.querySelector('#job-template')) || fns.isElementValid(document.querySelector('#job-template'+'_'+this.params.id))) var _template_html = false;

			//
			// STEP - setup pagination/perpage
			//
			// pagination/perpage configs
			//
			var the_pagination = false;
			if(this.params.active_pagination){

				// pagination template stuff
				// pagination & perpage templates to be used in FilterJS(): if element with id is in dom, set var to that id
				var _pagination_template = false;
				if (fns.isElementValid(document.querySelector('#pagination-template'))) var _pagination_template = '#pagination-template';
				if (fns.isElementValid(document.querySelector('#pagination-template'+'_'+this.params.id))) var _pagination_template = '#pagination-template'+'_'+this.params.id;

				var the_pagination = {
					container: '#pagination', // define container for pagi
					visiblePages: 5, // set init visible pages
					paginationView: _pagination_template,
					perPage: false
				};

				if(this.params.active_perpage){

					var _perpage_template = false;
					if (fns.isElementValid(document.querySelector('#perpage-template'))) var _perpage_template = '#perpage-template';
					if (fns.isElementValid(document.querySelector('#perpage-template'+'_'+this.params.id))) var _perpage_template = '#perpage-template'+'_'+this.params.id;

					the_pagination.perPage = {
						values: [12, 15, 18], // per page dropdown options
						container: '#per_page', // per page container
						perPageView: _perpage_template,
					};

				}

			}

			//
			// STEP - setup the search
			//
			// search configs
			//
			var the_search = false;
			if(this.params.active_search) var the_search = {ele: '#searchbox'};

			//
			// STEP - setup the filter callbacks (fires after every filtering)
			//
			// filters: updating the counts - a callback for later (inside FilterJS())
			//
			var filter_callbacks = {
				afterFilter: function (result, jQ) {

					// initial jobs/result before any filtering done to them
					var initial_results = jobs;

					// update the counts after filtering, if pagnation & counts are enabled
					if(this.params.active_pagination && this.params.active_counts) this.updateCounts(result, jQ, initial_results);
					
					// hide irrelevant pagination/items after filtering
					if(this.params.active_pagination) this.hidePagination();

					// hide irrelevant perpage/items after filtering
					if(this.params.active_pagination && this.params.active_perpage) this.hidePerPage(result);

				}.bind(this)
			};

			//
			// STEP - the main rendering part
			//
			// intiate the jobs listing & filters
			//
			var FJS = FilterJS(jobs, '#jobs_'+this.params.id, {
				template_html: _template_html, // html. define static/default html template used for each job. 
				template: _template, // selector for job template override. set this to false to use template_html below
				search: the_search, // define search
				pagination: the_pagination, // define pagination & perpage
				callbacks: filter_callbacks, // callbacks after filtering
			});

			//
			// STEP - setup filter criterias
			//
			// data to be used for filtering: city, jobtypes, company, categories
			//
			if (this.params.active_filters) {
				if (this.params.disable_cities != true) FJS.addCriteria({ field: 'city', ele: '#city_filter', all: 'all' });
				if (this.params.disable_jobtypes != true) FJS.addCriteria({ field: 'jobtypes', ele: '#jobtype_filter', all: 'all' });
				if (this.params.disable_companies != true) FJS.addCriteria({ field: 'company', ele: '#company_filter', all: 'all' });
				if (this.params.disable_cats != true) FJS.addCriteria({ field: 'categories', ele: '#cat_filter input:checkbox'});
			}

			//
			// FINAL STEP - activate filter criterias
			//
			// afterFilter wont get fired unless pagination is set...
			// so when pagination is false but active counts is still active, we need to initiate counts here manually. 
			//
			if(this.params.active_counts && !this.params.active_pagination) this.setCounts(jobs.length);

		}
	}

	// called in renderTheJobs()
	renderFilteredFeedWrappers(sel) {

		//
		//
		// MAIN TEMPLATE
		//
		// static components: main.html | main_sidebar.html
		// selectors: #main-template | #main-template_123
		//
		//

		// set template_html as the default main template
		// var main_html = this.#main_template_static;
		// if(this.params.active_counts || this.params.active_filters || this.params.active_search) var main_html = this.#main_sidebar_template_static; // if options are set, reset html to sidebar template

		//this.renderStaticComponent(main_html, 'main-template');
		this.renderMainComponent(sel);

		//
		//
		// COUNTS TEMPLATE
		//
		// static components: _count.html
		// selectors: #count-template | #count-template_123
		// container selectors: #Feed_123 #FiltersCount
		//
		//

		if(this.params.active_counts) this.renderStaticComponent(this.#count_template_static, 'count-template', '#FiltersCount', sel);

		//
		//
		// DIVIDER TEMPLATE
		//
		// static components: _divider.html
		// selectors: #divider-template | #divider-template_123
		// container selectors: #Feed_123 #FiltersDivider
		//
		//

		if((this.params.active_filters || this.params.search) && this.params.active_counts) this.renderStaticComponent(this.#divider_template_static, 'divider-template', '#FiltersDivider', sel);

		//
		//
		// FILTERS WRAP TEMPLATE
		//
		// static components: _filters.html
		// selectors: #filters-template | #filters-template_123
		// container selectors: #Feed_123 #FiltersList
		//
		//

		if(this.params.active_filters || this.params.active_search) this.renderStaticComponent(this.#filters_template_static, 'filters-template', '#FiltersList', sel);

		//
		//
		// SEARCH TEMPLATE
		//
		// static components: _search.html
		// selectors: #search-template | #search-template_123
		// container selectors: #Feed_123 #searchFilters
		//
		//

		if(this.params.active_search) this.renderStaticComponent(this.#search_template_static, 'search-template', '#searchFilters', sel);

		//
		//
		// FILTERS TEMPLATE/S
		//
		// company, jobtype, city, cats
		// static components: _company.html | _jobtype.html | _city.html | _cats.html
		//
		//

		if(this.params.active_filters){

			//
			//
			// COMPANIES TEMPLATE
			//
			// static components: _company.html
			// selectors: #company-template | #company-template_123
			// container selectors: #Feed_123 #companyFilters
			//
			//

			if(this.params.disable_companies != true) this.renderStaticComponent(this.#company_template_static, 'company-template', '#companyFilters', sel);

			//
			//
			// JOBTYPE TEMPLATE
			//
			// static components: _jobtype.html
			// selectors: #jobtype-template | #jobtype-template_123
			// container selectors: #Feed_123 #jobtypeFilters
			//
			//

			if (this.params.disable_jobtypes != true) this.renderStaticComponent(this.#jobtype_template_static, 'jobtype-template', '#jobtypeFilters', sel);

			//
			//
			// CITY TEMPLATE
			//
			// static components: _city.html
			// selectors: #city-template | #city-template_123
			// container selectors: #Feed_123 #cityFilters
			//
			//

			if (this.params.disable_cities != true) this.renderStaticComponent(this.#city_template_static, 'city-template', '#cityFilters', sel);

			//
			//
			// CATS TEMPLATE
			//
			// static components: _cats.html
			// selectors: #cats-template | #cats-template_123
			// container selectors: #Feed_123 #catsFilters
			//
			//

			if (this.params.disable_cats != true) this.renderStaticComponent(this.#cats_template_static, 'cats-template', '#catsFilters', sel);

		}

		//
		//
		// TOPBAR TEMPLATE
		//
		// static components: _topbar.html
		// selectors: #topbar-template | #topbar-template_123
		// container selectors: #Feed_123 #FiltersTopBar
		//
		//

		if(this.params.active_pagination){

			this.renderStaticComponent(this.#topbar_template_static, 'topbar-template', '#FiltersTopBar', sel);

			//
			//
			// PAGINATION WRAP TEMPLATE
			//
			// static components: _pagi.html
			// selectors: #pagi-template | #pagi-template_123
			// container selectors: #Feed_123 #filtersPagintion
			//
			//

			this.renderStaticComponent(this.#pagination_wrap_template_static, 'pagination-wrap-template', '#filtersPagintion', sel);

			//
			//
			// PERPAGE WRAP TEMPLATE
			//
			// static components: _perpagi.html
			// selectors: #perpagi-template | #perpagi-template_123
			// container selectors: #Feed_123 #filtersPerPage
			//
			//

			if(this.params.active_perpage) this.renderStaticComponent(this.#perpage_wrap_template_static, 'perpage-wrap-template', '#filtersPerPage', sel);

		}

		//
		//
		// JOBSWRAP TEMPLATE
		//
		// static components: _jobs_wrap.html
		// selectors: #jobs-wrap-template | #jobs-wrap-template_123
		// container selectors: #Feed_123 #FiltersJobsWrap
		//
		//

		this.renderStaticComponent(this.#jobs_wrap_template_static, 'jobs-wrap-template', '#FiltersJobsWrap', sel);

	}

  // called in renderTheJobs()
	populateFilters(sel) {
    var id = this.params.id;
    var jobs = this.jobs;

		if (jobs.length > 0) {

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
				// if (this.params.active_filters) this.renderCheckboxesTemplate(unique_categories, '#cat_filter');
				if (this.params.active_filters) this.renderDynamicComponent(unique_categories, this.#checkbox_template_static, 'checkbox-template', '#cat_filter', sel);

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
				// if (this.params.active_filters) this.renderOptionsTemplate(unique_cities, '#city_filter');
				if (this.params.active_filters) this.renderDynamicComponent(unique_cities, this.#option_template_static, 'option-template', '#city_filter', sel, false);
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
				// if (this.params.active_filters) this.renderOptionsTemplate(unique_jobtypes, '#jobtype_filter');
				if (this.params.active_filters) this.renderDynamicComponent(unique_jobtypes, this.#option_template_static, 'option-template', '#jobtype_filter', sel, false);
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
				// if (this.params.active_filters) this.renderOptionsTemplate(unique_companies, '#company_filter');
				if (this.params.active_filters) this.renderDynamicComponent(unique_companies, this.#option_template_static, 'option-template', '#company_filter', sel, false);
			}

		}
	}

  //
  //
  // render methods
  //
  //

	// called in renderFilteredFeedWrappers()
	renderMainComponent(custom_sel){

		//
		// template hierarchy
		//

		// set default static template
		var component_html = this.#main_template_static;
		if(this.params.active_counts || this.params.active_filters || this.params.active_search) component_html = this.#main_sidebar_template_static; // if options are set, reset html to sidebar template

		// if custom template override exists in dom, reset to that
		if (fns.isElementValid(document.getElementById('main-template'))) component_html = document.getElementById('main-template').innerHTML;

		// if custom template override exists in dom with a specified ID, reset to that
		if(this.params.id && fns.isElementValid(document.getElementById('main-template_'+this.params.id))) component_html = document.getElementById('main-template_'+this.params.id).innerHTML;

		//
		// component placement
		//

		// insert component_html into dom via ID
		// only if component_html has already been created/set above.
		if(component_html){

			var component_templateFn = FilterJS.templateBuilder(component_html);
			var component_sel = custom_sel;

			// if the components wrapper element is actually valid in the dom
			// we place the newly created element, from the template, into the wrapper
			if(document.querySelector(component_sel) != null){
				document.querySelector(component_sel).innerHTML = '';
				let component_el = document.createRange().createContextualFragment(component_templateFn({id:this.params.id}));
				document.querySelector(component_sel).appendChild(component_el);
			}
		}

	}

	// called in renderFilteredFeedWrappers()
	renderStaticComponent(static_component = false, component_id = '', sel = null, custom_sel = null){

		//
		// template hierarchy
		//

		// set default static template
		var component_html = false;
		if(static_component) component_html = static_component;

		// if custom template override exists in dom, reset to that
		if (fns.isElementValid(document.getElementById(component_id))) component_html = document.getElementById(component_id).innerHTML;

		// if custom template override exists in dom with a specified ID, reset to that
		if(fns.isElementValid(document.getElementById(component_id+'_'+this.params.id))) component_html = document.getElementById(component_id+'_'+this.params.id).innerHTML;

		//
		// component placement
		//

		// insert component_html into dom via ID
		// only if component_html has already been created/set above.
		if(component_html){

			var component_templateFn = FilterJS.templateBuilder(component_html);
			// var component_sel = '';

			// var prime_sel = '#SomeParentDiv'; // phantom parent div
			// if(this.params.id) prime_sel = '#Feed_'+this.params.id; // next default: parent div with ID Feed_23
			// if(sel) component_sel = prime_sel + ' ' + sel;
			var component_sel = custom_sel + ' ' + sel;

			// if the components wrapper element is actually valid in the dom
			// we place the newly created element, from the template, into the wrapper
			if(document.querySelector(component_sel) != null){
				document.querySelector(component_sel).innerHTML = '';
				let component_el = document.createRange().createContextualFragment(component_templateFn({id:this.params.id}));
				document.querySelector(component_sel).appendChild(component_el);
			}
		}

	}

	// called in populateFilters()
	renderDynamicComponent(data = null, static_component = false, component_id = '', sel = null, custom_sel = null, empty = true){

		//
		// template hierarchy
		//

		// set default static template
		var component_html = false;
		if(static_component) component_html = static_component;

		// if custom template override exists in dom, reset to that
		if (fns.isElementValid(document.getElementById(component_id))) component_html = document.getElementById(component_id).innerHTML;

		// if custom template override exists in dom with a specified ID, reset to that
		if(fns.isElementValid(document.getElementById(component_id+'_'+this.params.id))) component_html = document.getElementById(component_id+'_'+this.params.id).innerHTML;

		//
		// component placement
		//

		// insert component_html into dom via ID
		// only if component_html has already been created/set above.
		if(component_html){

			var component_templateFn = FilterJS.templateBuilder(component_html)
			// var component_sel = '';

			// var prime_sel = '#SomeParentDiv'; // phantom parent div
			// if(this.params.id) prime_sel = '#Feed_'+this.params.id; // next default: parent div with ID Feed_23
			// if(sel) component_sel = prime_sel + ' ' + sel;
			var component_sel = custom_sel + ' ' + sel;

			// if the components wrapper element is actually valid in the dom
			// we place the newly created element, from the template, into the wrapper
			if(document.querySelector(component_sel) != null){
				if (empty) document.querySelector(component_sel).innerHTML = ''; // set the target ele to empty
				if(Array.isArray(data) && data.length > 0){
					data.forEach((item) => {
						let component_el = document.createRange().createContextualFragment(component_templateFn({name:item,value:item}));
						document.querySelector(component_sel).append(component_el);
					});
				}
			}

		}

	}

	// redo this template & reuse. error template is for where no jobs exist (trying to render nothing)
	__renderErrorTemplate(sel) {

		if (fns.isElementValid(document.querySelector('#error-template'))) var html = $('#error-template').html();

		if(Number.isInteger(this.params.id)){
			var html_sel = '#error-template_'+this.params.id;
			if(fns.isElementValid(document.querySelector(html_sel))) var html = $(html_sel).html();
		}

		var templateFn = FilterJS.templateBuilder(html);
		var container = $(sel);
		container.empty().append(templateFn({}))

	}

  //
  //
  // specific methods
  //
  //

	// remove jquery....
	setCounts(length) {
		if(getElementById('total_jobs_'+this.params.id)){
			total.textContent(length);
		}
	}

	// continue from here..... remove jquery....  tidy up....
	updateCounts(result, jQ, initial_results) {
	
		// cast this as self
		var self = this;

		// total filters vars
		var total = $('#total_jobs_'+this.params.id); // get total JQUERYYYYY
		total.text(result.length); // add jobs count to total

		// search filters vars
		var searchBox = [];
		searchBox.length = 0; // default to empty array so .length = 0; allows disable of the searching properly
		if(self.params.active_search) var searchBox = $('#searchbox').val();

		// jobtypes filters vars
		var jobtypesFilterEle = document.getElementById('jobtype_filter');
		var jobtypesFilterOptions = document.querySelectorAll('#jobtype_filter option');
		var jobtypesSelectedFilterOption = jobtypesFilterEle.selectedOptions[0].value;

		// companies filters vars
		var companiesFilterEle = document.getElementById('company_filter');
		var companiesFilterOptions = document.querySelectorAll('#company_filter option');
		var companiesSelectedFilterOption = companiesFilterEle.selectedOptions[0].value;

		// cities filters vars
		var citiesFilterEle = document.getElementById('city_filter');
		var citiesFilterOptions = document.querySelectorAll('#city_filter option');
		var citiesSelectedFilterOption = citiesFilterEle.selectedOptions[0].value;

		// // var companiesFilterOptions = $('#company_filter option'); // check companies
		// var companiesFilterOptions = document.querySelectorAll('#company_filter option'); // check companies
		// // var citiesFilterOptions = $('#city_filter option'); // check cities
		// var citiesFilterOptions = document.querySelectorAll('#city_filter option'); // check companies
		// var companiesSelectedFilterOption = $('#company_filter option:selected').val(); // check company select box for selections
		// // var companiesSelectedFilterOption = document.querySelector('#company_filter option:selected').value; // check jobtype select box for selections
		// var citiesSelectedFilterOption = $('#city_filter option:selected').val(); // check city select box for selections
		// // var citiesSelectedFilterOption = document.querySelector('#city_filter option:selected').value; // check jobtype select box for selections

		// categories filters vars
		// var checkboxes = $("#category_criteria :input");
		var catsFilterEle = document.getElementById('cat_filter');
		var catsFilterCheckboxes = document.querySelectorAll("#cat_filter input");
		var catsSelectedFilterCheckboxes = document.querySelectorAll('#cat_filter input:checked');

		var catFilterSelected = (catsSelectedFilterCheckboxes.length > 0);
		var jobtypesFilterSelected = (jobtypesSelectedFilterOption != 'all');
		var companiesFilterSelected = (companiesSelectedFilterOption != 'all');
		var citiesFilterSelected = (citiesSelectedFilterOption != 'all');
		var searchFilterSelected = (searchBox.length >= 2);

		var catFilterUnselected = (catsSelectedFilterCheckboxes.length <= 0);
		var jobtypesFilterUnselected = (jobtypesSelectedFilterOption === 'all');
		var companiesFilterUnselected = (companiesSelectedFilterOption === 'all');
		var citiesFilterUnselected = (citiesSelectedFilterOption === 'all');
		var searchFilterUnselected = (searchBox.length < 2);

		//
		// updating companiesFilterOptions counts...
		//
	
		if (self.params.disable_companies != true) {

			if (catFilterUnselected && jobtypesFilterUnselected && citiesFilterUnselected && searchFilterUnselected) {
				companiesFilterOptions.forEach(function(item) {
					self.updateOptions(item, 0, initial_results, jQ, 'company'); // we update the count based on INITIAL results
				})
			}
	
			else {
				companiesFilterOptions.forEach(function(item) {
					self.updateOptions(item, 0, result, jQ, 'company'); // we update the count based on LATEST results instead
				})
			}
	
		}
	
		//
		// updating jobtypesFilterOptions counts...
		//
	
		if (self.params.disable_jobtypes != true) {
			
			if (catFilterUnselected && companiesFilterUnselected && citiesFilterUnselected && searchFilterUnselected) {
				jobtypesFilterOptions.forEach(function(item) {
					self.updateOptions(item, 0, initial_results, jQ, 'jobtypes'); // we update the count based on INITIAL results
				})
			}
	
			else {
				jobtypesFilterOptions.forEach(function(item) {
					self.updateOptions(item, 0, result, jQ, 'jobtypes'); // we update the count based on LATEST results instead
				})
			}
	
		}
	
		//
		// updating citiesFilterOptions counts...
		//
	
		if (self.params.disable_cities != true) {

			if (catFilterUnselected && jobtypesFilterUnselected && companiesFilterUnselected && searchFilterUnselected) {
				citiesFilterOptions.forEach(function(item) {
					self.updateOptions(item, 0, initial_results, jQ, 'city'); // we update the count based on INITIAL results
				})
			}
	
			else {
				citiesFilterOptions.forEach(function(item) {
					self.updateOptions(item, 0, result, jQ, 'city'); // we update the count based on LATEST results instead
				})
			}
	
		}
	
		//
		// updating the cats counts...
		//
		if (self.params.disable_cats != true) {

			catsFilterCheckboxes.forEach(function(item) {
				self.updateCheckboxes(item, 0, result, jQ, 'categories'); // we update the count based on LATEST results instead
			})

			// if (jobtypesFilterUnselected && companiesFilterUnselected && citiesFilterUnselected && searchFilterUnselected) {
			// 	catsFilterCheckboxes.forEach(function(item) {
			// 		self.updateCheckboxes(item, 0, initial_results, jQ, 'categories'); // we update the count based on INITIAL results
			// 	})
			// }
	
			// else if (jobtypesFilterSelected || companiesFilterSelected || citiesFilterSelected || searchFilterSelected) {
			// 	catsFilterCheckboxes.forEach(function(item) {
			// 		self.updateCheckboxes(item, 0, result, jQ, 'categories'); // we update the count based on LATEST results instead
			// 	})
			// }
	
		}
		
	
	}

	// rename this...
	updateCheckboxes(c, count, result, jQ, key) {

		if (result.length > 0) {
			jQ.records = result; // set querying from live jobs
			count = jQ.where({ [key]: c.value }).count;
		}
	
		//c.next().text(c.val() + '(' + count + ')');
		c.nextElementSibling.innerHTML = c.value + '(' + count + ')';
	
		// if (count == 0) c.parent('label').parent('.checkbox').hide();
		// if (count > 0) c.parent('label').parent('.checkbox').show();
		if (count == 0) c.closest('.checkbox').style.display = 'none';
		if (count > 0) c.closest('.checkbox').style.display = 'block';
	
	}

	// rename this...
	updateOptions(c, count, result, jQ, key) {
	
		if (c.value != 'all') {
	
			if (result.length > 0) {
				jQ.records = result; // set querying from live jobs
				count = jQ.where({ [key]: c.value }).count;
			}
	
			c.innerHTML = c.value + '(' + count + ')';
	
			if(count == 0) c.style.display = 'none';
			if(count > 0) c.style.display = 'block';
	
		}
	
	}

	// remove jquery....
	hidePagination() {
		var paginationItems = $("#pagination nav ul").children();
		if (paginationItems.length == 1) {
			$("#pagination").hide();
		} else {
			$("#pagination").show();
		}
	}

	// remove jquery....
	hidePerPage(result) {
	
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

}
window.JobBoardFilteredFeed = JobBoardFilteredFeed;