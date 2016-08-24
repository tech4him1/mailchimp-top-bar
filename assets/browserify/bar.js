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

        if ( ! isBottomBar ) {
            // move bar to top of body
            var firstBodyEl = document.body.firstChild;
            document.body.insertBefore(barEl.parentNode, firstBodyEl);
        }

        // remove "no_js" field
        var noJsField = barEl.querySelector('input[name="_mctb_no_js"]');
        noJsField.parentElement.removeChild(noJsField);

        // calculate real bar height
        var origBarPosition = barEl.style.position;
        barEl.style.display = 'block';
        barEl.style.position = 'relative';
        barHeight = barEl.clientHeight;

        // save original bodyPadding
        if( isBottomBar ) {
            wrapperEl.insertBefore( iconEl, barEl );
            originalBodyPadding = ( parseInt( document.body.style.paddingBottom )  || 0 );
        } else {
            barEl.appendChild( iconEl );
            originalBodyPadding = ( parseInt( document.body.style.paddingTop )  || 0 );
        }

        // get real bar height (if it were shown)
        bodyPadding = ( originalBodyPadding + barHeight ) + "px";

        // fade response 4 seconds after showing bar
        window.setTimeout(fadeResponse, 4000);

        // fix response height
        if( responseEl ) {
            responseEl.style.lineHeight = barHeight + "px";
        }

        // configure icon
        iconEl.setAttribute('class', 'mctb-close');
        iconEl.innerHTML = config.icons.show;
        iconEl.addEventListener('click', toggle);

        // hide bar again, we're done measuring
        formEl.style.display = 'none';
        barEl.style.position = origBarPosition;

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