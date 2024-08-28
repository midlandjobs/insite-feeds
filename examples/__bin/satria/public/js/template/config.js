/* --------------------------------------------------------------------------
 * File        : config.js
 * Version     : 1.0
 * Author      : Indonez Team
 * Author URI  : http://indonez.com
 *
 * Indonez Copyright 2015 All Rights Reserved.
 * -------------------------------------------------------------------------- */

/* --------------------------------------------------------------------------
 * javascript handle initialization
    1. To top Jquery
	2. Progress Bar Jquery
	3. Circular Bar Jquery
	4. Homepage Slider
	5. Blog Slider
	6. Mediaelement
	7. Flickr Feed
 *
 * -------------------------------------------------------------------------- */
 
(function($) {

    "use strict";

    var themeApp = {

            //----------- 1. To top Jquery ----------- 

            //---------- 5. Blog Slider -----------
            theme_slideshow2: function() {
                var slideshow = UIkit.slideshow($('.blog-slider'), {
                    height: "auto",
                    autoplay: true,
                });
            },

            //---------- 6. Mediaelement  -----------
            theme_media: function() {
                var media = $('audio, video');

                // media.mediaelementplayer();
            },

            //---------- 7. Flickr Feed  -----------
            theme_flickrfeed: function() {
                var thumb = $('#flck-thumb');

                thumb.jflickrfeed({
                    limit: 9,
                    qstrings: { id: '52617155@N08' },
                    itemTemplate: '<div>' + '<a href="{{image}}" data-uk-lightbox="{{group:samplepic}}" title="{{title}}">' + '<img src="{{image_s}}" alt="{{title}}" />' + '</a>' + '</div>'
                });
            }, 

            // theme init
            theme_init: function() {
                themeApp.theme_scrollUP();
                themeApp.theme_progressbar();
                themeApp.theme_circularbar();
                themeApp.theme_slideshow1();
                themeApp.theme_slideshow2();
                themeApp.theme_media();
                themeApp.theme_flickrfeed();
            }

        } //end themeApp


    jQuery(document).ready(function($) {

        themeApp.theme_init();

    });

})(jQuery);