/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define, Mustache */

define(function(require, exports, module) {
    "use strict";
    var modes = {
        'text/x-less': {
            mode: 'text/x-less',
            hints: ['less'],
            trigger: '@',
            regexVariables: /^@[0-9a-z\-_]+\s*:\s*(url\('([^']+)'\)|[0-9a-z\-_@#%'"*\/\.\(\)\,\+\s]+)/igm,
            regexOnlyColors: /(ceil|floor|percentage|round|sqrt|abs|sin|asin|cos|acos|tan|atan|pi|pow|mod|min|max|length|extract|escape|e)(\()|(^[0-9.]+)|(.*\s(\+|\-|\*)\s.*)|(inherit|normal|bold|italic|\")/g,
        },

        'text/x-scss': {
            mode: 'text/x-scss',
            hints: ['scss'],
            trigger: '$',
            regexVariables: /^\$[0-9a-z\-_]+\s*:\s*(url\('([^']+)'\)|[0-9a-z\-_\$#%'"*\/\.\(\)\,\+\s]+)/igm,
            regexOnlyColors: /(\(.*|str-|map-|selector-|unquote|quote|to-upper-case|to-lower-case|percentage|round|ceil|floor|abs|min|max|random|length|nth|join|append|zip|index|list-seperator|keywords|is-superselector|simple-selectors|feature-exists|variable-exists|global-variable-exists|function-exists|mixin-exists|inspect|type-of|unit|unitless|comparable|call|unique-id)|(^[0-9.]+)|(.*\s(\+|\-|\*)\s.*)|(inherit|normal|bold|italic|\")/g,
        },

        'sass': {
            mode: 'sass',
            hints: ['sass'],
            trigger: '$',
            regexVariables: /^\$[0-9a-z\-_]+\s*:\s*(url\('([^']+)'\)|[0-9a-z\-_\$#%'"*\/\.\(\)\,\+\s]+)/igm,
            regexOnlyColors: /(\(.*|str-|map-|selector-|unquote|quote|to-upper-case|to-lower-case|percentage|round|ceil|floor|abs|min|max|random|length|nth|join|append|zip|index|list-seperator|keywords|is-superselector|simple-selectors|feature-exists|variable-exists|global-variable-exists|function-exists|mixin-exists|inspect|type-of|unit|unitless|comparable|call|unique-id)|(^[0-9.]+)|(.*\s(\+|\-|\*)\s.*)|(inherit|normal|bold|italic|\")/g,
        }
    };

    function getMode(mode) {
        if (typeof modes[mode] === "undefined") {
            return false;
        }

        return modes[mode];
    }
    
    function hasPreprocessor(editor) {
        var m = Object.keys(modes);
        var mode = editor.document.language._mode;

        if (m.indexOf(mode) >= 0) {
            return 1;
        }

        return false;
    }

    exports.hasPreprocessor = hasPreprocessor;
    exports.getMode = getMode;

});
