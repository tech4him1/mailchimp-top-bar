'use strict';

var cookies = require('./cookies.js');
var animator = require('./animator.js');

function throttle(fn, threshhold, scope) {
    threshhold || (threshhold = 250);
    var last,
        deferTimer;
    return function () {
        var context = scope || this;

        var now = +new Date,
            args = arguments;
        if (last && now < last + threshhold) {
            // hold on to it
            clearTimeout(deferTimer);
            deferTimer = setTimeout(function () {
                last = now;
                fn.apply(context, args);
            }, threshhold);
        } else {
            last = now;
            fn.apply(context, args);
        }
    };
}

function Bar( wrapperEl, config ) {

    // Vars & State
    var barEl = wrapperEl.querySelector('.mctb-bar');
    var iconEl = document.createElement('span');
    var responseEl = wrapperEl.querySelector('.mctb-response');
    var visible = false,
        originalBodyPadding = 0,
        barHeight = 0,
        bodyPadding = 0,
        isBottomBar = ( config.position === 'bottom' );


    // Functions
    function init() {

        // remove "no_js" field
        var noJsField = barEl.querySelector('input[name="_mctb_no_js"]');
        noJsField.parentElement.removeChild(noJsField);

        // save original bodyPadding
        if( isBottomBar ) {
            wrapperEl.insertBefore( iconEl, barEl );
            originalBodyPadding = ( parseInt( document.body.style.paddingBottom )  || 0 );
        } else {
            wrapperEl.insertBefore( iconEl, barEl.nextElementSibling );
            originalBodyPadding = ( parseInt( document.body.style.paddingTop )  || 0 );
        }

        // fix response height
        if( responseEl ) {
            responseEl.style.lineHeight = barHeight + "px";
        }

        // configure icon
        iconEl.setAttribute('class', 'mctb-close');
        iconEl.innerHTML = config.icons.show;
        iconEl.addEventListener('click', toggle);

        // make sure bar is visible
        var origBarPosition = barEl.style.position;
        var origBarDisplay = barEl.style.display;
        barEl.style.display = 'block';
        barEl.style.position = 'relative';

        calculateDimensions();

        // reset bar again, we're done measuring
        barEl.style.display = origBarDisplay;
        barEl.style.position = origBarPosition;

        // Show the bar straight away?
        if( cookies.read( "mctb_bar_hidden" ) != 1 ) {
            show()
        }

        // fade response 4 seconds after showing bar
        window.setTimeout(fadeResponse, 4000);
        window.addEventListener('resize', throttle(function(){
            calculateDimensions();
            // reset body padding when visible.
            if (visible) {
                document.body.style[isBottomBar ? 'paddingBottom' : 'paddingTop'] = bodyPadding;
            }
        }));
    }

    function calculateDimensions() {
        // calculate real bar height
        barHeight = barEl.clientHeight;

        // get real bar height (if it were shown)
        bodyPadding = ( originalBodyPadding + barHeight ) + "px";

        // would the close icon fit inside the bar?
        var elementsWidth = 0;
        for( var i=0; i<barEl.firstElementChild.children.length; i++ ) {
            elementsWidth+= barEl.firstElementChild.children[i].clientWidth;
        }

        wrapperEl.className = wrapperEl.className.replace('mctb-icon-inside-bar', '');
        if( elementsWidth + iconEl.clientWidth + 200 < barEl.clientWidth ) {
            wrapperEl.className += ' mctb-icon-inside-bar';

            // since icon is now absolutely positioned, we need to set a min height
            if( isBottomBar ) {
                wrapperEl.style.minHeight = iconEl.clientHeight + "px";
            }
        }
    }

    /**
     * Show the bar
     *
     * @returns {boolean}
     */
    function show( manual ) {

        if( visible ) {
            return false;
        }
        
        if( manual ) {
            cookies.erase( 'mctb_bar_hidden' );
            animator.toggle(barEl, "slide", function(){
                calculateDimensions();
                // reset body padding
                document.body.style[isBottomBar ? 'paddingBottom' : 'paddingTop'] = bodyPadding;
            }); // callback will recaculate heights in case window has been resized

            // animate body padding
            var styles = {};
            styles[isBottomBar ? 'paddingBottom' : 'paddingTop'] = bodyPadding;
            animator.animate(document.body, styles);
        } else {
            // Add bar height to <body> padding
            barEl.style.display = 'block';
            document.body.style[isBottomBar ? 'paddingBottom' : 'paddingTop'] = bodyPadding;
        }

        iconEl.innerHTML = config.icons.hide;
        visible = true;

        return true;
    }

    /**
     * Hide the bar
     *
     * @returns {boolean}
     */
    function hide(manual) {
        if( ! visible ) {
            return false;
        }

        if( manual ) {
            cookies.create( "mctb_bar_hidden", 1, config.cookieLength );
            animator.toggle(barEl, "slide");

            // animate body padding
            var styles = {};
            styles[isBottomBar ? 'paddingBottom' : 'paddingTop'] = originalBodyPadding;
            animator.animate(document.body, styles);
        } else {
            barEl.style.display = 'none';
            document.body.style[isBottomBar ? 'paddingBottom' : 'paddingTop'] = originalBodyPadding + "px";
        }

        visible = false;
        iconEl.innerHTML = config.icons.show;

        return true;
    }

    /**
     * Fade out the response message
     */
    function fadeResponse() {
        if( responseEl ) {

            animator.toggle(responseEl, "fade");

            // auto-dismiss bar if we're good!
            if( config.is_submitted && config.is_success ) {
                window.setTimeout( function() { hide(true); }, 1000 );
            }
        }
    }

    /**
     * Toggle visibility of the bar
     *
     * @returns {boolean}
     */
    function toggle() {
        if(animator.animated(barEl)) {
            return false;
        }

        return visible ? hide(true) : show(true);
    }

    // Code to run upon object instantiation
    init();

    // Return values
    return {
        element: wrapperEl,
        toggle: toggle,
        show: show,
        hide: hide
    }
}

module.exports = Bar;