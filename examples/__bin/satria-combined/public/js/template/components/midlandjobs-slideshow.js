/*! MJkit 2.26.4 | http://www.getmjkit.com | (c) 2014 YOOtheme | MIT License */
(function(addon) {

    var component;

    if (window.MJkit) {
        component = addon(MJkit);
    }

    if (typeof define == "function" && define.amd) {
        define("mjkit-slideshow", ["mjkit"], function() {
            return component || addon(MJkit);
        });
    }

})(function(UI) {

    "use strict";

    var Animations, playerId = 0;

    UI.component('slideshow', {

        defaults: {
            animation          : "fade",
            duration           : 500,
            height             : "auto",
            start              : 0,
            autoplay           : false,
            autoplayInterval   : 7000,
            videoautoplay      : true,
            videomute          : true,
            slices             : 15,
            pauseOnHover       : true,
            kenburns           : false,
            kenburnsanimations : [
                'midlandjobs-animation-middle-left',
                'midlandjobs-animation-top-right',
                'midlandjobs-animation-bottom-left',
                'midlandjobs-animation-top-center',
                '', // middle-center
                'midlandjobs-animation-bottom-right'
            ]
        },

        current  : false,
        interval : null,
        hovering : false,

        boot: function() {

            // init code
            UI.ready(function(context) {

                UI.$('[data-midlandjobs-slideshow]', context).each(function() {

                    var slideshow = UI.$(this);

                    if (!slideshow.data("slideshow")) {
                        UI.slideshow(slideshow, UI.Utils.options(slideshow.attr("data-midlandjobs-slideshow")));
                    }
                });
            });
        },

        init: function() {

            var $this = this, canvas, kbanimduration;

            this.container     = this.element.hasClass('midlandjobs-slideshow') ? this.element : UI.$(this.find('.midlandjobs-slideshow:first'));
            this.slides        = this.container.children();
            this.slidesCount   = this.slides.length;
            this.current       = this.options.start;
            this.animating     = false;
            this.triggers      = this.find('[data-midlandjobs-slideshow-item]');
            this.fixFullscreen = navigator.userAgent.match(/(iPad|iPhone|iPod)/g) && this.container.hasClass('midlandjobs-slideshow-fullscreen'); // viewport unit fix for height:100vh - should be fixed in iOS 8

            if (this.options.kenburns) {

                kbanimduration = this.options.kenburns === true ? '15s': this.options.kenburns;

                if (!String(kbanimduration).match(/(ms|s)$/)) {
                    kbanimduration += 'ms';
                }

                if (typeof(this.options.kenburnsanimations) == 'string') {
                    this.options.kenburnsanimations = this.options.kenburnsanimations.split(',');
                }
            }

            this.slides.each(function(index) {

                var slide = UI.$(this),
                    media = slide.children('img,video,iframe').eq(0);

                slide.data('media', media);
                slide.data('sizer', media);

                if (media.length) {

                    var placeholder;

                    switch(media[0].nodeName) {
                        case 'IMG':

                            var cover = UI.$('<div class="midlandjobs-cover-background midlandjobs-position-cover"></div>').css({'background-image':'url('+ media.attr('src') + ')'});

                            if (media.attr('width') && media.attr('height')) {
                                placeholder = UI.$('<canvas></canvas>').attr({width:media.attr('width'), height:media.attr('height')});
                                media.replaceWith(placeholder);
                                media = placeholder;
                                placeholder = undefined;
                            }

                            media.css({width: '100%',height: 'auto', opacity:0});
                            slide.prepend(cover).data('cover', cover);
                            break;

                        case 'IFRAME':

                            var src = media[0].src, iframeId = 'sw-'+(++playerId);

                            media
                                .attr('src', '').on('load', function(){

                                    if (index !== $this.current || (index == $this.current && !$this.options.videoautoplay)) {
                                        $this.pausemedia(media);
                                    }

                                    if ($this.options.videomute) {

                                        $this.mutemedia(media);

                                        var inv = setInterval((function(ic) {
                                            return function() {
                                                $this.mutemedia(media);
                                                if (++ic >= 4) clearInterval(inv);
                                            }
                                        })(0), 250);
                                    }

                                })
                                .data('slideshow', $this)  // add self-reference for the vimeo-ready listener
                                .attr('data-player-id', iframeId)  // add frameId for the vimeo-ready listener
                                .attr('src', [src, (src.indexOf('?') > -1 ? '&':'?'), 'enablejsapi=1&api=1&player_id='+iframeId].join(''))
                                .addClass('midlandjobs-position-absolute');

                            // disable pointer events
                            if(!UI.support.touch) media.css('pointer-events', 'none');

                            placeholder = true;

                            if (UI.cover) {
                                UI.cover(media);
                                media.attr('data-midlandjobs-cover', '{}');
                            }

                            break;

                        case 'VIDEO':
                            media.addClass('midlandjobs-cover-object midlandjobs-position-absolute');
                            placeholder = true;

                            if ($this.options.videomute) $this.mutemedia(media);
                    }

                    if (placeholder) {

                        canvas  = UI.$('<canvas></canvas>').attr({'width': media[0].width, 'height': media[0].height});
                        var img = UI.$('<img style="width:100%;height:auto;">').attr('src', canvas[0].toDataURL());

                        slide.prepend(img);
                        slide.data('sizer', img);
                    }

                } else {
                    slide.data('sizer', slide);
                }

                if ($this.hasKenBurns(slide)) {

                    slide.data('cover').css({
                        '-webkit-animation-duration': kbanimduration,
                        'animation-duration': kbanimduration
                    });
                }
            });

            this.on("click.midlandjobs.slideshow", '[data-midlandjobs-slideshow-item]', function(e) {

                e.preventDefault();

                var slide = UI.$(this).attr('data-midlandjobs-slideshow-item');

                if ($this.current == slide) return;

                switch(slide) {
                    case 'next':
                    case 'previous':
                        $this[slide=='next' ? 'next':'previous']();
                        break;
                    default:
                        $this.show(parseInt(slide, 10));
                }

                $this.stop();
            });

            // Set start slide
            this.slides.attr('aria-hidden', 'true').eq(this.current).addClass('midlandjobs-active').attr('aria-hidden', 'false');
            this.triggers.filter('[data-midlandjobs-slideshow-item="'+this.current+'"]').addClass('midlandjobs-active');

            UI.$win.on("resize load", UI.Utils.debounce(function() {
                $this.resize();

                if ($this.fixFullscreen) {
                    $this.container.css('height', window.innerHeight);
                    $this.slides.css('height', window.innerHeight);
                }
            }, 100));

            // chrome image load fix
            setTimeout(function(){
                $this.resize();
            }, 80);

            // Set autoplay
            if (this.options.autoplay) {
                this.start();
            }

            if (this.options.videoautoplay && this.slides.eq(this.current).data('media')) {
                this.playmedia(this.slides.eq(this.current).data('media'));
            }

            if (this.options.kenburns) {
                this.applyKenBurns(this.slides.eq(this.current));
            }

            this.container.on({
                mouseenter: function() { if ($this.options.pauseOnHover) $this.hovering = true;  },
                mouseleave: function() { $this.hovering = false; }
            });

            this.on('swipeRight swipeLeft', function(e) {
                $this[e.type=='swipeLeft' ? 'next' : 'previous']();
            });

            this.on('display.midlandjobs.check', function(){
                if ($this.element.is(":visible")) {

                    $this.resize();

                    if ($this.fixFullscreen) {
                        $this.container.css('height', window.innerHeight);
                        $this.slides.css('height', window.innerHeight);
                    }
                }
            });
        },


        resize: function() {

            if (this.container.hasClass('midlandjobs-slideshow-fullscreen')) return;

            var height = this.options.height;

            if (this.options.height === 'auto') {

                height = 0;

                this.slides.css('height', '').each(function() {
                    height = Math.max(height, UI.$(this).height());
                });
            }

            this.container.css('height', height);
            this.slides.css('height', height);
        },

        show: function(index, direction) {

            if (this.animating || this.current == index) return;

            this.animating = true;

            var $this        = this,
                current      = this.slides.eq(this.current),
                next         = this.slides.eq(index),
                dir          = direction ? direction : this.current < index ? 1 : -1,
                currentmedia = current.data('media'),
                animation    = Animations[this.options.animation] ? this.options.animation : 'fade',
                nextmedia    = next.data('media'),
                finalize     = function() {

                    if (!$this.animating) return;

                    if (currentmedia && currentmedia.is('video,iframe')) {
                        $this.pausemedia(currentmedia);
                    }

                    if (nextmedia && nextmedia.is('video,iframe')) {
                        $this.playmedia(nextmedia);
                    }

                    next.addClass("midlandjobs-active").attr('aria-hidden', 'false');
                    current.removeClass("midlandjobs-active").attr('aria-hidden', 'true');

                    $this.animating = false;
                    $this.current   = index;

                    UI.Utils.checkDisplay(next, '[class*="midlandjobs-animation-"]:not(.midlandjobs-cover-background.midlandjobs-position-cover)');

                    $this.trigger('show.midlandjobs.slideshow', [next, current, $this]);
                };

            $this.applyKenBurns(next);

            // animation fallback
            if (!UI.support.animation) {
                animation = 'none';
            }

            current = UI.$(current);
            next    = UI.$(next);

            $this.trigger('beforeshow.midlandjobs.slideshow', [next, current, $this]);

            Animations[animation].apply(this, [current, next, dir]).then(finalize);

            $this.triggers.removeClass('midlandjobs-active');
            $this.triggers.filter('[data-midlandjobs-slideshow-item="'+index+'"]').addClass('midlandjobs-active');
        },

        applyKenBurns: function(slide) {

            if (!this.hasKenBurns(slide)) {
                return;
            }

            var animations = this.options.kenburnsanimations,
                index      = this.kbindex || 0;


            slide.data('cover').attr('class', 'midlandjobs-cover-background midlandjobs-position-cover').width();
            slide.data('cover').addClass(['midlandjobs-animation-scale', 'midlandjobs-animation-reverse', animations[index].trim()].join(' '));

            this.kbindex = animations[index + 1] ? (index+1):0;
        },

        hasKenBurns: function(slide) {
            return (this.options.kenburns && slide.data('cover'));
        },

        next: function() {
            this.show(this.slides[this.current + 1] ? (this.current + 1) : 0, 1);
        },

        previous: function() {
            this.show(this.slides[this.current - 1] ? (this.current - 1) : (this.slides.length - 1), -1);
        },

        start: function() {

            this.stop();

            var $this = this;

            this.interval = setInterval(function() {
                if (!$this.hovering) $this.next();
            }, this.options.autoplayInterval);

        },

        stop: function() {
            if (this.interval) clearInterval(this.interval);
        },

        playmedia: function(media) {

            if (!(media && media[0])) return;

            switch(media[0].nodeName) {
                case 'VIDEO':

                    if (!this.options.videomute) {
                        media[0].muted = false;
                    }

                    media[0].play();
                    break;
                case 'IFRAME':

                    if (!this.options.videomute) {
                        media[0].contentWindow.postMessage('{ "event": "command", "func": "unmute", "method":"setVolume", "value":1}', '*');
                    }

                    media[0].contentWindow.postMessage('{ "event": "command", "func": "playVideo", "method":"play"}', '*');
                    break;
            }
        },

        pausemedia: function(media) {

            switch(media[0].nodeName) {
                case 'VIDEO':
                    media[0].pause();
                    break;
                case 'IFRAME':
                    media[0].contentWindow.postMessage('{ "event": "command", "func": "pauseVideo", "method":"pause"}', '*');
                    break;
            }
        },

        mutemedia: function(media) {

            switch(media[0].nodeName) {
                case 'VIDEO':
                    media[0].muted = true;
                    break;
                case 'IFRAME':
                    media[0].contentWindow.postMessage('{ "event": "command", "func": "mute", "method":"setVolume", "value":0}', '*');
                    break;
            }
        }
    });

    Animations = {

        'none': function() {

            var d = UI.$.Deferred();
            d.resolve();
            return d.promise();
        },

        'scroll': function(current, next, dir) {

            var d = UI.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1).one(UI.support.animation.end, function() {

                current.css('opacity', 0).removeClass(dir == -1 ? 'midlandjobs-slideshow-scroll-backward-out' : 'midlandjobs-slideshow-scroll-forward-out');
                next.removeClass(dir == -1 ? 'midlandjobs-slideshow-scroll-backward-in' : 'midlandjobs-slideshow-scroll-forward-in');
                d.resolve();

            }.bind(this));

            current.addClass(dir == -1 ? 'midlandjobs-slideshow-scroll-backward-out' : 'midlandjobs-slideshow-scroll-forward-out');
            next.addClass(dir == -1 ? 'midlandjobs-slideshow-scroll-backward-in' : 'midlandjobs-slideshow-scroll-forward-in');
            next.width(); // force redraw

            return d.promise();
        },

        'swipe': function(current, next, dir) {

            var d = UI.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1).one(UI.support.animation.end, function() {

                current.css('opacity', 0).removeClass(dir === -1 ? 'midlandjobs-slideshow-swipe-backward-out' : 'midlandjobs-slideshow-swipe-forward-out');
                next.removeClass(dir === -1 ? 'midlandjobs-slideshow-swipe-backward-in' : 'midlandjobs-slideshow-swipe-forward-in');
                d.resolve();

            }.bind(this));

            current.addClass(dir == -1 ? 'midlandjobs-slideshow-swipe-backward-out' : 'midlandjobs-slideshow-swipe-forward-out');
            next.addClass(dir == -1 ? 'midlandjobs-slideshow-swipe-backward-in' : 'midlandjobs-slideshow-swipe-forward-in');
            next.width(); // force redraw

            return d.promise();
        },

        'scale': function(current, next, dir) {

            var d = UI.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1);

            current.one(UI.support.animation.end, function() {

                current.css('opacity', 0).removeClass('midlandjobs-slideshow-scale-out');
                d.resolve();

            }.bind(this));

            current.addClass('midlandjobs-slideshow-scale-out');
            current.width(); // force redraw

            return d.promise();
        },

        'fade': function(current, next, dir) {

            var d = UI.$.Deferred();

            current.css('animation-duration', this.options.duration+'ms');
            next.css('animation-duration', this.options.duration+'ms');

            next.css('opacity', 1);

            // for plain text content slides - looks smoother
            if (!(next.data('cover') || next.data('placeholder'))) {

                next.css('opacity', 1).one(UI.support.animation.end, function() {
                    next.removeClass('midlandjobs-slideshow-fade-in');
                }).addClass('midlandjobs-slideshow-fade-in');
            }

            current.one(UI.support.animation.end, function() {

                current.css('opacity', 0).removeClass('midlandjobs-slideshow-fade-out');
                d.resolve();

            }.bind(this));

            current.addClass('midlandjobs-slideshow-fade-out');
            current.width(); // force redraw

            return d.promise();
        }
    };

    UI.slideshow.animations = Animations;

    // Listen for messages from the vimeo player
    window.addEventListener('message', function onMessageReceived(e) {

        var data = e.data, iframe;

        if (typeof(data) == 'string') {

            try {
                data = JSON.parse(data);
            } catch(err) {
                data = {};
            }
        }

        if (e.origin && e.origin.indexOf('vimeo') > -1 && data.event == 'ready' && data.player_id) {
            iframe = UI.$('[data-player-id="'+ data.player_id+'"]');

            if (iframe.length) {
                iframe.data('slideshow').mutemedia(iframe);
            }
        }
    }, false);

});
