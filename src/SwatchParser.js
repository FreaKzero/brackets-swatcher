/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, Mustache, brackets */

define(function(require, exports, module) {
    var VariableFilter = require("./VariableFilter"),
        MainView = require("text!tpl/Swatches.html"),
        sass = require("./lib/sass"),
        Hints = require("./SwatchHints"),
        Messages = require('./Messages'),
        Icon = require("src/plugin-icon");        

    function generate(editor) {

        var filtered = new VariableFilter(editor),
            data = filtered.getHTML();

        if (data.swatches.length > 0) {
            var css;
            switch (filtered.mode) {

                case 'text/x-less':
                    var lp = new(less.Parser);
                    lp.parse(filtered.getCSS(), function(err, tree) {
                        try {
                            Hints.init('text/x-less');
                            Hints.setHints(filtered.getCodeHints());
                            $('#swatcher-container').empty().hide().append(Mustache.render(MainView, data)).fadeIn();
                            $('#swatcher-styles').html(tree.toCSS());
                            Icon.setOK();
                        } catch (error) {
                            Icon.setError();
                            Messages.error('MAIN_LESSERROR', 'errorMessage', err.message);                            
                        }
                    });
                    break;

                case 'text/x-scss':
                    css = sass.compile(filtered.getCSS());

                    if (typeof css === 'string') {
                        Hints.init('text/x-scss');
                        Hints.setHints(filtered.getCodeHints());
                        $('#swatcher-container').empty().hide().append(Mustache.render(MainView, data)).fadeIn();
                        $('#swatcher-styles').html(css);
                        Icon.setOK();
                    } else {
                        Icon.setError();
                        Messages.error('MAIN_SASSERROR', 'errorMessage', css.message);
                    }

                    break;

                case 'sass':
                    css = sass.compile(filtered.getCSS());

                    if (typeof css === 'string') {
                        Hints.init('sass');
                        Hints.setHints(filtered.getCodeHints());
                        $('#swatcher-container').empty().hide().append(Mustache.render(MainView, data)).fadeIn();
                        $('#swatcher-styles').html(css);
                        Icon.setOK();
                    } else {
                        Icon.setError();
                        Messages.error('MAIN_SASSERROR', 'errorMessage', css.message);
                    }

                    break;

                default:
                    return false;
            }
        } else {
            Messages.notice('MAIN_NOSWATCHES');
        }
    }

    exports.generate = generate;

});