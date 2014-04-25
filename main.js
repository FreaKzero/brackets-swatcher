/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define, Mustache */
define(function(require, exports, module) {
    "use strict";

    var Preferences = require("./src/Preferences"),
        Utils = require("./src/Utils"),
        messages = require('./src/Messages'),
        SwatchPanel = require('./src/SwatchPanel'),
        SwatchHints = require('./src/SwatchHints'),
        ColorImport = require("src/dialogs/ColorImport"),
        SettingsDialog = require("src/dialogs/SettingsDialog"),
        PanelSkeleton = require("text!html/PanelSkeleton.html"),

        AppInit = brackets.getModule('utils/AppInit'),
        Menus = brackets.getModule("command/Menus"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PanelManager = brackets.getModule("view/PanelManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        DocumentManager = brackets.getModule("document/DocumentManager"),

        actualFile = false,

        // We just need 1 fired registerEvents() per instance
        loaded = false,
        app = {
            ID: "brackets.swatcher",
            PANEL: "#swatcher",
            CSS: "css/swatcher.css",
            MENULABEL: "Swatcher",
            MENULOCATION: Menus.AppMenuBar.VIEW_MENU
        };

    /*
        Load Preferences, CSS and Inject Icon into main-toolbar
    */
    ExtensionUtils.loadStyleSheet(module, app.CSS);
    var swatchsize = Preferences.get('swatchsize'),
        shortcut = Preferences.get('shortcut'),
        $icon = $('<a href="#" id="swatcher-toolbar-icon"> </a>').attr('title', 'Swatcher').appendTo($('#main-toolbar .buttons'));

    SwatchPanel.dependencies($icon, Preferences);

    /*
        Handle the Contextmenu checksign and open/close Panel
    */
    function handleActive() {
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
        Register Change/Click Events        
    */
    function registerEvents(instance) {

        /*
            jQuery function for custom Animation ON/OFF Settings
        */
        $.fn.filterFX = function(method) {
            var animate = Preferences.get('animation'),
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
            mouseenter: function() {
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
            mouseleave: function() {
                $('.swatcher-label').remove();
            }
        }, '.swatcher-color');

        instance.on('click', '.swatcher-prepare-color-remove', function() {
            $(this).parent().parent().remove();
        });

        /*
            Clickevent to import "defined" Colors (ColorDefine.html) into Swatcher Panel
        */
        instance.on('click', '#swatcher-colordefine-import', function() {
            actualFile = ColorImport.importColors(EditorManager.getFocusedEditor());
        });

        /*
            Clickevent to cancel the ColorDefine Bottomscreen (ColorDefine.html)
        */
        instance.on('click', '#swatcher-colordefine-cancel', function() {
            $('#swatcher-container').empty();
        });

        /*
            Mouse Button Events on the Swatches
            Leftclick: insert Less variable or rgba() value on other files
            Rightclick: Go to File and line where Swatch is defined
        */
        instance.on('mousedown', '.swatcher-color', function(event) {
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
                    Utils.insert(editor, insert);
                    break;

                case 2: // Right MouseButton
                    Utils.gotoLine(actualFile, $(this).data("line"));
                    break;
            }
        });

        /*            
            Parse Swatches from current Editor/Document
        */
        instance.on('click', '#swatcher-trackLESS', function() {
            if ($(this).hasClass('swatcher-stoptrack')) {
                $(this).text('Track File').removeClass('swatcher-stoptrack');

                $('#swatcher-container').empty();
                $('#swatcher-inject').html("");
                SwatchHints.reset();
                actualFile = false;
                $icon.removeClass('ok');
                
            } else {

                var editor = EditorManager.getFocusedEditor();
                if (editor) {
                    var mode = editor.document.language._mode;

                    if (mode === 'css' || mode === 'text/x-less') {
                        actualFile = SwatchPanel.update(editor);                        
                    } else {
                        messages.panel('MAIN_WRONGEXT');
                        return false;
                    }
                } else {
                    messages.dialog('MAIN_NODOCUMENT');
                }
            }
        });

        /*            
            Fires up the ColorImport Dialog
        */
        instance.on('click', '#swatcher-open-colorimport', function() {
            ColorImport.show();
        });

        /*          
            Fires Up Settings Dialog
        */
        instance.on('click', '#swatcher-open-settingsdialog', function() {
            SettingsDialog.show(Preferences);
        });

        /*            
            Panel closer
        */
        instance.on('click', '.close', function() {
            handleActive();
        });

        /*
            Filter Swatches
            Keylistener, when length of inputfield is > 2 the Filter kicks in
        */
        instance.on('keyup', '#swatcher-filter', function() {
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
        $(DocumentManager).on("documentSaved", function(e, doc) {
            if (actualFile) {
                var editor = EditorManager.getFocusedEditor();

                if (editor && actualFile === doc.file.fullPath) {
                    actualFile = SwatchPanel.update(editor);
                }
            }
        });

        loaded = true;
    }

    /*
        Init the Extension
    */
    var _init = function() {
        var TemplateData = {};
        TemplateData.swatchsize = swatchsize;

        var $swatcher = $(Mustache.render(PanelSkeleton, TemplateData));

        if (!loaded) {
            registerEvents($swatcher);
        }

        PanelManager.createBottomPanel(app.ID, $swatcher, 200);
        handleActive();
    };

    AppInit.appReady(function() {
        var m = Menus.getMenu(app.MENULOCATION);
        CommandManager.register(app.MENULABEL, app.ID, _init);
        m.addMenuItem(app.ID, shortcut);

        $icon.on("click", function() {
            _init();
        });
    });
});