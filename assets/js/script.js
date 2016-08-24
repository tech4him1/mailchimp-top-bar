(function () { var require = undefined; var module = undefined; var exports = undefined; var define = undefined;(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var duration = 320;

function css(element, styles) {
    for(var property in styles) {
        element.style[property] = styles[property];
    }
}

function initObjectProperties(properties, value) {
    var newObject = {};
    for(var i=0; i<properties.length; i++) {
        newObject[properties[i]] = value;
    }
    return newObject;
}

function copyObjectProperties(properties, object) {
    var newObject = {}
    for(var i=0; i<properties.length; i++) {
        newObject[properties[i]] = object[properties[i]];
    }
    return newObject;
}

/**
 * Checks if the given element is currently being animated.
 *
 * @param element
 * @returns {boolean}
 */
function animated(element) {
    return !! element.getAttribute('data-animated');
}

/**
 * Toggles the element using the given animation.
 *
 * @param element
 * @param animation Either "fade" or "slide"
 */
function toggle(element, animation) {
    var nowVisible = element.style.display != 'none' || element.offsetLeft > 0;

    // create clone for reference
    var clone = element.cloneNode(true);
    var cleanup = function() {
        element.removeAttribute('data-animated');
        element.setAttribute('style', clone.getAttribute('style'));
        element.style.display = nowVisible ? 'none' : '';
    };

    // store attribute so everyone knows we're animating this element
    element.setAttribute('data-animated', "true");

    // toggle element visiblity right away if we're making something visible
    if( ! nowVisible ) {
        element.style.display = '';
    }

    var hiddenStyles, visibleStyles;

    // animate properties
    if( animation === 'slide' ) {
        hiddenStyles = initObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], 0);
        visibleStyles = {};

        if( ! nowVisible ) {
            var computedStyles = window.getComputedStyle(element);
            visibleStyles = copyObjectProperties(["height", "borderTopWidth", "borderBottomWidth", "paddingTop", "paddingBottom"], computedStyles);
            css(element, hiddenStyles);
        }

        // don't show a scrollbar during animation
        element.style.overflowY = 'hidden';
        animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
    } else {
        hiddenStyles = { opacity: 0 };
        visibleStyles = { opacity: 1 };
        if( ! nowVisible ) {
            css(element, hiddenStyles);
        }

        animate(element, nowVisible ? hiddenStyles : visibleStyles, cleanup);
    }
}

function animate(element, targetStyles, fn) {
    var last = +new Date();
    var initialStyles = window.getComputedStyle(element);
    var currentStyles = {};
    var propSteps = {};

    for(var property in targetStyles) {
        // make sure we have an object filled with floats
        targetStyles[property] = parseFloat(targetStyles[property]);

        // calculate step size & current value
        var to = targetStyles[property];
        var current = parseFloat(initialStyles[property]);

        // is there something to do?
        if( current == to ) {
            delete targetStyles[property];
            continue;
        }

        propSteps[property] = ( to - current ) / duration; // points per second
        currentStyles[property] = current;
    }

    var tick = function() {
        var now = +new Date();
        var timeSinceLastTick = now - last;
        var done = true;

        var step, to, increment, newValue;
        for(var property in targetStyles ) {
            step = propSteps[property];
            to = targetStyles[property];
            increment =  step * timeSinceLastTick;
            newValue = currentStyles[property] + increment;

            if( step > 0 && newValue >= to || step < 0 && newValue <= to ) {
                newValue = to;
            } else {
                done = false;
            }

            // store new value
            currentStyles[property] = newValue;

            var suffix = property !== "opacity" ? "px" : "";
            element.style[property] = newValue + suffix;
        }

        last = +new Date();

        // keep going until we're done for all props
        if(!done) {
            (window.requestAnimationFrame && requestAnimationFrame(tick)) || setTimeout(tick, 32);
        } else {
            // call callback
            fn && fn();
        }
    };

    tick();
}


module.exports = {
    'toggle': toggle,
    'animate': animate,
    'animated': animated
};
},{}],2:[function(require,module,exports){
'use strict';

var cookies = require('./cookies.js');
var animator = require('./animator.js');

function Bar( wrapperEl, config ) {

    // Vars & State
    var barEl = wrapperEl.querySelector('.mctb-bar');
    var formEl = barEl.querySelector('form');
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

        if ( ! isBottomBar ) {
            // move bar to top of body
            var firstBodyEl = document.body.firstChild;
            document.body.insertBefore(barEl.parentNode, firstBodyEl);
        }
        
        // fade response 4 seconds after showing bar
        window.setTimeout(fadeResponse, 4000);

        // configure icon
        if( isBottomBar ) {
            wrapperEl.insertBefore( iconEl, barEl );
        } else {
            barEl.appendChild( iconEl );
        }
        iconEl.setAttribute('class', 'mctb-close');
        iconEl.innerHTML = config.icons.show;
        iconEl.addEventListener('click', toggle);

        // Show the bar straight away?
        if( cookies.read( "mctb_bar_hidden" ) != 1 ) {
            show()
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
            animator.toggle(formEl, "slide");
        } else {
            formEl.style.display = ''; // take away display: none;
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
            animator.toggle(formEl, "slide");
        } else {
            formEl.style.display = 'none';
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
},{"./animator.js":1,"./cookies.js":3}],3:[function(require,module,exports){
'use strict';

/**
 * Creates a cookie
 *
 * @param name
 * @param value
 * @param days
 */
function create(name, value, days) {
    var expires;

    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    } else {
        expires = "";
    }
    document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expires + "; path=/";
}

/**
 * Reads a cookie
 *
 * @param name
 * @returns {*}
 */
function read(name) {
    var nameEQ = encodeURIComponent(name) + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
    }
    return null;
}

/**
 * Erases a cookie
 *
 * @param name
 */
function erase(name) {
    create(name, "", -1);
}

module.exports = {
    'read': read,
    'create': create,
    'erase': erase
};
},{}],4:[function(require,module,exports){
'use strict';

var Bar = require('./bar.js');

// Init bar
ready(function() {
    var element = document.getElementById('mailchimp-top-bar');
    window.MailChimpTopBar = new Bar( element, window.mctb );
});

/**
 * DOMContentLoaded (IE8 compatible)
 *
 * @param fn
 */
function ready(fn) {
    if (document.readyState != 'loading'){
        fn();
    } else if (document.addEventListener) {
        document.addEventListener('DOMContentLoaded', fn);
    }
}



},{"./bar.js":2}]},{},[4]);
; })();