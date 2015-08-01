/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */

define(function(require, exports, module) {
    "use strict";
    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        Modes = require('../modes'),
        mode,
        codeHints = [];
        
    var Filter = {
        search: "",
                
        typing: function(char) {
            if (char === null) {
                if (this.search.length > 0) {
                    this.search = this.search.slice(0, -1);
                }

                if (this.search === mode.trigger) {
                    this.search = "";
                    return [];
                }

            } else {
                this.search += char;
            }
        },

        getHints: function(array) {
            var that = this;
            var filtered = array.filter(function(v) {
                if (v.indexOf(that.search) > -1) {
                    return v;
                }
            });

            if (this.search[0] == mode.trigger) {
                if (filtered.length > 0) {
                    return filtered;
                } else {
                    that.search = "";
                    return [];
                }
            }
        }
    };

    function SwatchHint() {}

    SwatchHint.prototype.init = function(m) {
        var hints = new SwatchHint();
        mode = Modes.getMode(m); 
        CodeHintManager.registerHintProvider(hints, mode.hints, 0);
    };

    SwatchHint.prototype.getHints = function(char) {

        Filter.typing(char);        
        return {
            hints: Filter.getHints(codeHints),
            match: null,
            selectInitial: true,
            handleWideResults: false
        };
    };

    SwatchHint.prototype.setHints = function(array) {
        codeHints = array;
    };

    SwatchHint.prototype.hasHints = function(editor, char) {
        this.editor = editor;

        if (char === mode.trigger) {
            return 1;
        } else {
            Filter.search = "";
            return false;
        }
    };

    SwatchHint.prototype.autoComplete = function(string) {
        var pos = string.lastIndexOf(">");   
        return string.substring(pos + 2).substring(Filter.search.length - 1);
    };

    SwatchHint.prototype.insertHint = function(hint) {
        var code = this.autoComplete(hint),
            pos = this.editor.getCursorPos();

        Filter.search = "";
        this.editor.document.replaceRange(code, pos);
    };

    exports.setHints = SwatchHint.prototype.setHints;
    exports.init = SwatchHint.prototype.init;

});
