/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */
define(function (require, exports, module) {
    "use strict";
    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        hintHelper = require('../src/helpers/HintHelper'),
        codeHints = [];

    function SwatchHint() {}

    SwatchHint.prototype.init = function () {
        var hints = new SwatchHint();
        CodeHintManager.registerHintProvider(hints, ['less'], 0);
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

        hintHelper.registerChar(char);
        var filteredHints = hintHelper.filterHints(codeHints);

        return {
            hints: filteredHints,
            match: null,
            selectInitial: true,
            handleWideResults: false
        };
    };

    SwatchHint.prototype.hasHints = function (editor, char) {
        this.editor = editor;

        if (char === "@") {
            return 1;
        } else {
            hintHelper.reset();
            return false;
        }
    };

    SwatchHint.prototype.autoComplete = function (string) {

        var pos = string.lastIndexOf(">"),
            search = hintHelper.getSearchString();

        return string.substring(pos + 2).substring(search.length - 1);

    };

    SwatchHint.prototype.insertHint = function (hint) {
        var code = this.autoComplete(hint),
            currentDoc = DocumentManager.getCurrentDocument(),
            pos = this.editor.getCursorPos();

        hintHelper.reset();
        currentDoc.replaceRange(code, pos);
    };

    exports.register = SwatchHint.prototype.register;
    exports.reset = SwatchHint.prototype.reset;
    exports.init = SwatchHint.prototype.init;

});
