/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets */

define(function(require, exports, module) {
    var StringUtils = brackets.getModule("utils/StringUtils"),
        Utils = require("./Utils"),
        SwatchHints = require('./SwatchHints'),
        messages = require('./Messages'),

        MainView = require("text!html/MainView.html"),

        swatchesCSS,
        $icon,preferences;
        
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

        if (preferences.get('blacklist') === '') {
            return -1;
        }

        var regex = "(" + preferences.get('blacklist').replace(/,/g, "|") + ")",
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
            
            found:      Actual found line (via regexVariables)
            lessName:   Trimmed LESS variable declarion of current Line (via found)
            lessVal:    Trimmed LESS definition of current Line (via found)
            img:        Will be filled if first Char of lessval is an singlequote otherwise none
            htmlID:     Generated HTML ID taken from lessName for Swatches            
            lessBuffer: Contains all filtered Variable definitions from file (for parsing LESS)
            panelData:  Data Array for Mustache
            styles:     Object to Register and Hold the Styles for the actual Swatches    

            regexVariables:     see found
            regexOnlyColors:   Main Regex to filter only Background definitions
                                                                
    */
    function swatchesFromLess(currentDocument) {
        if (currentDocument !== null && typeof(currentDocument) !== 'string') {

            var found, entity, img, htmlID, lessName, lessVal,
                lessBuffer = [],
                panelData = [],
                styles = {},
                documentText = currentDocument.getText(),
                documentLines = StringUtils.getLines(documentText),
                regexVariables = /^@[0-9a-z\-_]+\s*:\s*([0-9a-z\-_@#%'"*\/\.\(\)\,\+\s]+)/igm,
                regexOnlyColors = /(ceil|floor|percentage|round|sqrt|abs|sin|asin|cos|acos|tan|atan|pi|pow|mod|min|max|length|extract|escape|e)(\()|(^[0-9.]+)|(.*\s(\+|\-|\*)\s.*)|(inherit|normal|bold|italic|\")/g;

            // Reset CodeHints
            SwatchHints.reset();

            while ((found = regexVariables.exec(documentText)) !== null) {

                // get lessName (@variable) and the definition lessVal
                entity = found[0].split(":");
                lessName = $.trim(entity[0]);
                lessVal = $.trim(entity[1]);
                htmlID = 'SW_' + lessName.substring(1);

                /*
                    Check against Less noncolor functions - and user variable Blacklist
                */
                if (lessVal.search(regexOnlyColors) > -1 || checkBlacklist(lessName) > -1) {
                    continue;
                }

                /* 
                    Search for LESS Variable - and variable wasnt registered before - no action
                */
                if (lessVal[0] === '@' && typeof(styles[lessVal]) === "undefined") {
                    continue;

                /* Search for LESS Variable - and variable is registered
                    - Differentiate between img and nonimg (CSS Files Leftclick)
                    - Push the complete Style String into lessBuffer (needed for @var:@var parsing in LESS)
                    - Register Property via NEW Lessvariable but old saved value from styles Object (@clone)
                */                    
                } else if (typeof(styles[lessVal]) !== "undefined") {                    

                    if (styles[lessVal].indexOf('url(')) {
                        img = styles[lessVal];
                    } else {
                        img = 'none';
                    }
                    
                    lessBuffer.push($.trim(found[0]) + ";");
                    styles[lessName] = styles[lessVal];
                /*
                    Search for an Image
                        - Set IMG for Mustache (CSS Files Leftclick)
                        - Push the complete Style String into lessBuffer (needed for @var:@var parsing in LESS)
                        - Register Property via Less Variable
                    
                */
                } else if (lessVal[0] === "'") {                    
                    img = "background-image: url(" + lessVal + ");";
                    lessBuffer.push($.trim(found[0]) + ";");
                    styles[lessName] = "{ background-image: url(" + Utils.getBgPath(lessVal, currentDocument) + ");}";
                /*
                    Colorhashes, RGBA, LESS Colorfunctions ...
                        - Set IMG to none
                        - Push the complete Style String into lessBuffer (needed for @var:@var parsing in LESS)
                        - Reigster Property via Less Variable
                */
                } else {                    
                    img = 'none';
                    lessBuffer.push($.trim(found[0]) + ";");
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
            if (parseLess(lessBuffer, styles)) {
                SwatchHints.init();
                return panelData;
            }
        }
    }

    /*
        Join styles Object from swatchesFromLess() to a LESS String        
    */
    function joinStyles(obj) {
        var key, str = '';
        for (key in obj) {
            if (obj.hasOwnProperty(key)) {
                str += '#SW_' + key.substring(1) + ".swatcher-color" + obj[key];
            }
        }
        return str;
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

    /*
        Inject Dependencies from main
    */
    function dependencies(icon, prefs) {
        $icon = icon;
        preferences = prefs;
    }

    exports.update = updatePanel;
    exports.dependencies = dependencies;
});
