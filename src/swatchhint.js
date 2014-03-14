/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */
define(function (require, exports, module) {
    "use strict";
    var CodeHintManager = brackets.getModule("editor/CodeHintManager"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        codeHints = [];

    function SwatchHint() {}

    SwatchHint.prototype.init = function () {
        var hints = new SwatchHint();
        CodeHintManager.registerHintProvider(hints, ["css", "less"], 0);
    };

    SwatchHint.prototype.reset = function () {
        codeHints = [];
    };

    SwatchHint.prototype.register = function (lessVar, htmlID) {
        codeHints.push(
            '<div id="' + htmlID + '" class="swatcher-swatch-hints swatcher-color"></div>' + lessVar
        );
    };

    SwatchHint.prototype.getHints = function (trigger) {
        if (trigger !== "@") {
            return null;
        }

        return {
            hints: codeHints,
            match: null,
            selectInitial: true,
            handleWideResults: false
        };
    };

    SwatchHint.prototype.hasHints = function (editor, trigger) {
        this.editor = editor;

        return trigger ? trigger === "@" : false;

    };

    SwatchHint.prototype.getColorFromString = function (string) {

        var pos = string.lastIndexOf(">");
        return string.substring(pos + 2);

    };

    SwatchHint.prototype.insertHint = function (hint) {
        var code = this.getColorFromString(hint),
            currentDoc = DocumentManager.getCurrentDocument(),
            pos = this.editor.getCursorPos();

        currentDoc.replaceRange(code, pos);

    };

    exports.register = SwatchHint.prototype.register;
    exports.reset = SwatchHint.prototype.reset;
    exports.init = SwatchHint.prototype.init;

});
