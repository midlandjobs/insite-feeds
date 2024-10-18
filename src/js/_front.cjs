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
	#jobs;
	constructor(jobs = [], params = { 

		// for template overrides & multiple feeds on a page, we need to set a unique ID for each feed
		// null|string/int
		id: null, 

		// sorting settings - remove or set to false to keep jobs order as it comes (default)
		// possible settings: 'title', 'date', 'referencenumber' & 'random'
		sorting: false,

		// pagination settings - object
		pagination: null,

		// filters settings - array of objects
		filters: null,

		// search settings - true|false
		search: true,

		// count settings - true|false
		counts: true,

		// query settings, filter the results
		query_by: null,

		scope: null // for uikit scoping

	}){

		//
		// JsonQuery test
		//

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
		// console.log('test data');
		// console.log(movieResults);
		// console.log('end of test data');

		//
		// jobs input (not yet refomed)
		//

		this.#jobs = jobs;

		//
		// templates
		//

		// main
		this.main_template = require('components/main.html').default;
		this.main_sidebar_template = require('components/main_sidebar.html').default;
		this.topbar_template = require('components/topbar.html').default;
		this.count_template = require('components/count.html').default;
		this.divider_template = require('components/divider.html').default;

		// job/s
		this.jobs_wrap_template = require('components/jobs/jobs_wrap.html').default;
		this.job_template = require('components/jobs/job.html').default;
		// this.#error_template = require('components/error.html').default;

		// filters
		this.filters_template = require('components/filters/filters_wrap.html').default;
		this.filter_template = require('components/filters/filter_wrap.html').default;
		this.search_template = require('components/filters/search.html').default;
		this.checkbox_template = require('components/filters/checkbox.html').default;
		this.option_template = require('components/filters/option.html').default;

		this.checkboxes_template = require('components/filters/checkboxes.html').default;
		this.options_template = require('components/filters/options.html').default;

		// pagination
		this.pagination_wrap_template = require('components/pagination/pagination_wrap.html').default;
		this.perpage_wrap_template = require('components/pagination/perpage_wrap.html').default;

		//
		// params
		//
		// all optionals or defaults can be done thru params
		//
    this.params = params;

		//
		// outs (reformed jobs & filter data)
		//
		// reform the jobs data according to params, before anything else happens with it. 
		// defined after this.params!!!
		//
    this.jobs = this.reformTheJobs();
		this.filters = this.dataForFilters();

		//
		// scope
		//
		if(this.params.scope && typeof UIkit != "undefined") UIkit.container = this.params.scope;

	}

  //
  //
  // setup methods
  //
  //

	// @ constructor() - this.#jobs || this.params || this.params.filters || this.params.query_by
  reformTheJobs(){
		var jobs =  this.#jobs;
    if (jobs) {

      // loop thru & manipulate the job items data here
      for(let job of jobs) {

				//
				// programmatic reformations according to filter params
				//

				// reform the job data programmatcially via the filter params
				if(this.params.filters && this.params.filters.length > 0) job = this._reformJobDataByFilters(job);

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

				// empty city? just set it as midlands
				if (Object.keys(job.city).length == 0) job.city = 'Midlands';

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
			jobs = this._sortTheJobs(jobs);

    }
    return jobs;
  }

	// @ constructor() - this.jobs || this.params || this.params.filters
	dataForFilters(){
		var data = [];
		var jobs = this.jobs;
		var filters = this.params.filters;

		if(filters && filters.length > 0){
			filters.forEach(function(item) {

				const options = [];

				for (let job of jobs) {
					if(!item.setArray){
						options.push(job[item.key]);
					} else {
						for (let type of job[item.plural.toLowerCase()]) {
							options.push(type);
						}
					}
				}

				var unique_options = options.filter(function (value, index, array) {
					return array.indexOf(value) === index;
				});

				var unique_options = unique_options.filter(function (value, index, array) {
					if(!item.removeTerms.includes(value)) return value;
				}.bind(this));

				var optionObj = {};
				optionObj['key'] = item.key;
				optionObj['singular'] = item.singular;
				optionObj['plural'] = item.plural;
				optionObj['type'] = item.type;
				optionObj['setArray'] = item.setArray;
				optionObj['removeTerms'] = item.removeTerms;
				optionObj['data'] = unique_options;

				data.push(optionObj);

			}.bind(this));
		}

		return data;
	}

	// @ reformTheJobs() - this.params || this.params.filters
	_reformJobDataByFilters(job){

		// loop thru and 'setArray' from the filter criterias
		this.params.filters.forEach(function(item) {
			if(item.setArray){
				if(job[item.key].length > 0) job[item.plural.toLowerCase()] = job[item.key].split(', ');
			}
		});

		// more...

		return job;
	}

	// @ reformTheJobs() - this.params || this.params.sorting
	_sortTheJobs(jobs){
		if (this.params && this.params.sorting == 'title') jobs = fns.sortDataBy(jobs, 'title');
		if (this.params && this.params.sorting == 'date') jobs = fns.sortDataBy(jobs, 'date');
		if (this.params && this.params.sorting == 'referencenumber') jobs = fns.sortDataBy(jobs, 'referencenumber');
		if (this.params && this.params.sorting == 'random') jobs = fns.sortDataBy(jobs, 'random');
		return jobs;
	}

  //
  //
  // render methods
  //
  //

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
			this._renderFeedWraps(sel);

			//
			// STEP 2 - populate the filters
			//
			// setup new jobs data & then populate filters (if filters are not disabled)
			//
			this._populateFilters(sel) // populate the filters (using the jobs data)

			//
			// STEP 3 - set the initial total counts & initial filter counts
			//
			//
			//if(this.params.counts && !this.params.pagination) this.setCounts(jobs.length);
			if(this.params.counts) this.setCounts(jobs);
			if(this.params.counts && this.params.filters && this.params.filters.length > 0) this.setFilterCounts(jobs);

			//
			// STEP 4 - define our job templates (and custom template override)
			//
			// defines which job template is to be used. the inbuilt one (default), 
			//
			var _template = false;
			var _template_html = this.job_template;
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
					//if(this.params.counts && this.params.filters && this.params.filters.length > 0) this.setFilterCounts(liveJobs);
					
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
			// now dynamic from this.params.filters config
			//
			if(this.params.filters && this.params.filters.length > 0){
				this.params.filters.forEach(function(item) {
					var criteriaFieldName = item.key;
					if(item.setArray) criteriaFieldName = item.plural.toLowerCase();
					if(item.type == 'checkbox'){
						var checkSel = '#' +  item.key + '_filter input:checkbox';
						FJS.addCriteria({ field: criteriaFieldName, ele: checkSel});
					} else {
						var optionSel = '#' +  item.key + '_filter';
						FJS.addCriteria({ field: criteriaFieldName, ele: optionSel, all: 'all' });
					}
				}.bind(this));
			}


		}
	}

	// @ renderTheJobs(): 1
	_renderFeedWraps(sel) {

		// ORDER
		//
		// 1. main
		// 2. count
		// 3. divider
		// 4. filters wraps
		// 5. search
		// 6. filters
		// 7. topbar
		// 8. pagination wrap
		// 9. perpage wrap
		// 10. jobswrap

		//
		//
		// MAIN TEMPLATE
		//
		// static components: main.html | main_sidebar.html
		// selectors: #main-template | #main-template_123
		//
		//
		//this.____renderMainComponent(sel);
		this.__renderMain(sel);

		//
		//
		// COUNTS TEMPLATE
		//
		// static components: _count.html
		// selectors: #count-template | #count-template_123
		// container selectors: #Feed_123 #FiltersCount
		//
		//
		//if(this.params.counts) this.____renderStaticComponent(this.count_template, 'count-template', '#FiltersCount', sel);
		if(this.params.counts) this.__renderStatic(this.count_template, 'count-template', sel + ' #FiltersCount');

		//
		//
		// DIVIDER TEMPLATE
		//
		// static components: _divider.html
		// selectors: #divider-template | #divider-template_123
		// container selectors: #Feed_123 #FiltersDivider
		//
		//
		//if((this.params.filters && this.params.filters.length > 0 || this.params.search) && this.params.counts) this.____renderStaticComponent(this.divider_template, 'divider-template', '#FiltersDivider', sel);
		if(((this.params.filters && this.params.filters.length > 0) || this.params.search) && this.params.counts) this.__renderStatic(this.divider_template, 'divider-template', sel + ' #FiltersDivider');

		//
		//
		// FILTERS WRAP TEMPLATE
		//
		// static components: _filters.html
		// selectors: #filters-template | #filters-template_123
		// container selectors: #Feed_123 #FiltersList
		//
		//
		//if(this.params.filters && this.params.filters.length > 0 || this.params.search) this.____renderStaticComponent(this.filters_template, 'filters-template', '#FiltersList', sel);
		if(this.params.filters && this.params.filters.length > 0 || this.params.search) this.__renderStatic(this.filters_template, 'filters-template', sel + ' #FiltersList');
		//if(this.params.filters && this.params.filters.length > 0 || this.params.search) this.__renderFiltersComponent(this.params.filters, this.filter_template, 'filter-template', '#filtersArea', sel);
		if(this.params.filters && this.params.filters.length > 0 || this.params.search) this.__renderDynamic(this.filter_template, 'filter-template', sel + ' #filtersArea', this.params.filters);
		//
		//
		// SEARCH TEMPLATE
		//
		// static components: _search.html
		// selectors: #search-template | #search-template_123
		// container selectors: #Feed_123 #searchFilters
		//
		//
		//if(this.params.search) this.____renderStaticComponent(this.search_template, 'search-template', '#searchFilters', sel);
		if(this.params.search) this.__renderStatic(this.search_template, 'search-template', sel + ' #searchFilters');

		//
		//
		// FILTERS TEMPLATE/S
		//
		// company, jobtype, city, category
		// static components: _company.html | _jobtype.html | _city.html | _category.html
		//
		//
		if(this.params.filters && this.params.filters.length > 0){
			this.params.filters.forEach(function(item) {
				// var templateKey = item.key + '_template';
				var templateKey = 'options_template';
				if(item.type == 'checkbox') templateKey = 'checkboxes_template';
				var templateID = item.key + '-template';
				var eleID = ' #' + item.key + 'Filters';
				//this.__renderStatic(this[templateKey], templateID, sel + eleID);
				this.__renderStaticData(this[templateKey], templateID, sel + eleID, item)
			}.bind(this))
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

			//this.____renderStaticComponent(this.topbar_template, 'topbar-template', '#FiltersTopBar', sel);
			this.__renderStatic(this.topbar_template, 'topbar-template', sel + ' #FiltersTopBar');

			//
			//
			// PAGINATION WRAP TEMPLATE
			//
			// static components: _pagi.html
			// selectors: #pagi-template | #pagi-template_123
			// container selectors: #Feed_123 #filtersPagintion
			//
			//

			//this.____renderStaticComponent(this.pagination_wrap_template, 'pagination-wrap-template', '#filtersPagintion', sel);
			this.__renderStatic(this.pagination_wrap_template, 'pagination-wrap-template', sel + ' #filtersPagintion');

			//
			//
			// PERPAGE WRAP TEMPLATE
			//
			// static components: _perpagi.html
			// selectors: #perpagi-template | #perpagi-template_123
			// container selectors: #Feed_123 #filtersPerPage
			//
			//

			//if(this.params.pagination.perPage) this.____renderStaticComponent(this.perpage_wrap_template, 'perpage-wrap-template', '#filtersPerPage', sel);
			if(this.params.pagination.perPage) this.__renderStatic(this.perpage_wrap_template, 'perpage-wrap-template', sel + ' #filtersPerPage');

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
		//this.____renderStaticComponent(this.jobs_wrap_template, 'jobs-wrap-template', '#FiltersJobsWrap', sel);
		this.__renderStatic(this.jobs_wrap_template, 'jobs-wrap-template', sel + ' #FiltersJobsWrap');

	}

	// @ renderTheJobs(): 2
	// fill th filters wrap with data
	_populateFilters(sel){
		var filters = this.filters;
		if(filters && filters.length > 0){
			filters.forEach(function(item) {
				var templateName = item.type + '_template';
				var templateId = item.type + '-template';
				var optionId = ' #' + item.key + '_filter';
				var empty = true;
				if(item.type == 'option') empty = false;
				//this.__renderOptionComponent(item.data, this[templateName], templateId, optionId, sel, empty) //___renderOptionComponents
				this.__renderOption(this[templateName], templateId, sel + optionId, item.data, empty)
			}.bind(this))
		}
	}

	// @ _renderFeedWraps()
	// for rendering the main wrap
	// pass on: id
	__renderMain(sel){
		var html = this.main_template;
		if(this.params.counts || (this.params.filters && this.params.filters.length > 0) || this.params.search) html = this.main_sidebar_template;
		if(fns.isElementValid(document.getElementById('main-template'))) html = document.getElementById('main-template').innerHTML;
		if(this.params.id && fns.isElementValid(document.getElementById('main-template_'+this.params.id))) html = document.getElementById('main-template_'+this.params.id).innerHTML;
		if(html) this.___renderComponent(html, sel);
	}

	// @ _renderFeedWraps()
	// for rendering all other wraps
	// pass on: id
	__renderStatic(html, id, sel){
		if(id){
			if(fns.isElementValid(document.getElementById(id))) html = document.getElementById(id).innerHTML;
			if(fns.isElementValid(document.getElementById(id+'_'+this.params.id))) html = document.getElementById(id+'_'+this.params.id).innerHTML;
		}
		if(html) this.___renderComponent(html, sel);
	}
	__renderStaticData(html, id, sel, data){
		if(id){
			if(fns.isElementValid(document.getElementById(id))) html = document.getElementById(id).innerHTML;
			if(fns.isElementValid(document.getElementById(id+'_'+this.params.id))) html = document.getElementById(id+'_'+this.params.id).innerHTML;
		}
		if(html) this.___renderDataComponent(html, sel, data);
	}

	// @ _renderFeedWraps()
	// for rendering the filters wrap
	// pass on: all filters data
	__renderDynamic(html, id, sel, data, empty = true){
		if(id){
			if(fns.isElementValid(document.getElementById(id))) html = document.getElementById(id).innerHTML;
			if(fns.isElementValid(document.getElementById(id+'_'+this.params.id))) html = document.getElementById(id+'_'+this.params.id).innerHTML;
		}
		if(html) this.___renderComponents(html, sel, data, empty);
	}

	// @ _populateFilters()
	// for rendering individual filter terms
	// pass on: name:item,value:item
	__renderOption(html, id, sel, data, empty = true){
		if(id){
			if(fns.isElementValid(document.getElementById(id))) html = document.getElementById(id).innerHTML;
			if(fns.isElementValid(document.getElementById(id+'_'+this.params.id))) html = document.getElementById(id+'_'+this.params.id).innerHTML;
		}
		if(html) this.___renderOptionComponents(html, sel, data, empty);
	}

	// @ __renderMain() | __renderStatic()
	// passes on the this.params.id as id
	___renderComponent(html, sel){
		var templateFn = FilterJS.templateBuilder(html);
		if(document.querySelector(sel) != null){
			document.querySelector(sel).innerHTML = '';
			let el = document.createRange().createContextualFragment(templateFn({id:this.params.id}));
			document.querySelector(sel).appendChild(el);
		}
	}
	___renderDataComponent(html, sel, data){
		var templateFn = FilterJS.templateBuilder(html);
		if(document.querySelector(sel) != null){
			document.querySelector(sel).innerHTML = '';
			let el = document.createRange().createContextualFragment(templateFn(data));
			document.querySelector(sel).appendChild(el);
		}
	}
	// @ __renderDynamic()
	// passes on the component item data
	___renderComponents(html, sel, data, empty){
		var templateFn = FilterJS.templateBuilder(html);
		if(document.querySelector(sel) != null){
			if(empty) document.querySelector(sel).innerHTML = ''; // empty target element first
			if(Array.isArray(data) && data.length > 0){
				data.forEach((item) => {
					let el = document.createRange().createContextualFragment(templateFn(item));
					document.querySelector(sel).append(el);
				});
			}
		}
	}
	// @ __renderOption()
	// passes on the component item data as name/value
	___renderOptionComponents(html, sel, data, empty){
		var templateFn = FilterJS.templateBuilder(html);
		if(document.querySelector(sel) != null){
			if(empty) document.querySelector(sel).innerHTML = ''; // empty target element first
			if(Array.isArray(data) && data.length > 0){
				data.forEach((item) => {
					let el = document.createRange().createContextualFragment(templateFn({name:item,value:item}));
					document.querySelector(sel).append(el);
				});
			}
		}
	}

	// redo this template & reuse. error template is for where no jobs exist (trying to render nothing)
	______renderErrorTemplate(sel) {

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
  // other methods: counts
  //
  //

	// setting the overall counts
	setCounts(jobs) {
		if(document.getElementById('total_jobs_'+this.params.id)){
			var total = document.getElementById('total_jobs_'+this.params.id);
			total.innerHTML = jobs.length;
		}
	}
	// setting the filter counts as per params.filters
	setFilterCounts(jobs) {
		if(this.params.filters && this.params.filters.length > 0){
			this.params.filters.forEach(function(item) {
				var filterOptions = document.querySelectorAll('#' + item.key + '_filter option');
				if(item.type == 'checkbox') filterOptions = document.querySelectorAll('#' + item.key + '_filter input');
				var filterOptionsKey = item.key;
				if(item.setArray) filterOptionsKey = item.plural.toLowerCase();
				var filterOptionsType = null;
				if(item.type == 'checkbox') filterOptionsType = 'checkbox';
				filterOptions.forEach(function(option) {
					this.setOptionCount(option, filterOptionsKey, jobs, filterOptionsType);
				}.bind(this))
			}.bind(this));
		}
	}
	// @ setFilterCounts()
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

  //
  //
  // other methods: pagination
  //
  //

	// hiding pagination when necessary
	hidePagination() {
		var paginationEle = document.getElementById('pagination');
		var paginationItems = document.querySelectorAll('#pagination nav ul li');
		if (paginationItems.length == 1) {
			paginationEle.style.display = 'none';
		} else {
			paginationEle.style.display = 'block';
		}
	}
	// hiding perpage items when necessary
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