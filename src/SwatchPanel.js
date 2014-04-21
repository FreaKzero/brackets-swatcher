/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets */

define(function(require, exports, module) {
    var PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        DefaultPreferences = require("../cfg/DefaultPreferences"),
        preferences = PreferencesManager.getPreferenceStorage(module, DefaultPreferences),

        StringUtils = brackets.getModule("utils/StringUtils"),
        Utils = require("./Utils"),
        SwatchHints = require('./SwatchHints'),
        messages = require('./Messages'),

        MainView = require("text!html/MainView.html"),

        swatchesCSS,
        $icon;

    function joinStyles(obj) {
        var key, str = '';
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str += '#SW_' + key.substring(1) + ".swatcher-color" + obj[key] + "\n";
            }
        }
        return str;
    }

    /*
        Process Filtered LESS String from swatchesFromLess() via less.Parser
    */
    function parseLess(styleHead, styles) {

        var lessString = joinStyles(styles) + styleHead.join('');

        $icon.removeClass('error');
        swatchesCSS = null;
        var lp = new(less.Parser);

        lp.parse(lessString, function(err, tree) {
            try {
                swatchesCSS = tree.toCSS();
            } catch (error) {
                $icon.removeClass('ok').addClass('error');
                messages.panel('MAIN_LESSERROR', 'errorMessage', error.message);
            }
        });

        if (!$icon.hasClass('ok')) {
            $icon.addClass('ok');
            $('#swatcher-trackLESS').text('Stop Tracking').addClass('swatcher-stoptrack');
        }

        return swatchesCSS;
    }

    /*
        Check string against the Blacklist defined in the Settings Panel        
    */
    function checkBlacklist(string) {

        if (preferences.getValue('blacklist') === '') {
            return -1;
        }

        var regex = "(" + preferences.getValue('blacklist').replace(/,/g, "|") + ")",
            blacklist = new RegExp(regex, "g");

        return string.toLowerCase().search(blacklist);
    }

    /*                        
        1.) Filter only @variable definitions
        2.) Concat filtered @variables in a String
        3.) Sorting out Math functions, Strings starting with numbers, strings with math operators, and HTML width/height entities
        4.) Check the Rest against a User setable Blacklist
        5.) With the Rest: Generate new LESS for Swatches with generated IDs (using Variable Name)
        6.) With the Rest: Push needed Template Data for Mustache
        7.) Send the generated LESS File (styleHead and styleBody) for parsing to parseLess()

            Filters     LESS Data from current active Document for Swatcher Backgrounds
            found:      Actual found line (via regexVariables)
            lessName:   Trimmed LESS variable declarion of current Line (via found)
            lessVal:    Trimmed LESS definition of current Line (via found)
            img:        Will be filled if first Char of lessval is an singlequote otherwise none
            htmlID:     Generated HTML ID taken from lessName for Swatches
            Selector:   CSS Selectorstring for filtered Swatches
            styleHead:  Contains ALL Variable definitions from file (for parsing LESS)
            styleBody:  Contains only dynamic generated LESS for the Swatches
            panelData:  Data Array for Mustache

            regexVariables:     see found
            regexBackgrounds:   Main Regex to filter only Background definitions


            TODO:
            rename BG Mixin
            refactor BG Mixin (use as extend)
            replace BG Mixin with "" at Styles register
                
    */
    function swatchesFromLess(currentDocument) {
        if (currentDocument !== null && typeof(currentDocument) !== 'string') {

            var found, entity, img, htmlID, lessName, lessVal,
                styleHead = [],
                panelData = [],
                styles = {},
                documentText = currentDocument.getText(),
                documentLines = StringUtils.getLines(documentText),
                regexVariables = /^@[0-9a-z\-_]+\s*:\s*([0-9a-z\-_@#%'"*\/\.\(\)\,\+\s]+)/igm,
                regexBackgrounds = /(ceil|floor|percentage|round|sqrt|abs|sin|asin|cos|acos|tan|atan|pi|pow|mod|min|max|length|extract|escape|e)(\()|(^[0-9.]+)|(.*\s(\+|\-|\*)\s.*)|(inherit|normal|bold|italic|\")/g;

            // Reset CodeHints
            SwatchHints.reset();

            while ((found = regexVariables.exec(documentText)) !== null) {

                // get lessName (@variable) and the definition lessVal
                entity = found[0].split(":");
                lessName = $.trim(entity[0]);
                lessVal = $.trim(entity[1]);
                htmlID = 'SW_' + lessName.substring(1);

                if (lessVal.search(regexBackgrounds) > -1 || checkBlacklist(lessName) > -1) {
                    continue;
                }

                if (lessVal[0] === '@' && typeof(styles[lessVal]) === "undefined") {
                    continue;

                } else if (typeof(styles[lessVal]) !== "undefined") {
                    styleHead.push($.trim(found[0]) + ";");

                    if (styles[lessVal].indexOf('url(')) {
                        img = styles[lessVal];
                    } else {
                        img = 'none';
                    }

                    styles[lessName] = styles[lessVal];

                } else if (lessVal[0] === "'") {
                    styleHead.push($.trim(found[0]) + ";");
                    img = "background-image: url(" + lessVal + ");";
                    styles[lessName] = "{ background-image: url(" + Utils.getBgPath(lessVal, currentDocument) + ");}";

                } else {
                    styleHead.push($.trim(found[0]) + ";");

                    img = 'none';
                    styles[lessName] = '{ background:' + lessVal + '; }';
                }

                // Register Swatch for CodeHints
                SwatchHints.register(lessName, htmlID);

                // Push Data for Mustache
                panelData.push({
                    line: StringUtils.offsetToLineNum(documentLines, found.index),
                    less: lessName,
                    image: img,
                    htmlID: htmlID
                });
            }

            // parse our generated LESS string and return Swatches for Mustache
            if (parseLess(styleHead, styles)) {
                SwatchHints.init();
                return panelData;
            }
        }
    }

    /*        
        Render Bottompanel and inject filtered/less-parsed CSS for Swatches [swatchesFromLess()]     
    */
    function updatePanel(currentEditor) {
        var data = {
            swatches: swatchesFromLess(currentEditor.document)
        };

        if (data.swatches) {
            var html = Mustache.render(MainView, data);
            $('#swatcher-container').empty().append(html);

            // We have to inject them here - otherwise the resizeable Container wont function
            $('#swatcher-inject').html(swatchesCSS);
        }
    }

    function dependencies(icon) {
        $icon = icon;
    }

    exports.update = updatePanel;
    exports.dependencies = dependencies;
});
