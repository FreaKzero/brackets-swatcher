/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */
define(function (require, exports, module) {
    "use strict";
    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        codeHints = [],
        codeStr = "";

    function SwatchHint() {}

    SwatchHint.prototype.init = function () {
        var hints = new SwatchHint();
        CodeHintManager.registerHintProvider(hints, ["css", "less"], 0);
    };

    SwatchHint.prototype.queryHints = function (query) {
        var filtered = codeHints.filter(function (v) {
            if (v.indexOf(query) > -1) {
                return v;
            }
        });

        if (query[0] == "@") {
            if (filtered.length > 0) {
                return filtered;
            } else {
                codeStr = "";
                return null;
            }
        }
    };

    SwatchHint.prototype.reset = function () {
        codeHints = [];
    };

    SwatchHint.prototype.register = function (lessVar, htmlID) {
        codeHints.push(
            '<div id="' + htmlID + '" class="swatcher-swatch-hints swatcher-color"></div>' + lessVar
        );
    };

    SwatchHint.prototype.getHints = function (char) {
        if (char === null) {
            codeStr = codeStr.slice(0, -1);
        } else {
            codeStr += char;
        }

        var filteredHints = this.queryHints(codeStr);

        return {
            hints: filteredHints,
            match: null,
            selectInitial: true,
            handleWideResults: false
        };
    };

    SwatchHint.prototype.hasHints = function (editor, char) {
        this.editor = editor;

        return char ? char === "@" : false;

    };

    SwatchHint.prototype.autoComplete = function (string) {

        var pos = string.lastIndexOf(">");
        return string.substring(pos + 2).substring(codeStr.length - 1);

    };

    SwatchHint.prototype.insertHint = function (hint) {
        var code = this.autoComplete(hint),
            currentDoc = DocumentManager.getCurrentDocument(),
            pos = this.editor.getCursorPos();
        codeStr = "";
        currentDoc.replaceRange(code, pos);
    };

    exports.register = SwatchHint.prototype.register;
    exports.reset = SwatchHint.prototype.reset;
    exports.init = SwatchHint.prototype.init;

});
