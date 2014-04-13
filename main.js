/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define, Mustache */
define(function (require, exports, module) {
    "use strict";

    var DefaultPreferences = require("./cfg/DefaultPreferences"),
        messages = require('./src/Messages'),
        SwatchHint = require('./src/SwatchHint'),
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
        DocumentManager = brackets.getModule("document/DocumentManager"),

        //actualFile will be set from swatchesFromLess()        
        actualFile,
        swatchesCSS,

        // We just need 1 fired registerEvents() per instance
        loaded = false,
        app = {
            ID: "swatcher.run",
            PANEL: "#swatcher",
            CSS: "css/swatcher.css",
            MENULABEL: "Swatcher",
            MENULOCATION: Menus.AppMenuBar.VIEW_MENU
        };

    /*
        Load Preferences, CSS and Inject Icon into main-toolbar
    */
    ExtensionUtils.loadStyleSheet(module, app.CSS);
    var preferences = PreferencesManager.getPreferenceStorage(module, DefaultPreferences),
        swatchsize = preferences.getValue('swatchsize'),
        shortcut = preferences.getValue('shortcut'),
        $icon = $('<a href="#" id="swatcher-toolbar-icon"> </a>').attr('title', 'Swatcher').appendTo($('#main-toolbar .buttons'));

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
            $icon.addClass('active');
        } else {
            CommandManager.get(app.ID).setChecked(false);
            $(app.PANEL).hide();
            EditorManager.resizeEditor();
            EditorManager.focusEditor();
            $icon.removeClass('active');
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
        1.) Filter only @variable definitions
        2.) Concat filtered @variables in a String
        3.) Sorting out Math functions, Strings starting with numbers, strings with math operators, and HTML width/height entities
        4.) Check the Rest against a User setable Blacklist
        5.) With the Rest: Generate new LESS for Swatches with generated IDs (using Variable Name)
        6.) With the Rest: Push needed Template Data for Mustache
        7.) Send the generated LESS File (styleHead and styleBody) for parsing to _parseLESS()

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
        
        ### TPL: MainView.html
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
                //regexVariables = /@[0-9a-z\-_]+\s*:\s*([0-9a-z\-_@#%'"*\/\.\(\)\,\+\s]+)/ig,
                regexVariables = /^@[0-9a-z\-_]+\s*:\s*([0-9a-z\-_@#%'"*\/\.\(\)\,\+\s]+)/igm,

                regexBackgrounds = /(ceil|floor|percentage|round|sqrt|abs|sin|asin|cos|acos|tan|atan|pi|pow|mod|min|max|length|extract|escape|e)(\()|(^[0-9.]+)|(.*\s(\+|\-|\*)\s.*)|(inherit|normal|bold|italic|\")/g;

            // Reset CodeHints
            SwatchHint.reset();

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

                // Generate HTML Selector
                htmlID = 'SW_' + lessName.substring(1);
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

                // Register Swatch for CodeHints
                SwatchHint.register(lessName, htmlID);

                // Push Data for Mustache
                panelData.push({
                    line: StringUtils.offsetToLineNum(documentLines, found.index),
                    less: lessName,
                    image: img,
                    htmlID: htmlID
                });
            }

            // parse our generated LESS string and return Swatches for Mustache
            if (_parseLESS(styleHead + styleBody)) {
                SwatchHint.init();
                return panelData;
            }
        }
    }

    /*        
        Render Bottompanel and inject filtered/less-parsed CSS for Swatches [swatchesFromLess()]
        ### TPL: MainView.html
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

    /*        
        Writes Imported/Defined Colors into Editor (LESS or CSS File)
        ### TPL: ColorDefine.html
    */
    function writeToEditor(currentEditor) {
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
    */
    function registerEvents(instance) {

        /*
            jQuery function for custom Animation ON/OFF Settings
        */
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

        /*
            Mouseover/out Events for showing Labels            
        */
        instance.on({
            mouseenter: function () {
                var toolTip = $(this).data('less'),
                    pos = $(this).offset(),
                    top;

                swatchsize === 'big' ? top = 60 : top = 30;

                $('<span class="swatcher-label"></span>').text(toolTip)
                    .appendTo('body')
                    .css('left', (pos.left + 20) + 'px')
                    .css('top', (pos.top + top) + 'px')
                    .filterFX('show');
            },
            mouseleave: function () {
                $('.swatcher-label').remove();
            }
        }, '.swatcher-color');

        /*
            Clickevent to import "defined" Colors (ColorDefine.html) into Swatcher Panel
        */
        instance.on('click', '#swatcher-colordefine-import', function () {
            writeToEditor(EditorManager.getFocusedEditor());
        });

        /*
            Clickevent to cancel the ColorDefine Bottomscreen (ColorDefine.html)
        */
        instance.on('click', '#swatcher-colordefine-cancel', function () {
            $('#swatcher-container').empty();
        });

        /*
            Mouse Button Events on the Swatches
            Leftclick: insert Less variable or rgba() value on other files
            Rightclick: Go to File and line where Swatch is defined
        */
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
            Parse Swatches from current Editor/Document
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
            Fires up the ColorImport Dialog
        */
        instance.on('click', '#swatcher-open-colorimport', function () {
            ColorImportDialog.show();
        });

        /*          
            Fires Up Settings Dialog
        */
        instance.on('click', '#swatcher-open-settingsdialog', function () {
            SettingsDialog.show(preferences);
        });

        /*            
            Panel closer
        */
        instance.on('click', '.close', function () {
            _handleActive();
        });

        /*
            Filter Swatches
            Keylistener, when length of inputfield is > 2 the Filter kicks in
        */
        instance.on('keyup', '#swatcher-filter', function () {
            var $filter = $(this).val();

            //method, animate
            if ($filter.length > 2) {
                $('.swatcher-colorwrap:not(.found)')
                    .filterFX('hide')
                    .find('div[data-less*="' + $filter.toLowerCase() + '"]')
                    .parent()
                    .addClass('found');

                $('.found').filterFX('show');
            } else {
                $('.swatcher-colorwrap').removeClass('found').filterFX('show');
            }
        });

        /*
            Update Swatches on save
            Only updates when the previous scanned File is saved
        */
        $(DocumentManager).on("documentSaved", function (e, entry) {
            var editor = EditorManager.getFocusedEditor();

            if (editor && actualFile === editor.document.file.fullPath) {
                panelFromLess(editor);
            }
        });

        loaded = true;
    }

    /*
        Init the Extension
    */
    var _init = function () {
        var TemplateData = {};
        TemplateData.swatchsize = swatchsize;

        var $swatcher = $(Mustache.render(PanelSkeleton, TemplateData));

        if (!loaded) {
            registerEvents($swatcher);
        }

        PanelManager.createBottomPanel(app.ID, $swatcher, 200);
        _handleActive();
    };

    AppInit.appReady(function () {
        var m = Menus.getMenu(app.MENULOCATION);
        CommandManager.register(app.MENULABEL, app.ID, _init);
        m.addMenuItem(app.ID, shortcut);

        $icon.on("click", function () {
            _init();
        });
    });
});