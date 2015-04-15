/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets */

define(function(require, exports, module) {
    var Modes = require('../modes'),
        StringUtils = brackets.getModule("utils/StringUtils"),
        AssetPathClass = require('src/dialogs/AssetDialog');
        var AssetPath = AssetPathClass.getInstance();

    function Swatches(editor) {
        this.panelData = [];
        this.styleHead = [];
        this.styles = {};
        this.mode = false;
        this.codeHints = [];
        this.init(editor);
    }

    Swatches.prototype = {
        init: function(editor) {
            this.mode = editor.document.language._mode;

            var found, entity, styleName, styleVal, htmlID,
                documentText = editor.document.getText(),
                documentLines = StringUtils.getLines(documentText),
                mode = Modes.getMode(this.mode),
                firstLine = /^\/\/swatcher-assets+\s*:\s*('|")([0-9a-z\-_%\/\.\(\)\s]+)('|")/.exec(documentLines[0]);
                
                if (firstLine !== null) {
                    AssetPath.setPath(firstLine[2], editor.document);
                }

                var path = AssetPath.getPath(editor.document);

            while ((found = mode.regexVariables.exec(documentText)) !== null) {

                entity = found[0].split(/:(.+)?/, 2);
                styleName = $.trim(entity[0]);
                styleVal = $.trim(entity[1]);
                htmlID = 'SW_' + styleName.substring(1);

                if (typeof found[2] !== 'undefined') {
                    styleVal = "'" + $.trim(found[2]) + "'";
                    found[0] = styleName + ":" + styleVal;
                }

                if (styleVal.search(mode.regexOnlyColors) > -1 || styleVal.indexOf('data') === 1) {
                    continue;
                }

                if (styleVal[0] === mode.trigger && typeof(this.styles[styleVal]) === "undefined") {
                    continue;

                } else if (typeof(this.styles[styleVal]) !== "undefined") {
                    this.styleHead.push($.trim(found[0]) + ";");
                    this.styles[styleName] = this.styles[styleVal];

                } else if (styleVal[0] === "'") {
                    this.styleHead.push($.trim(found[0]) + ";");
                    this.styles[styleName] = "{ background-image: url(" + path + styleVal.replace(/'/g, "") + ");}";

                } else {
                    this.styleHead.push($.trim(found[0]) + ";");
                    this.styles[styleName] = '{ background:' + styleVal + '; }';
                }

                this.codeHints.push('<div id="' + htmlID + '" class="swatcher-swatch-hints swatcher-color"></div>' + styleName);

                this.panelData.push({
                    style: styleVal,
                    line: StringUtils.offsetToLineNum(documentLines, found.index),
                    variable: styleName,
                    htmlID: htmlID
                });
            }
        },

        getHTML: function() {
            return {
                swatches: this.panelData
            };
        },

        getCSS: function() {
            var key, str = '';
            for (key in this.styles) {
                if (this.styles.hasOwnProperty(key)) {
                    str += '#SW_' + key.substring(1) + ".swatcher-color" + this.styles[key];
                }
            }
            return this.styleHead.join('') + str;
        },

        getCodeHints: function() {
            return this.codeHints;
        }
    };

    return Swatches;

});
