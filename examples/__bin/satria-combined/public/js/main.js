//functions for loading scripts dynamically
const loadScript = (FILE_URL, async = true, type = "text/javascript") => {
  return new Promise((resolve, reject) => {
    try {
      const scriptEle = document.createElement("script");
      scriptEle.type = type;
      scriptEle.async = async;
      scriptEle.src = FILE_URL;

      scriptEle.addEventListener("load", (ev) => {
        resolve({ status: true });
      });

      scriptEle.addEventListener("error", (ev) => {
        reject({
          status: false,
          message: `Failed to load the script ${FILE_URL}`
        });
      });

      document.head.appendChild(scriptEle);
    } catch (error) {
      reject(error);
    }
  });
};
function loadJS(FILE_URL, async = true, footer = false) {

  // create script element
  let scriptEle = document.createElement('script');

  // set script element attributes
  scriptEle.setAttribute('src', FILE_URL);
  // if(async == 'async') scriptEle.setAttribute('async', '');
  // if(async == 'defer') scriptEle.setAttribute('defer', '');
  // scriptEle.setAttribute("async", async);
  scriptEle.setAttribute('type', 'text/javascript');

  // append the script element to either head or body
  if(footer){
    document.body.appendChild(scriptEle);
  } else {
    document.head.appendChild(scriptEle);
  }

  // success event, file loaded
  scriptEle.addEventListener("load", () => {
    // console.log("File loaded")
  });

  // error event, file didnt load
  scriptEle.addEventListener("error", (ev) => {
    console.log("Error on loading js file", ev);
  });

}
function loadCSS(FILE_URL) {
  let styleEle = document.createElement("link");

  styleEle.setAttribute("href", FILE_URL);
  styleEle.setAttribute("rel", "stylesheet");
  styleEle.setAttribute("type", "text/css");

  document.head.appendChild(styleEle);

  // success event 
  styleEle.addEventListener("load", () => {
    // console.log("File loaded")
  });
  // error event
  styleEle.addEventListener("error", (ev) => {
    console.log("Error on loading css file", ev);
  });
}
function _loadMyScript(src, onload) {
  let script = document.createElement('script');
  script.onload = onload ? onload : function(e) {
      // console.log(e.target.src + ' is loaded.');
    };
  script.src = src;
  script.defer = true;
  document.body.appendChild(script);
}

// 
// conditional loading of scripts according to page (meta og:url)
//
// public/js/feeds.js | https://cdn.jsdelivr.net/gh/midlandjobs/insite-feeds@master/public/js/feeds.js
// public/css/scoped.min.css | https://cdn.jsdelivr.net/gh/midlandjobs/insite-feeds@latest/public/css/scoped.min.css
//

// feed v3: simple
if (document.querySelector("meta[property='og:url']") && document.querySelector("meta[property='og:url']").getAttribute("content") === 'https://test.com/projects/jobboardfeed/') {
  loadScript('../midlandjobs/public/js/feeds.js', true)
  .then(data => {
    // console.log("The feeds script was loaded successfully", data);
    const DefaultFeed = new JobBoardFilteredFeed('#RoboticsDrivesJobs', 'https://test.com/feeds/manufacturing.xml', { scope: '.uk-scope' });
  })
  .catch(err => {
    console.error(console.error('feeds.js failed to load'));
  });
  loadCSS('../midlandjobs/public/css/scoped.min.css');
}

// feed v3: filters
if (document.querySelector("meta[property='og:url']") && document.querySelector("meta[property='og:url']").getAttribute("content") === 'https://test.com/projects/jobboardfeed/filters') {
  loadScript('../midlandjobs/public/js/feeds.js', true)
  .then(data => {
    // console.log("The feeds script was loaded successfully", data);
    const FeedWithFilters = new JobBoardFilteredFeed('#RoboticsDrivesJobs', 'https://test.com/feeds/manufacturing.xml', {
      active_filters: true, active_pagination: true, active_perpage: true, active_search: true, active_counts: true
    });
  })
  .catch(err => {
    console.error('feeds.js failed to load');
  });
  loadCSS('../midlandjobs/public/css/scoped.min.css');
}

// feed v3: filters controls
if (document.querySelector("meta[property='og:url']") && document.querySelector("meta[property='og:url']").getAttribute("content") === 'https://test.com/projects/jobboardfeed/filters-controls') {
  loadScript('../midlandjobs/public/js/feeds.js', true)
  .then(data => {
    // console.log("The feeds script was loaded successfully", data);
    const FeedWithFiltersAndControls = new JobBoardFilteredFeed('#RoboticsDrivesJobs', 'https://test.com/feeds/standard.xml', {
      active_filters: true, active_pagination: true, active_perpage: true, active_search: true, active_counts: true,
      disable_cats: ['Manufacturing'], disable_cities: false, disable_companies: false, disable_jobtypes: false,
      sorting: 'random'
    });
  })
  .catch(err => {
    console.error('feeds.js failed to load');
  });
  loadCSS('../midlandjobs/public/css/scoped.min.css');
}

// components custom template/s
if (document.querySelector("meta[property='og:url']") && document.querySelector("meta[property='og:url']").getAttribute("content") === 'https://test.com/projects/jobboardfeed/components') {

  // fonts for components
  loadCSS('https://fonts.googleapis.com/css?family=Montserrat:400,700');
  loadCSS('https://fonts.googleapis.com/css?family=Open+Sans:400,700,300');

  // load components (v2) CSS. scoped (midlandjobs-scope) & prefixed (midlandjobs-*, MJkit, mjkit)
  loadCSS('public/css/template/midlandjobs.css');
  loadCSS('public/css/template/midlandjobs-style.css');
  loadCSS('public/css/template/components/midlandjobs-slideshow.css');
  loadCSS('public/css/template/components/midlandjobs-dotnav.css');
  loadCSS('public/css/template/components/midlandjobs-tooltip.css');
  loadCSS('public/css/template/components/nez-icon.css');

  // load components (v2) js. scoped (midlandjobs-scope) & prefixed (midlandjobs-*, MJkit, mjkit). requires jquery
  loadScript('public/js/template/jquery.js', true)
  .then(data => {

    loadScript('public/js/template/midlandjobs.min.js', true)
    .then(data => {

      loadJS('public/js/template/components/midlandjobs-slideshow.js', true); // async
      loadJS('public/js/template/components/midlandjobs-slideshow-fx.js', true);
      loadJS('public/js/template/components/midlandjobs-parallax.js', true);
      loadJS('public/js/template/components/midlandjobs-sticky.js', true);
      loadJS('public/js/template/components/midlandjobs-slideset.js', true);
      loadJS('public/js/template/components/midlandjobs-tooltip.js', true);
  
      var themeApp = {
  
        theme_scrollUP: function () {
          $(document).scroll(function () {
            var toTop = $('.to-top');
            if ($(this).scrollTop() > 400) {
  
              toTop.fadeIn();
            } else {
              toTop.fadeOut();
            }
          });
        },
  
        //----------- 2. Progress Bar Jquery ----------- 
        theme_progressbar: function () {
          function progress(percent, element) {
            "use strict";
            var progressBarWidth = percent * element.width() / 100;
            element.find('div').animate({ width: progressBarWidth }, 2000).html("<div class='idz-progress-meter'>" + percent + "%&nbsp;</div>");
          }
  
          var bar = $('.idz-progress-bar');
  
          bar.each(function () {
            var bar = $(this);
            var percentage = $(this).attr('data-percent');
            progress(percentage, bar);
          });
        },
  
        //----------- 3. Circular Bar Jquery ----------- 
        theme_circularbar: function () {
  
          var cb = $('.idz-circular');
          var cbg = $('.idz-circular.green');
          var cbb = $('.idz-circular.blue');
          var cbo = $('.idz-circular.orange');
          var cbr = $('.idz-circular.red');
  
          cb.each(function () {
            cb.donutchart({ 'size': 150 });
            cb.donutchart("animate");
  
            cbg.donutchart({ 'size': 150, 'fgColor': '#9bc23c' });
            cbg.donutchart("animate");
  
            cbb.donutchart({ 'size': 150, 'fgColor': '#0090cf' });
            cbb.donutchart("animate");
  
            cbo.donutchart({ 'size': 150, 'fgColor': '#f07406' });
            cbo.donutchart("animate");
  
            cbr.donutchart({ 'size': 150, 'fgColor': '#e74b3b' });
            cbr.donutchart("animate");
          });
  
        },
  
      }
  
      themeApp.theme_scrollUP();
      themeApp.theme_progressbar();
      themeApp.theme_circularbar();
  
      // loadJS('public/js/template/components/config.js', false);

    })
    .catch(err => {
      console.error('uikit failed to load');
    });
  
  })
  .catch(err => {
    console.error('jquery failed to load');
  });

  // for including feeds & uikit js (v3) alongside v2. scoped (uk-scope)
  loadScript('../midlandjobs/public/js/feeds.js', true)
  .then(data => {
    // console.log("The feeds script was loaded successfully", data);
    const FeedWithFiltersAndControls = new JobBoardFilteredFeed('#RoboticsDrivesJobs', 'https://midlandjobs.ie/feeds/standard.xml', {
      active_filters: true, active_pagination: true, active_perpage: true, active_search: true, active_counts: true,
      disable_cats: ['Manufacturing'], disable_cities: false, disable_companies: false, disable_jobtypes: false,
      sorting: 'random'
    });
  })
  .catch(err => {
    console.error('feeds.js failed to load');
  });
  //unscoped styles (taken from midlandjobs)
  loadCSS('../midlandjobs/public/css/styles.css');
  loadCSS('../midlandjobs/public/css/bootstrap_styles.css');
  // scoped uikit styles
  loadCSS('../midlandjobs/public/css/scoped.min.css'); // for including feeds & uikit css (v3) alongside v2. scoped (uk-scope)
  loadCSS('public/css/custom.css'); // for including feeds & uikit css (v3) alongside v2. scoped (uk-scope)

}