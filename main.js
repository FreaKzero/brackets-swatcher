/*jslint plusplus: true, vars: true, nomen: true */
/*global $, brackets, define, Mustache */

define(function(require, exports, module) {
    "use strict";

    var AppInit = brackets.getModule('utils/AppInit'),
        Menus = brackets.getModule('command/Menus'),
        CommandManager = brackets.getModule('command/CommandManager'),
        WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
        MainViewManager = brackets.getModule('view/MainViewManager'),
        EditorManager = brackets.getModule('editor/EditorManager'),
        ExtensionUtils = brackets.getModule('utils/ExtensionUtils'),
        DocumentManager = brackets.getModule("document/DocumentManager"),

        SettingsDialog = require('src/dialogs/SettingsDialog'),
        AcoImportDialog = require('src/dialogs/AcoImportDialog'),
        AssetPathDialog = require('src/dialogs/AssetDialog'),
        ColorPickerDialog = require('src/dialogs/ColorPickerDialog'),

        Preferences = require('src/Preferences'),
        Utils = require('src/Utils'),
        Icon = require('src/plugin-icon'),
        Messages = require('src/Messages'),
        SwatchParser = require('src/SwatchParser'),
        Modes = require('modes'),
        PanelSkeleton = require('text!tpl/PanelSkeleton.html'),
        $instance, actualFile,

        app = {
            ID: "brackets.swatcher",
            PANEL: "#swatcher",
            CSS: "styles/swatcher.css",
            MENULABEL: "Swatcher",
            MENULOCATION: Menus.AppMenuBar.VIEW_MENU
        };

    ExtensionUtils.loadStyleSheet(module, app.CSS);

    var TemplateData = {};
    TemplateData.swatchsize = Preferences.get('swatchsize');

    $instance = $(Mustache.render(PanelSkeleton, TemplateData));

    function trackFile() {
        if ($('#swatcher-track').prop('checked')) {
            var editor = EditorManager.getActiveEditor();

            if (editor) {
                actualFile = editor.document.file.fullPath;

                if (Modes.hasPreprocessor(editor)) {
                    SwatchParser.generate(editor);
                } else {
                    Messages.error('MAIN_WRONGFILE');
                    $('#swatcher-track').prop('checked', false);
                }
            } else {
                Messages.error('MAIN_NODOCUMENT');
                $('#swatcher-track').prop('checked', false);
            }

        } else {
            $('#swatcher-container').fadeOut(function() {
                $(this).empty();
                $('#swatcher-styles').html("");
                Icon.forceActive();
            });
        }
    }

    $instance.on('click', '#swatcher-open-setasset', function() {
        var p = AssetPathDialog.show();

        p.done(function() {
            trackFile();
        });
    });

    $instance.on('click', '#swatcher-open-colorimport', function() {
        AcoImportDialog.show();
    });


    $instance.on('click', '#swatcher-open-colorpicker', function() {
        ColorPickerDialog.show();
    });

    $instance.on('click', '#swatcher-reset-filter', function() {
        $('#swatcher-filter').val('');
    });

    $instance.on('keyup', '#swatcher-filter', function() {
        var filter = $(this).val();

        $('.swatcher-color').filter(function() {
            var regex = new RegExp(filter, "ig");

            if (regex.test($(this).data('variable'))) {
                $(this).parent().fadeIn();
            } else {
                $(this).parent().fadeOut();
            }
        });

    });

    $instance.on('click', '.close', function() {
        handleActive();
    });

    $instance.on('click', '#swatcher-open-settingsdialog', function() {
        SettingsDialog.show(Preferences);
    });

    $instance.on('mousedown', '.swatcher-color', function(event) {
        var insert,
            editor = EditorManager.getFocusedEditor();

        switch (event.button) {

            case 0: // Left MouseButton
                if (Modes.hasPreprocessor(editor)) {
                    insert = $(this).data("variable");
                } else {
                    if ($(this).css('backgroundImage') === 'none') {
                        insert = $(this).css('backgroundColor');
                    } else {
                        insert = $(this).css('backgroundImage');
                    }
                }

                Utils.insert(editor, insert);
                break;

            case 2: // Right MouseButton
                Utils.gotoLine(actualFile, $(this).data("line"));
                break;
        }
    });

    $instance.on('change', '#swatcher-track', function() {
        trackFile();
    });

    $instance.on({
        mouseenter: function() {
            var toolTip = $(this).data('variable'),
                pos = $(this).offset(),
                top;


            Preferences.get('swatchsize') === 'big' ? top = 60 : top = 30;

            $('<span class="swatcher-label"></span>').text(toolTip)
                .appendTo('body')
                .css('left', (pos.left + 20) + 'px')
                .css('top', (pos.top + top) + 'px')
                .slideDown('fast');
        },

        mouseleave: function() {
            $('.swatcher-label').remove();
        }
    }, '.swatcher-color');

    $(DocumentManager).on("documentSaved", function(e, doc) {
        if (actualFile) {
            var editor = EditorManager.getFocusedEditor();

            if (editor && actualFile === doc.file.fullPath) {
                SwatchParser.generate(editor);
            }
        }
    });

    var handleActive = function() {
        if (!CommandManager.get(app.ID).getChecked()) {
            CommandManager.get(app.ID).setChecked(true);
            $(app.PANEL).show();
            WorkspaceManager.recomputeLayout();
        } else {
            CommandManager.get(app.ID).setChecked(false);
            $(app.PANEL).hide();
            WorkspaceManager.recomputeLayout();
            MainViewManager.focusActivePane();
        }
        Icon.toggleActive();
    };

    var init = function() {
        WorkspaceManager.createBottomPanel(app.ID, $instance, 200);
        handleActive();
    };

    AppInit.appReady(function() {
        var m = Menus.getMenu(app.MENULOCATION);
        CommandManager.register(app.MENULABEL, app.ID, init);
        m.addMenuItem(app.ID, Preferences.get('shortcut'));

        Icon.init(init);
    });

});
