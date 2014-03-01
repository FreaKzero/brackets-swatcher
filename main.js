/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define, Mustache */
define(function (require, exports, module) {
    "use strict";

    var DefaultPreferences = require("./cfg/DefaultPreferences"),
        messages = require('./src/Messages'),

        PanelSkeleton = require("text!html/PanelSkeleton.html"),
        MainView = require("text!html/MainView.html"),

        ColorImportDialog = require("dialogs/ColorImport"),
        SettingsDialog = require("dialogs/SettingsDialog"),

        AppInit = brackets.getModule('utils/AppInit'),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        Menus = brackets.getModule("command/Menus"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PanelManager = brackets.getModule("view/PanelManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        PreferencesManager = brackets.getModule("preferences/PreferencesManager"),
        FileViewController = brackets.getModule("project/FileViewController"),
        
        //actualFile will be set from swatchesFromLess()        
        actualFile,
        swatchesCSS,

        // We just need 1 fired registerEvents() per instance
        loaded = false,

        app = {
            ID: "swatcher.run",
            SHORTCUT: "F11",
            PANEL: "#swatcher",
            CSS: "css/swatcher.css",
            MENULABEL: "Swatcher",
            MENULOCATION: Menus.AppMenuBar.VIEW_MENU
        };

    /*
        Load Preferences 
    */
    var preferences = PreferencesManager.getPreferenceStorage(module, DefaultPreferences);
    
    /*
        Build an Imagepath via Filename and parentpath of current document
    */
    function _getBgPath(str, currentDocument) {
        var os = brackets.platform.indexOf('win') ? 'file:///' : '/',
            root = os + currentDocument.file._parentPath;

        return str.slice(0, 1) + root + str.slice(1 + Math.abs(0));
    }

    /*
        Handle the Contextmenu checksign and open/close Panel
    */
    function _handleActive() {
        if (!CommandManager.get(app.ID).getChecked()) {
            CommandManager.get(app.ID).setChecked(true);
            $(app.PANEL).show();
            EditorManager.resizeEditor();
        } else {
            CommandManager.get(app.ID).setChecked(false);
            $(app.PANEL).hide();
            EditorManager.resizeEditor();
            EditorManager.focusEditor();
        }
    }

    /*
        Inserts String into focused editor
    */
    function _insert(currentEditor, str) {
        if (currentEditor) {
            var document = currentEditor.document;

            if (currentEditor.getSelectedText().length > 0) {
                var selection = currentEditor.getSelection();
                document.replaceRange(str, selection.start, selection.end);
            } else {
                var pos = currentEditor.getCursorPos();
                document.replaceRange(str, {
                    line: pos.line,
                    ch: pos.ch
                });
            }
        }
    }

    /*
        Go to a specific Line of a File
    */
    function _gotoLine(file, line) {
        FileViewController.addToWorkingSetAndSelect(file, FileViewController.WORKING_SET_VIEW);
        EditorManager.getCurrentFullEditor().setCursorPos(line, 0);
    }

    /*
        Process Filtered LESS String from swatchesFromLess() via less.Parser
    */
    function _parseLESS(lessString) {
        swatchesCSS = null;        
        var lp = new(less.Parser);
        lp.parse(lessString, function (err, tree) {
            try {
                swatchesCSS = tree.toCSS();
            } catch (error) {
                messages.panel('MAIN_LESSERROR', 'errorMessage', error.message);
            }
        });

        return swatchesCSS;
    }

    /*
        Check string against the Blacklist defined in the Settings Panel        
    */
    function _checkBlacklist(string) {

        if (preferences.getValue('blacklist') === '') {
            return -1;
        }

        var regex = "(" + preferences.getValue('blacklist').replace(/,/g, "|") + ")",
            blacklist = new RegExp(regex, "g");

        return string.toLowerCase().search(blacklist);
    }

    /*
        Filters LESS Data from current active Document for Swatcher Backgrounds
    */
    function swatchesFromLess(currentDocument) {
        if (currentDocument !== null && typeof (currentDocument) !== 'string') {

            // set global Variable
            actualFile = currentDocument.file.fullPath;
            var found, entity, img, htmlID,
                selector, lessName, lessVal,
                styleHead = ".bgSwatch(@img) {background: url(@img) no-repeat center center; background-size: 90%;}",
                styleBody = "",
                panelData = [],
                documentText = currentDocument.getText(),
                documentLines = StringUtils.getLines(documentText),
                regexVariables = /@[0-9a-z\-_]+\s*:\s*([0-9a-z\-_@#%'"*\/\.\(\)\,\+\s]+)/ig,
                regexBackgrounds = /(ceil|floor|percentage|round|sqrt|abs|sin|asin|cos|acos|tan|atan|pi|pow|mod|min|max|length|extract|escape|e)(\()|(^[0-9.]+)|(.*\s(\+|\-|\*)\s.*)|(inherit|normal|bold|italic|\")/g;

            while ((found = regexVariables.exec(documentText)) !== null) {
                
                // We need all (!) @variables defined since we want @variable:@variable too
                // If we dont do that we will get LESS Parseerrors
                styleHead += $.trim(found[0]) + ";";

                // get lessName (@variable) and the definition lessVal
                entity = found[0].split(":");
                lessName = $.trim(entity[0]);
                lessVal = $.trim(entity[1]);
                
                // Swatches are colors, filter out all math related functions and string-number-starts with regex
                // Also check against the Blacklist from Settings Panel
                if (lessVal.search(regexBackgrounds) > -1 || _checkBlacklist(lessName) > -1) {
                    continue;
                }
                
                // Generate HTML Selector - htmlID is also used as the Label of the Swatch in HTML Template
                htmlID = lessName.substring(1);
                selector = '#' + htmlID + '.swatcher-color';

                // Check for Images (We dont want doublequotes since font-families use them - code convention)
                if (lessVal[0] === "'") {
                    img = 'background-image: url(' + lessVal + ');';
                    styleBody += selector + "{ .bgSwatch(" + _getBgPath(lessVal, currentDocument) + ");}";
                
                // if its not an Image its an color [rgba, #hash, colorcode, less colorfunction, etc]
                } else {
                    img = 'none';
                    styleBody += selector + '{ background-color:' + lessVal + '; }';
                }

                panelData.push({
                    line: StringUtils.offsetToLineNum(documentLines, found.index),
                    less: lessName,
                    image: img,
                    htmlID: htmlID
                });
            }
            
            // parse our generated LESS string and return it - _parseLESS() is handling Errors
            if (_parseLESS(styleHead + styleBody)) {
                return panelData;
            }
        }
    }

    /*        
        Render Bottompanel and inject filtered/less-parsed CSS for Swatches [swatchesFromLess()]
    */
    function panelFromLess(currentEditor) {
        var data = {
            swatches: swatchesFromLess(currentEditor.document)
        };
        
        if (data.swatches) {
            var html = Mustache.render(MainView, data);
            $('#swatcher-container').empty().append(html);
            
            // We have to inject them here - otherwise the resizeable Container wont function
            $('#inject').html(swatchesCSS);
        }
    }

    function acoToLess(currentEditor) {
        if (currentEditor) {
            var mode = currentEditor.document.language._mode,
                str = "";

            $('#swatcher-colordefine-define tr').each(function () {
                if ($(this).data('hex')) {
                    str += $(this).find('input').val() + ":" + $(this).data('hex') + "; \n";
                }
            });

            switch (mode) {
            case 'css':
                str = '/* Generated by Brackets Swatcher' + "\n" + str + '*/';
                break;

            case 'text/x-less':
                str = '/* Generated by Brackets Swatcher */' + "\n" + str;
                break;

            default:
                messages.dialog('ACO_WRONGFILE');
                return false;
            }

            // Insert Less String and Refresh Panel
            _insert(currentEditor, str);
            panelFromLess(currentEditor);

        } else {
            messages.dialog('ACO_NOFILE');
        }
    }

    /*
        Register Change/Click Events
        Constant means in every View (panelSkeleton)
    */
    function registerEvents(instance) {
        $.fn.filterFX = function (method) {
            var animate = preferences.getValue('animation'),
                speed = 300;

            if (animate === "checked") {
                if (method === "show") {
                    this.fadeIn(speed);
                } else {
                    this.fadeOut(speed);
                }
            } else {
                if (method === "show") {
                    this.show();
                } else {
                    this.hide();
                }
            }
            return this;
        };

        instance.on({
            mouseenter: function () {
                var toolTip = $(this).data('less');
                var pos = $(this).offset();

                $('<span class="swatcher-label"></span>').text(toolTip)
                    .appendTo('body')
                    .css('left', (pos.left + 20) + 'px')
                    .css('top', (pos.top + 60) + 'px')
                    .filterFX('show');
            },
            mouseleave: function () {
                $('.swatcher-label').remove();
            }
        }, '.swatcher-color');

        instance.on('click', '#swatcher-colordefine-import', function () {
            acoToLess(EditorManager.getFocusedEditor());
        });

        instance.on('click', '#swatcher-colordefine-cancel', function () {
            $('#swatcher-container').empty();
        });

        instance.on('mousedown', '.swatcher-color', function (event) {
            var insert, editor = EditorManager.getFocusedEditor(),
                mode = editor.document.language._mode;

            switch (event.button) {

            case 0: // Left MouseButton
                if (mode === 'text/x-less') {
                    insert = $(this).data("less");
                } else {
                    if ($(this).data("image") === 'none') {
                        insert = $(this).css('backgroundColor');
                    } else {
                        insert = $(this).data('image');
                    }
                }
                _insert(editor, insert);
                break;

            case 2: // Right MouseButton
                _gotoLine(actualFile, $(this).data("line"));
                break;
            }
        });

        /*
            BottomPanel, Top/Constant
            Parse Swatches from current Editor
        */
        instance.on('click', '#swatcher-parseLESS', function () {
            var editor = EditorManager.getFocusedEditor();
            if (editor) {
                var mode = editor.document.language._mode;

                if (mode === 'css' || mode === 'text/x-less') {
                    panelFromLess(editor);
                } else {
                    messages.panel('MAIN_WRONGEXT');
                    return false;
                }
            } else {
                messages.dialog('MAIN_NODOCUMENT');
            }
        });

        /*
            BottomPanel, Top/Constant
            Inserts less.js from a CDN also inserts a sample stylesheet/less Tag
            For easier Live Development
        */
        instance.on('click', '#swatcher-open-settingsdialog', function () {
            SettingsDialog.show(preferences);
        });

        /*
            BottomPanel, Top/Constant
            Panel closer
        */
        instance.on('click', '.close', function () {
            _handleActive();
        });

        /*
            Bottompanel, Top/Constant
            Keylistener, when length of inputfield is > 2 the Filter kicks in
        */
        instance.on('keyup', '#swatcher-filter', function () {
            var $filter = $(this).val();
            //method, animate
            if ($filter.length > 2) {
                $('.swatcher-colorwrap:not(.found)')
                    .filterFX('hide')
                    .find('div[data-less*="' + $filter + '"]')
                    .parent()
                    .addClass('found');

                $('.found').filterFX('show');
            } else {
                $('.swatcher-colorwrap').removeClass('found').filterFX('show');
            }
        });


        /*
            BottomPanel, Top/Constant
            Fires up the Aco Loader Dialog Modal
        */
        instance.on('click', '#swatcher-open-colorimport', function () {
            ColorImportDialog.show();
        });

        loaded = true;
    }

    /*
        Init the Extension
    */
    var _init = function () {
        ExtensionUtils.loadStyleSheet(module, app.CSS);

        var $swatcher = $(Mustache.render(PanelSkeleton));

        if (!loaded) {
            registerEvents($swatcher);
        }

        PanelManager.createBottomPanel(app.ID, $swatcher, 200);
        _handleActive();
    };

    AppInit.appReady(function () {
        var m = Menus.getMenu(app.MENULOCATION);
        CommandManager.register(app.MENULABEL, app.ID, _init);
        m.addMenuItem(app.ID, app.SHORTCUT);
    });
});