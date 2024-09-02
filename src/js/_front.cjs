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
require('./_filter.js');

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
		id: null, 
		// mode: 'local', 
		sorting: false, 
		scope: null, // '.uk-scope'
		active_filters: false, 
		active_pagination: false, 
		active_perpage: false, 
		active_search: false, 
		active_counts: false, disable_cats: false, disable_cities: false, disable_companies: false, disable_jobtypes: false 
	}){

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
  // the primary output method
  // this class will create an object from the given data (including the jobs)
  // we can then call this method to output the given jobs (to a given sel) as filtered jobs listings
  // all the data needed to output the jobs should be provided to the class/object itself
  //
  // basically, we can provide this class with the jobs & some config settings, and it will produce the filtered jobs feed and place it someplace
  // the class's job is to take the jobs data as json, transform it into html, and place it into the DOM.
  //
  // the fetching part, we will separate...
  //
  // this method WILL be called outside the class. so maybe should be static or something?
  //
  //
	renderTheJobs(sel = null) {
    var jobs = this.jobs;

    //
    // render the wrapper template to start... waiting for jobs first. object can be placed above or below html, but all html pops in together. can just use a loader animation...
    //
    this.renderFilteredFeedWrappers(sel);

    //
    // setup new jobs data & then populate filters (if filters are not disabled)
    //
    this.populateFilters(sel); // populate the filters (using the jobs data)

		// job template stuff
		var _template = false;
		var _template_html = this.#job_template_static;
		if (this.isElementValid(document.querySelector('#job-template'))) var _template = '#job-template';
		if (this.isElementValid(document.querySelector('#job-template'))) var _template_html = false;

		// pagination template stuff
		// pagination & perpage templates to be used in FilterJS(): if element with id is in dom, set var to that id
		var _pagination_template = false;
		var _perpage_template = false;
		if (this.isElementValid(document.querySelector('#pagination-template'))) var _pagination_template = '#pagination-template';
		if (this.isElementValid(document.querySelector('#perpage-template'))) var _perpage_template = '#perpage-template';

		// setup the pagination & perpage array to be used in FilterJS(), selectivley
		var the_pagination = false;
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

		// set th ele for the searchbox, to be used in FilterJS()
		var the_search = false;
		if(this.params.active_search) var the_search = { ele: '#searchbox' };

		//
		// filters: updating the counts - a callback for later (inside FilterJS())
		//
		var filter_callbacks = {
			afterFilter: function (result, jQ) {
				var initial_results = jobs; // initial jobs/result before any filtering done to them
				if(this.params.active_pagination && this.params.active_counts) this.updateCountsLogic(result, jQ, initial_results, this.params.active_search, this.params.disable_cats, this.params.disable_cities, this.params.disable_jobtypes, this.params.disable_companies);
				if(this.params.active_pagination) this.hidePagination();
				if(this.params.active_pagination && this.params.active_perpage) this.hidePerPage(result);
			}.bind(this)
		};

		//
		// activate filters & configs
		//
		var FJS = FilterJS(jobs, '#jobs_'+this.params.id, {
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
		if(this.params.active_counts && !this.params.active_pagination) this.setInitialCounts(jobs.length);

	}

  reformTheJobs(jobs){
    if (jobs) {

      // loop thru & manipulate the job items data here
      for (let job of jobs) {

        // add as array (job.category string changed to job.categories array if any exist)
        if (job.category.length > 0) job.categories = job.category.split(', ');

        // add as array (job.jobtype string changed to job.jobtypes array if any exist)
        if (job.jobtype.length > 0) job.jobtypes = job.jobtype.split(', ');
        
        // reform company website urls to include http/s
        if (job.companywebsite.length > 0) {
          const withHttp = url => !/^https?:\/\//i.test(url) ? `http://${url}` : url;
          const companywebsiteWithHttp = withHttp(job.companywebsite);
          job.companywebsite = companywebsiteWithHttp;
        }

        // more...
        // if (job.description.length > 0) {}
  
      }

      // sort the jobs according params
      if (this.params && this.params.sorting == 'title') jobs = this.sortDataBy(jobs, 'title');
      if (this.params && this.params.sorting == 'date') jobs = this.sortDataBy(jobs, 'date');
      if (this.params && this.params.sorting == 'referencenumber') jobs = this.sortDataBy(jobs, 'referencenumber');
      if (this.params && this.params.sorting == 'random') jobs = this.sortDataBy(jobs, 'random');

    }
    return jobs;
  }

  //
  //
  // method for getting & populating the filter's data
  // used in renderTheJobs()
  //
  //
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
				// if (this.params.active_filters) this.renderCheckboxesTemplate(unique_categories, '#categories_criteria');
				if (this.params.active_filters) this.renderDynamicComponent(unique_categories, this.#checkbox_template_static, 'checkbox-template', '#categories_criteria', sel);

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
  // render component methods
  //
  //

	// conditionally render the components needed for the job's filtering system
	// basically a bunch of wrappers for stuff to happen later (jobs placement, filters population etc)
	// only renders the components needed according to the initial config/setup (like for a sidebar layout with template overrides, or something)
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

	renderMainComponent(custom_sel = null){

		//
		// template hierarchy
		//

		// set default static template
		var component_html = this.#main_template_static;
		if(this.params.active_counts || this.params.active_filters || this.params.active_search) component_html = this.#main_sidebar_template_static; // if options are set, reset html to sidebar template

		// if custom template override exists in dom, reset to that
		if (this.isElementValid(document.getElementById('main-template'))) component_html = document.getElementById('main-template').innerHTML;

		// if custom template override exists in dom with a specified ID, reset to that
		if(this.params.id && this.isElementValid(document.getElementById('main-template_'+this.params.id))) component_html = document.getElementById('main-template_'+this.params.id).innerHTML;

		//
		// component placement
		//

		// insert component_html into dom via ID
		// only if component_html has already been created/set above.
		if(component_html){

			var component_templateFn = FilterJS.templateBuilder(component_html);

			var component_sel = '#SomeDiv #SomeOtherDiv';
			if(this.params.id) component_sel = '#Feed_'+this.params.id;
			if(custom_sel) component_sel = custom_sel;

			// if the components wrapper element is actually valid in the dom
			// we place the newly created element, from the template, into the wrapper
			if(document.querySelector(component_sel) != null){
				document.querySelector(component_sel).innerHTML = '';
				let component_el = document.createRange().createContextualFragment(component_templateFn({id:this.params.id}));
				document.querySelector(component_sel).appendChild(component_el);
			}
		}

	}

	// render a component according to a template hierarchy
	// defaults to given static html
	// if custom template override exists in dom, using template_id like 'counts-template'
	// if custom template override exists in dom with a specified ID, using id like 'counts-template_454'
	renderStaticComponent(static_component = false, component_id = '', sel = null, custom_sel = null){

		//
		// template hierarchy
		//

		// set default static template
		var component_html = false;
		if(static_component) component_html = static_component;

		// if custom template override exists in dom, reset to that
		if (this.isElementValid(document.getElementById(component_id))) component_html = document.getElementById(component_id).innerHTML;

		// if custom template override exists in dom with a specified ID, reset to that
		if(this.isElementValid(document.getElementById(component_id+'_'+this.params.id))) component_html = document.getElementById(component_id+'_'+this.params.id).innerHTML;

		//
		// component placement
		//

		// insert component_html into dom via ID
		// only if component_html has already been created/set above.
		if(component_html){

			var component_templateFn = FilterJS.templateBuilder(component_html);
			var component_sel = '';

			var prime_sel = '#SomeParentDiv'; // phantom parent div
			if(this.params.id) prime_sel = '#Feed_'+this.params.id; // next default: parent div with ID Feed_23
			if(sel) component_sel = prime_sel + ' ' + sel;
			if(custom_sel) component_sel = custom_sel + ' ' + sel;

			// if the components wrapper element is actually valid in the dom
			// we place the newly created element, from the template, into the wrapper
			if(document.querySelector(component_sel) != null){
				document.querySelector(component_sel).innerHTML = '';
				let component_el = document.createRange().createContextualFragment(component_templateFn({id:this.params.id}));
				document.querySelector(component_sel).appendChild(component_el);
			}
		}

	}

	// render a (dynamic) component according to a template hierarchy
	// defaults to given static html
	// if custom template override exists in dom, using template_id like 'option-template'
	// if custom template override exists in dom with a specified ID, using id like 'option-template_454'
	renderDynamicComponent(data = null, static_component = false, component_id = '', sel = null, custom_sel = null, empty = true){

		//
		// template hierarchy
		//

		// set default static template
		var component_html = false;
		if(static_component) component_html = static_component;

		// if custom template override exists in dom, reset to that
		if (this.isElementValid(document.getElementById(component_id))) component_html = document.getElementById(component_id).innerHTML;

		// if custom template override exists in dom with a specified ID, reset to that
		if(this.isElementValid(document.getElementById(component_id+'_'+this.params.id))) component_html = document.getElementById(component_id+'_'+this.params.id).innerHTML;

		//
		// component placement
		//

		// insert component_html into dom via ID
		// only if component_html has already been created/set above.
		if(component_html){

			var component_templateFn = FilterJS.templateBuilder(component_html)
			var component_sel = '';

			var prime_sel = '#SomeParentDiv'; // phantom parent div
			if(this.params.id) prime_sel = '#Feed_'+this.params.id; // next default: parent div with ID Feed_23
			if(sel) component_sel = prime_sel + ' ' + sel;
			if(custom_sel) component_sel = custom_sel + ' ' + sel;

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

	// render method
	// renderErrorTemplate(sel) {

	// 	if (this.isElementValid(document.querySelector('#error-template'))) var html = $('#error-template').html();

	// 	if(Number.isInteger(this.params.id)){
	// 		var html_sel = '#error-template_'+this.params.id;
	// 		if(this.isElementValid(document.querySelector(html_sel))) var html = $(html_sel).html();
	// 	}

	// 	var templateFn = FilterJS.templateBuilder(html);
	// 	var container = $(sel);
	// 	container.empty().append(templateFn({}))

	// }

  //
  //
  // general methods
  //
  //

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

  //
  //
  // more general methods unused now but needed in setting up the jobs display
	// dont forget to put back in this to get these working as methods rather than functions
	// may need to use self as this in some cases
  //
  //
	updateCheckboxesCountsAndHideEmtpies(c, count, result, jQ, key) {

		if (result.length > 0) {
			jQ.records = result; // set querying from live jobs
			count = jQ.where({ [key]: c.val() }).count;
		}
	
		c.next().text(c.val() + '(' + count + ')');
	
		if (count == 0) c.parent('label').parent('.checkbox').hide();
		if (count > 0) c.parent('label').parent('.checkbox').show();
	
	}
	updateOptionsCountsAndHideEmtpies(c, count, result, jQ, key) {
	
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
	hidePagination() {
		var paginationItems = $("#pagination nav ul").children();
		if (paginationItems.length == 1) {
			$("#pagination").hide();
		} else {
			$("#pagination").show();
		}
	}
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
	setInitialCounts(length) {
		var total = $('#total_jobs_'+this.params.id); // get total
		total.text(length);
	}
	updateCountsLogic(result, jQ, initial_results, active_search, disable_cats, disable_cities, disable_jobtypes, disable_companies) {
	
		var total = $('#total_jobs_'+this.params.id); // get total
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