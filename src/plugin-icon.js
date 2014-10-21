/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets */

define(function(require, exports, module) {
    var $icon = null;

    function init(fn) {
        $icon = $('<a href="#" id="swatcher-toolbar-icon"> </a>').attr('title', 'Swatcher').appendTo($('#main-toolbar .buttons'));

        $icon.on("click", function() {
            fn();
        });

    }

    function toggleActive() {
        if ($icon.hasClass('active')) {
            $icon.removeClass('active');
        } else {
            $icon.addClass('active');
        }
    }

    function forceActive() {
        reset();
        $icon.addClass('active');
    }

    function setOK() {
        reset();
        $icon.addClass('ok');
    }

    function setError() {
        reset();
        $icon.addClass('error');
    }

    function reset() {
        $icon.removeClass('ok');
        $icon.removeClass('error');
        $icon.removeClass('warning');
        $icon.removeClass('loading');
    }

    exports.init = init;
    exports.toggleActive = toggleActive;
    exports.setOK = setOK;
    exports.setError = setError;
    exports.forceActive = forceActive;

});