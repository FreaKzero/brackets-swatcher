/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define, Mustache */
define(function (require, exports, module) {
    "use strict";

    var searchString = "";

    function hintHelper() {}

    hintHelper.prototype.getSearchString = function () {
        return searchString;
    };

    hintHelper.prototype.reset = function () {
        searchString = "";
    };

    hintHelper.prototype.registerChar = function (char) {
        if (char === null) {
            if (searchString.length > 0) {
                searchString = searchString.slice(0, -1);
            }

            if (searchString === "@") {
                this.reset();
            }

        } else {
            searchString += char;
        }
    };

    hintHelper.prototype.filterHints = function (array) {
        var filtered = array.filter(function (v) {
            if (v.indexOf(searchString) > -1) {
                return v;
            }
        });

        if (searchString[0] == "@") {
            if (filtered.length > 0) {
                return filtered;
            } else {
                this.reset();
                return null;
            }
        }
    };

    exports.registerChar = hintHelper.prototype.registerChar;
    exports.reset = hintHelper.prototype.reset;
    exports.filterHints = hintHelper.prototype.filterHints;
    exports.getSearchString = hintHelper.prototype.getSearchString;
});
