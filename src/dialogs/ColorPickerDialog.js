/*jslint vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50, browser: true */
/*global define, brackets, $, Mustache */

define(function(require, exports) {
    var MainTemplate = require('text!../../tpl/ColorPicker.html'),
        ColorPickerFileDialog = require('text!../../tpl/ColorPickerFile.html'),
        ColorPicker = require('../lib/colorpick'),
        Utils = require('../Utils'),
        ColorImporter = require('../ColorImporter'),
        Dialogs = brackets.getModule('widgets/Dialogs');

    // todo: Button click +/-
    function registerPanelEvents() {

        $('#swatcher-cp-addcolor').on('mousedown', function(event) {

            switch (event.button) {

                case 0: // Left MouseButton
                    ColorImporter.add($(this).parent().data('color'));
                    break;

                case 2: // Right MouseButton
                    var tocopy = document.querySelector('.copy-helper');
                    tocopy.select();

                    var copied = document.execCommand('copy');

                    if (copied === true) {
                        $('.swatcher-copied-message').fadeIn(function() {
                            var that = $(this);

                            setTimeout(function() {
                                that.fadeOut();
                            }, 1200);

                        });
                    }
                    break;
            }
        });

        $('#swatcher-cp-plus').on('click', function() {
            ColorPicker.zoom('+');
        });

        $('#swatcher-cp-minus').on('click', function() {
            ColorPicker.zoom('-');
        });

        $('#swatcher-cp-canvas').on('mousewheel', function(eventScroll) {
            ColorPicker.zoomWheel(eventScroll.originalEvent);
        });

        $('#swatcher-cp-canvas').on('mouseleave', function(eventScroll) {
            $(this).css({
                'cursor': 'crosshair'
            });

            ColorPicker.panEnd();

            $('#swatcher-cp-canvas').off('mousemove');
        });

        $('#swatcher-cp-canvas').on('mousedown', function(eventDown) {

            var xDown = eventDown.offsetX;
            var yDown = eventDown.offsetY;

            switch (eventDown.button) {

                case 0: // Left MouseButton
                    var ArrRGB = ColorPicker.pick(xDown, yDown);
                    var col = Utils.hashFromRGB(ArrRGB[0], ArrRGB[1], ArrRGB[2]);
                    
                    if (eventDown.ctrlKey) {                    
                        ColorImporter.add(col);
                    }

                    $('#swatcher-cp-preview').css({
                        'background-color': col
                    }).data('color', col);

                    $('.copy-helper').val(col);

                    $('#swatcher-cp-canvas').on('mousemove', function(eventMove) {
                        var ArrRGB = ColorPicker.pick(eventMove.offsetX, eventMove.offsetY);
                        var col = Utils.hashFromRGB(ArrRGB[0], ArrRGB[1], ArrRGB[2]);

                        $('#swatcher-cp-preview').css({
                            'background-color': col
                        }).data('color', col);

                        $('.copy-helper').val(col);

                    });
                    
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
                ColorPicker.panEnd();
            }

            $('#swatcher-cp-canvas').off('mousemove');
        });
    }

    function initColorPicker(blob) {
        var $panel = $('#swatcher-container').empty().show().append(
            Mustache.render(MainTemplate)
        );

        ColorImporter.registerPanel($panel);
        ColorPicker.init(blob);
        registerPanelEvents();
    }

    function registerDialogEvents(dialog) {
        var $dialog = dialog.getElement();

        document.getElementById('swatcher-colorimport-pastebox').addEventListener('paste', function(e) {
            e.preventDefault();
            if (e.clipboardData) {
                var items = e.clipboardData.items;

                if (items) {
                    var len = items.length;
                    for (var i = 0; i < len; i++) {
                        if (items[i].type.indexOf('image') !== -1) {
                            initColorPicker(items[i].getAsFile());
                            dialog.close();
                            break;
                        } else {
                            $('#swatcher-colorimport-pastebox')
                                .parent()
                                .find('.error')
                                .text('No Image in Clipboard');
                        }
                    }
                }
            }
        });

        $dialog.on('change', '#swatcher-colorimport-selectfile', function() {
            $dialog.find('#swatcher-colorpickerdialog-ok').attr('disabled', false);
            if (this.files[0].type.indexOf('image') !== -1) {
                initColorPicker(this.files[0]);
                dialog.close();
            } else {
                $(this).parent().find('.error').text('This Filetype is not supported, please select an Image');
            }
        });

    }

    exports.show = function() {
        var compiledTemplate = Mustache.render(ColorPickerFileDialog),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerDialogEvents(dialog);
    };
});