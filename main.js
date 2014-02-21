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
        need desc (Browser fix)
    */
    function _rgb2hex(rgb) {
        rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
        return "#" +
            ("0" + parseInt(rgb[1], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[2], 10).toString(16)).slice(-2) +
            ("0" + parseInt(rgb[3], 10).toString(16)).slice(-2);
    }

    /*
        need a desc
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
        need a desc
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
        Bottompanel, MainView
        Parse Less Variables from current Document via Regex and prepare the data-tags for HTML
        Since you can insert in every File you want, we need raw CSS Styles and LESS variables as data-tags

        @style = actual visualisation of the Swatch
        @hex = CSS Property or Colorhash of the Swatch
        @less = LESS Variablename
        @line = Linenumber where variable was defined        
        @label = The Label of the Swatch
        
    */
    function swatchesFromLess(currentDocument) {
        if (currentDocument !== null && typeof (currentDocument) !== 'string') {

            // set global Variable
            actualFile = currentDocument.file.fullPath;

            var found, entity, img, htmlID,
                selector, lessName, lessVal,
                styleHead = ".bgSwatch(@img) {background: url(@img) no-repeat center center #252525; background-size: 90%;}",
                styleBody = "",
                panelData = [],
                documentText = currentDocument.getText(),
                documentLines = StringUtils.getLines(documentText),
                regex = /@[0-9a-z\-_]+\s*:\s*(@[0-9a-z\-]+|(lighten|darken|saturate|desaturate|fadein|fadeout|fade|spin|mix)\(.*\)|'.*'|#[0-9a-f]{3,6})/ig;

            while ((found = regex.exec(documentText)) !== null) {
                entity = found[0].split(":");

                lessName = $.trim(entity[0]);
                lessVal = $.trim(entity[1]);

                if (_checkBlacklist(lessName) > -1) {
                    continue;
                }

                htmlID = lessName.substring(1);
                selector = '#' + htmlID + '.swatcher-color';
                styleBody += selector + '{ background-color:' + lessVal + '; }';

                styleHead += found[0] + ";";

                if (lessVal[0] === "'") {
                    img = 'background-image: url(' + lessVal + ');';
                    styleBody += selector + "{ .bgSwatch(" + _getBgPath(lessVal, currentDocument) + ");}";
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

            if (_parseLESS(styleHead + styleBody)) {
                return {
                    wrap: panelData
                };
            }

        }
    }

    /*
        Bottompanel, Main View
        Render Bottompanel with color definitons from LESS File [swatchesFromLess()]
    */
    function panelFromLess(currentEditor) {
        var data = swatchesFromLess(currentEditor.document);

        if (data) {
            var html = Mustache.render(MainView, data);
            $('#swatcher-container').empty().append(html);
            // Otherwise we will break resizeable bottombar            
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
                        insert = _rgb2hex($(this).css('backgroundColor'));
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