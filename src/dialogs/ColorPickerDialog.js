/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true */
/*global define, brackets, $, Mustache */

define(function(require, exports) {
    var MainTemplate = require("text!../../tpl/ColorPicker.html"),
        ColorPickerFileDialog = require("text!../../tpl/ColorPickerFile.html"),
        ColorPicker = require("../lib/colorpick"),
        Utils = require('../Utils'),
        ColorImporter = require('../ColorImporter'),
        WorkspaceManager = brackets.getModule('view/WorkspaceManager'),
        Dialogs = brackets.getModule("widgets/Dialogs");



    function registerPanelEvents() {
        $('#swatcher-cp-addcolor').on('click', function() {
            ColorImporter.add($(this).parent().data('color'));
        });

        $('#swatcher-cp-plus').on('click', function() {
            ColorPicker.zoom('+');
        });

        $('#swatcher-cp-minus').on('click', function() {
            ColorPicker.zoom('-');
        });

        $('#swatcher-cp-fit').on('click', function() {
            ColorPicker.zoom('x');
        });

        $('#swatcher-cp-canvas').on('mousedown', function(eventDown) {

            var xDown = eventDown.offsetX;
            var yDown = eventDown.offsetY;

            switch (eventDown.button) {

                case 0: // Left MouseButton            
                    var ArrRGB = ColorPicker.pick(xDown, yDown);
                    var col = Utils.hashFromRGB(ArrRGB[0], ArrRGB[1], ArrRGB[2]);

                    $('#swatcher-cp-preview').css({
                        'background-color': col
                    }).data('color', col);

                    break;

                case 2: // Right MouseButton
                    ColorPicker.panStart(xDown, yDown);
                    $('#swatcher-cp-canvas').on('mousemove', function(eventMove) {

                        $(this).css({
                            'cursor': 'move'
                        });

                        var xMove = eventMove.offsetX;
                        var yMove = eventMove.offsetY;

                        ColorPicker.pan(xMove, yMove);
                    });
                    break;
            }

        });

        $('#swatcher-cp-canvas').on('mouseup', function(eventUp) {
            $(this).css({
                'cursor': 'crosshair'
            });

            if (eventUp.button === 2) {
                var xUp = eventUp.offsetX;
                var yUp = eventUp.offsetY;

                ColorPicker.panEnd(xUp, yUp);

                $('#swatcher-cp-canvas').off('mousemove');
            }
        });
    }

    function registerDialogEvents(dialog) {

        dialog.on('change', '#swatcher-colorimport-selectfile', function() {
            dialog.find('#swatcher-colorpickerdialog-ok').attr('disabled', false);

            //TODO BUG: Layout Refreshing Bug
            $('#swatcher').css({
                height: 380
            });

            WorkspaceManager.recomputeLayout(true);

            var $panel = $('#swatcher-container').empty().show().append(
                Mustache.render(MainTemplate)
            );

            ColorImporter.registerPanel($panel);

            var img = new Image();
            img.src = URL.createObjectURL(this.files[0]);

            img.onload = function() {
                ColorPicker.init(img);
                ColorPicker.draw();
            };

            registerPanelEvents();
        });

    }

    exports.show = function() {
        var compiledTemplate = Mustache.render(ColorPickerFileDialog),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerDialogEvents(dialog.getElement());
    };
});
