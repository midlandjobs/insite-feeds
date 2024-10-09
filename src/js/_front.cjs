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

// stuff in json_query is made available to window
require('./filter/json_query.js');

// stuff in main is made available to window
require('./filter/main.js');

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
	#filter_template_static
	#jobs_wrap_template_static
	#topbar_template_static
	#divider_template_static
	#search_template_static
	#company_template_static
	#jobtype_template_static
	#city_template_static
	#category_template_static
	#pagination_wrap_template_static
	#perpage_wrap_template_static

	constructor(jobs = [], params = { 

		//  for template overrides & multiple feeds on a page, you need to set a unique ID for each feed.
		id: null, // can be null or string/int.

		// sorting settings - remove or set to false to keep jobs order as it comes (default)
		sorting: false, // possible settings: 'title', 'date', 'referencenumber' & 'random'

		// query settings, filter the results
		query_by: null,

		// pagination settings
		//active_pagination: true,
		//active_perpage: true,

		// filters settings
		active_filters: true,
		disable_categories: false, 
		disable_cities: false, 
		disable_companies: false, 
		disable_jobtypes: false,

		filters: null,

		// search settings
		search: true,

		// count settings
		counts: true,

		scope: null // for uikit scoping

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
		console.log('test data');
		console.log(movieResults);
		console.log('end of test data');

		//
		// templates
		//

		// main
		this.#main_template_static = require('components/main.html').default;
		this.#main_sidebar_template_static = require('components/main_sidebar.html').default;
		this.#topbar_template_static = require('components/topbar.html').default;
		this.#count_template_static = require('components/count.html').default;
		this.#divider_template_static = require('components/divider.html').default;

		// job/s
		this.#jobs_wrap_template_static = require('components/jobs/jobs_wrap.html').default;
		this.#job_template_static = require('components/jobs/job.html').default;

		// filters
		this.#filters_template_static = require('components/filters/filters_wrap.html').default;
		this.#filter_template_static = require('components/filters/filter_wrap.html').default;
		this.#search_template_static = require('components/filters/search.html').default;
		this.#company_template_static = require('components/filters/company.html').default;
		this.#jobtype_template_static = require('components/filters/jobtype.html').default;
		this.#city_template_static = require('components/filters/city.html').default;
		this.#category_template_static = require('components/filters/category.html').default;
		this.#checkbox_template_static = require('components/filters/checkbox.html').default;
		this.#option_template_static = require('components/filters/option.html').default;

		// pagination
		this.#pagination_wrap_template_static = require('components/pagination/pagination_wrap.html').default;
		this.#perpage_wrap_template_static = require('components/pagination/perpage_wrap.html').default;

		// this.#error_template = require('components/error.html').default;

		//
		// /templates
		//

    // all optionals or defaults can be done thru params
    this.params = params;

    // reform the jobs data according to params, before anything else happens with it
    // defined after this.params!!!
    this.jobs = this.reformTheJobs(jobs); 

    // uikit thingy
		if(this.params.scope && typeof UIkit != "undefined") UIkit.container = this.params.scope;

		if(this.params.filters) console.log(this.params.filters);

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

				//
				// programmatic reformations according to filter params
				//

				// reform the job data programmatcially via the filter params
				if(this.params.filters && this.params.filters.length > 0) job = this.reformJobDataByFilterCriteria(job);

				//
				// additional reformations, just for neatness 
				//

        // reform company website urls to include http/s
        if (job.companywebsite.length > 0) {
          const withHttp = url => !/^https?:\/\//i.test(url) ? `http://${url}` : url;
          const companywebsiteWithHttp = withHttp(job.companywebsite);
          job.companywebsite = companywebsiteWithHttp;
        }

				// statically/manually change up some of the text in the jobtypes
				if(job.jobtypes){
					job.jobtypes.forEach(function(item, index, arr) {
						if(item == 'Full time') arr[index] = 'Full-time';
						if(item == 'Part time') arr[index] = 'Part-time';
						if(item == 'Live-In Employee') arr[index] = 'Live-in';
					});
				}

        // more...
        // if (job.description.length > 0) {}
  
      }

			// filter the jobs here...
			if(this.params.query_by){
				console.log('query_by: exists');
				if(fns.isLiteralObject(this.params.query_by)){
					console.log('query_by: isLiteralObject');
					// good to go & check the data
				}
			}

      // sort the jobs according params
			jobs = this.sortTheJobs(jobs);

    }
    return jobs;
  }

	// called on reformTheJobs()
	reformJobDataByFilterCriteria(job){

		// loop thru and 'setArray' from the filter criterias
		this.params.filters.forEach(function(item) {
			if(item.setArray){
				if(job[item.key].length > 0) job[item.plural.toLowerCase()] = job[item.key].split(', ');
			}
		});

		// more...

		return job;
	}

	// called on reformTheJobs()
	sortTheJobs(jobs){
		if (this.params && this.params.sorting == 'title') jobs = fns.sortDataBy(jobs, 'title');
		if (this.params && this.params.sorting == 'date') jobs = fns.sortDataBy(jobs, 'date');
		if (this.params && this.params.sorting == 'referencenumber') jobs = fns.sortDataBy(jobs, 'referencenumber');
		if (this.params && this.params.sorting == 'random') jobs = fns.sortDataBy(jobs, 'random');
		return jobs;
	}

  // called on frontend
	renderTheJobs(sel = null) {
		// dont do anything for rendering unless sel is provided & a string
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
			// STEP 3 - set the initial total counts & initial filter counts
			//
			//
			//if(this.params.counts && !this.params.pagination) this.setCounts(jobs.length);
			if(this.params.counts) this.setCounts(jobs);
			// if(this.params.counts && this.params.active_filters) this.setFilterCounts(jobs);

			//
			// STEP 4 - define our job templates (and custom template override)
			//
			// defines which job template is to be used. the inbuilt one (default), 
			//
			var _template = false;
			var _template_html = this.#job_template_static;
			if (fns.isElementValid(document.querySelector('#job-template'))) var _template = '#job-template';
			if (fns.isElementValid(document.querySelector('#job-template'+'_'+this.params.id))) var _template = '#job-template'+'_'+this.params.id;
			if (fns.isElementValid(document.querySelector('#job-template')) || fns.isElementValid(document.querySelector('#job-template'+'_'+this.params.id))) var _template_html = false;

			//
			// STEP 5 - setup pagination/perpage configs
			//
			var pagination_config = false;
			if(this.params.pagination){

				// pagination template stuff
				// pagination & perpage templates to be used in FilterJS(): if element with id is in dom, set var to that id
				var _pagination_template = false;
				if (fns.isElementValid(document.querySelector('#pagination-template'))) var _pagination_template = '#pagination-template';
				if (fns.isElementValid(document.querySelector('#pagination-template'+'_'+this.params.id))) var _pagination_template = '#pagination-template'+'_'+this.params.id;

				// defaults
				var pagination_config = {
					container: '#pagination', // define container for pagination (static)
					paginationView: _pagination_template, // define template for pagination (static)
					visiblePages: 5, // set init visible pages within the pagination (dynamic below)
					initPerPage: 12, // set an initial per page count, in case where perPage below is false/not set (dynamic below)
					perPage: false // (dynamic below)
				};

				// dynamic overwrites for pagination depending on args given
				if(this.params.pagination.visiblePages) pagination_config.visiblePages = this.params.pagination.visiblePages;
				if(this.params.pagination.initPerPage) pagination_config.initPerPage = this.params.pagination.initPerPage;

				// perpage settings
				if(this.params.pagination.perPage){

					// pagination template stuff
					// pagination & perpage templates to be used in FilterJS(): if element with id is in dom, set var to that id
					var _perpage_template = false;
					if (fns.isElementValid(document.querySelector('#perpage-template'))) var _perpage_template = '#perpage-template';
					if (fns.isElementValid(document.querySelector('#perpage-template'+'_'+this.params.id))) var _perpage_template = '#perpage-template'+'_'+this.params.id;

					// defaults
					pagination_config.perPage = {
						values: [12, 15, 18], // per page dropdown options
						container: '#per_page', // per page container
						perPageView: _perpage_template,
					};

					// dynamic overwrites for perpage depending on args given
					if(this.params.pagination.perPage.values) pagination_config.perPage.values = this.params.pagination.perPage.values;

				}

			}

			//
			// STEP 6 - setup the search configs
			//
			var search_config = false;
			if(this.params.search) var search_config = {ele: '#searchbox'};

			//
			// BEFORE MAIN STEP - setup the filter callbacks (fires after every filtering but wont fire unless pagination is set)
			//
			// here we reset the main counts & hide pagination/perPage where necessary
			//
			//
			var filter_callbacks = {
				afterFilter: function (liveJobs) {

					if(this.params.counts) this.setCounts(liveJobs); // updates the main counts from the live jobs after filtering

					// we no longer update the filter counts from the live jobs after filter, we may go back to this...
					// if(this.params.counts && this.params.active_filters) this.setFilterCounts(liveJobs);
					
					// hide irrelevant pagination/items after filtering
					if(this.params.pagination) this.hidePagination();

					// hide irrelevant perpage/items after filtering
					if(this.params.pagination.perPage) this.hidePerPageItems(liveJobs.length, pagination_config.perPage.values);

				}.bind(this)
			};

			//
			// MAIN STEP - the main rendering part
			//
			// intiate the jobs listing & filters
			//
			var FJS = FilterJS(jobs, '#jobs_'+this.params.id, {
				template_html: _template_html, // html. define static/default html template used for each job. 
				template: _template, // selector for job template override. set this to false to use static template_html instead
				search: search_config, // define search
				pagination: pagination_config, // define pagination & perpage
				callbacks: filter_callbacks, // callbacks after filtering
			});

			//
			// AFTER MAIN STEP - setup filter criterias
			//
			// data to be used for filtering: city, jobtypes, company, categories
			//
			if (this.params.active_filters) {
				if (this.params.disable_cities != true) FJS.addCriteria({ field: 'city', ele: '#city_filter', all: 'all' });
				if (this.params.disable_jobtypes != true) FJS.addCriteria({ field: 'jobtypes', ele: '#jobtype_filter', all: 'all' });
				if (this.params.disable_companies != true) FJS.addCriteria({ field: 'company', ele: '#company_filter', all: 'all' });
				if (this.params.disable_categories != true) FJS.addCriteria({ field: 'categories', ele: '#category_filter input:checkbox'});
			}

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

		if(this.params.counts) this.renderStaticComponent(this.#count_template_static, 'count-template', '#FiltersCount', sel);

		//
		//
		// DIVIDER TEMPLATE
		//
		// static components: _divider.html
		// selectors: #divider-template | #divider-template_123
		// container selectors: #Feed_123 #FiltersDivider
		//
		//

		if((this.params.active_filters || this.params.search) && this.params.counts) this.renderStaticComponent(this.#divider_template_static, 'divider-template', '#FiltersDivider', sel);

		//
		//
		// FILTERS WRAP TEMPLATE
		//
		// static components: _filters.html
		// selectors: #filters-template | #filters-template_123
		// container selectors: #Feed_123 #FiltersList
		//
		//

		if(this.params.active_filters || this.params.search) this.renderStaticComponent(this.#filters_template_static, 'filters-template', '#FiltersList', sel);
		
		if(this.params.active_filters || this.params.search) this.renderFilterComponent(this.params.filters, this.#filter_template_static, 'filter-template', '#filtersArea', sel);

		//
		//
		// SEARCH TEMPLATE
		//
		// static components: _search.html
		// selectors: #search-template | #search-template_123
		// container selectors: #Feed_123 #searchFilters
		//
		//

		if(this.params.search) this.renderStaticComponent(this.#search_template_static, 'search-template', '#searchFilters', sel);

		//
		//
		// FILTERS TEMPLATE/S
		//
		// company, jobtype, city, category
		// static components: _company.html | _jobtype.html | _city.html | _category.html
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

			//if(this.params.disable_companies != true) this.renderStaticComponent(this.#company_template_static, 'company-template', '#companyFilters', sel);

			//
			//
			// JOBTYPE TEMPLATE
			//
			// static components: _jobtype.html
			// selectors: #jobtype-template | #jobtype-template_123
			// container selectors: #Feed_123 #jobtypeFilters
			//
			//

			//if (this.params.disable_jobtypes != true) this.renderStaticComponent(this.#jobtype_template_static, 'jobtype-template', '#jobtypeFilters', sel);

			//
			//
			// CITY TEMPLATE
			//
			// static components: _city.html
			// selectors: #city-template | #city-template_123
			// container selectors: #Feed_123 #cityFilters
			//
			//

			//if (this.params.disable_cities != true) this.renderStaticComponent(this.#city_template_static, 'city-template', '#cityFilters', sel);

			//
			//
			// CATS TEMPLATE
			//
			// static components: _category.html
			// selectors: #category-template | #category-template_123
			// container selectors: #Feed_123 #categoryFilters
			//
			//

			//if (this.params.disable_categories != true) this.renderStaticComponent(this.#category_template_static, 'category-template', '#categoryFilters', sel);



			// loop here and 

			if(this.params.filters && this.params.filters.length > 0){
				var self = this;
				this.params.filters.forEach(function(item) {
					var templateVar = '#' + item.key + '_template_static';
					var templateKeyVar = item.key + '-template';
					var templateID = '#' + item.key + 'Filters';
					console.log(self.#category_template_static);
					this.renderStaticComponent(self[templateVar], templateKeyVar, templateID, sel)
				}.bind(this))
			}


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

		if(this.params.pagination){

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

			if(this.params.pagination.perPage) this.renderStaticComponent(this.#perpage_wrap_template_static, 'perpage-wrap-template', '#filtersPerPage', sel);

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
			if(this.params.disable_categories != true){

				const categories = [];
				for (let job of jobs) {
					for (let category of job.categories) {
						categories.push(category);
					}
				}
	
				// filters the categories array to remove the duplicates
				var unique_categories = categories.filter(function (value, index, array) {
					return array.indexOf(value) === index;
				});
	
				// disable some cats from the categories for filtering. provided as an array in params. check the params exist first
				if(this.params.disable_categories && this.params.disable_categories.length > 0){
					var unique_categories = unique_categories.filter(function (value, index, array) {
						if(!this.params.disable_categories.includes(value)) return value;
					}.bind(this));
				}
	
				// render the new data now into the filters
				// if (this.params.active_filters) this.renderCheckboxesTemplate(unique_categories, '#category_filter');
				if (this.params.active_filters) this.renderFilterOptionComponent(unique_categories, this.#checkbox_template_static, 'checkbox-template', '#category_filter', sel);

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
				if (this.params.active_filters) this.renderFilterOptionComponent(unique_cities, this.#option_template_static, 'option-template', '#city_filter', sel, false);
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
				if (this.params.active_filters) this.renderFilterOptionComponent(unique_jobtypes, this.#option_template_static, 'option-template', '#jobtype_filter', sel, false);
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
				if (this.params.active_filters) this.renderFilterOptionComponent(unique_companies, this.#option_template_static, 'option-template', '#company_filter', sel, false);
			}

		}
	}

  //
  //
  // static render methods (only pass on the ID)
  //
  //

	// called in renderFilteredFeedWrappers()
	renderMainComponent(custom_sel){

		//
		// template hierarchy
		//

		// set default static template
		var component_html = this.#main_template_static;
		if(this.params.counts || this.params.active_filters || this.params.search) component_html = this.#main_sidebar_template_static; // if options are set, reset html to sidebar template

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

		//console.log(static_component);

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

  //
  //
  // dynamic render methods (pass on more complex data than ID)
  //
  //

	// called in populateFilters()
	renderFilterOptionComponent(data = null, static_component = false, component_id = '', sel = null, custom_sel = null, empty = true){

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
				if(empty) document.querySelector(component_sel).innerHTML = ''; // set the target ele to empty
				if(Array.isArray(data) && data.length > 0){
					data.forEach((item) => {
						let component_el = document.createRange().createContextualFragment(component_templateFn({name:item,value:item}));
						document.querySelector(component_sel).append(component_el);
					});
				}
			}

		}

	}

	// called in populateFilters()
	renderFilterComponent(data = null, static_component = false, component_id = '', sel = null, custom_sel = null, empty = true){

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
			var component_sel = custom_sel + ' ' + sel;

			// if the components wrapper element is actually valid in the dom
			// we place the newly created element, from the template, into the wrapper
			if(document.querySelector(component_sel) != null){
				if(empty) document.querySelector(component_sel).innerHTML = ''; // set the target ele to empty
				if(Array.isArray(data) && data.length > 0){
					data.forEach((item) => {
						let component_el = document.createRange().createContextualFragment(component_templateFn({
              key: item.key,
              singular: item.singular,
              plural: item.plural,
              type: item.type,
              setArray: item.setArray,
              removeTerms: item.removeTerms
						}));
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

	// setting the counts
	setCounts(jobs) {

		// overall counts
		if(document.getElementById('total_jobs_'+this.params.id)){
			var total = document.getElementById('total_jobs_'+this.params.id);
			total.innerHTML = jobs.length;
		}

	}
	setFilterCounts(jobs) {

		var self = this;

		// companies filters counts
		if (this.params.disable_companies != true) {
			var companiesFilterOptions = document.querySelectorAll('#company_filter option');
			companiesFilterOptions.forEach(function(item) {
				self.setOptionCount(item, 'company', jobs);
			})
		}

		// jobtypes filters counts
		if (this.params.disable_jobtypes != true) {
			var jobtypesFilterOptions = document.querySelectorAll('#jobtype_filter option');
			jobtypesFilterOptions.forEach(function(item) {
				self.setOptionCount(item, 'jobtypes', jobs);
			})
		}

		// cities filters counts
		if (this.params.disable_cities != true) {
			var citiesFilterOptions = document.querySelectorAll('#city_filter option');
			citiesFilterOptions.forEach(function(item) {
				self.setOptionCount(item, 'city', jobs);
			})
		}

		// cats filters counts
		if (self.params.disable_categories != true) {
			var categoriesFilterCheckboxes = document.querySelectorAll("#category_filter input");
			categoriesFilterCheckboxes.forEach(function(item) {
				self.setOptionCount(item, 'categories', jobs, 'checkbox');
			})
		}

	}
	setOptionCount(ele, key, data, type = null) {

		var count = 0;
		var jQ = JsonQuery(data);
		if(data.length > 0) count = jQ.where({ [key]: ele.value }).count;

		if(type == 'checkbox'){

			ele.nextElementSibling.innerHTML = ele.value + '(' + count + ')';
			if (count == 0) ele.closest('.checkbox').style.display = 'none';
			if (count > 0) ele.closest('.checkbox').style.display = 'block';

		} else {

			if (ele.value != 'all') {
				ele.innerHTML = ele.value + '(' + count + ')';
				if(count == 0) ele.style.display = 'none';
				if(count > 0) ele.style.display = 'block';
			}

		}
	
	}

	// hiding pagination & perpage items when necessary
	hidePagination() {
		var paginationEle = document.getElementById('pagination');
		var paginationItems = document.querySelectorAll('#pagination nav ul li');
		if (paginationItems.length == 1) {
			paginationEle.style.display = 'none';
		} else {
			paginationEle.style.display = 'block';
		}
	}
	hidePerPageItems(result_count, values) {
		if(values.length > 1){
			var min = Math.min.apply(null, values);
			var perPageValuesWithoutSmallest = values.filter((e) => {return e != min});
			perPageValuesWithoutSmallest.forEach(function(v) {
				var perPageOptions = document.querySelectorAll('#per_page select option');
				if (perPageOptions.length > 0) {
					perPageOptions.forEach(function(item) {
						if(item.value == v){
							if (result_count < item.value) {
								item.style.display = 'none';
							} else {
								item.style.display = 'block';
							}
						}
					});
				}
			});
		}
	}

}
window.JobBoardFilteredFeed = JobBoardFilteredFeed;