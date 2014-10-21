/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */

define(function(require, exports) {
    var MainTemplate = require("text!../../tpl/ColorImport.html"),
        ColorDefineTemplate = require("text!../../tpl/ColorDefine.html"),
        messages = require('../Messages'),
        Utils = require('../Utils'),
        Aco = require("../lib/aco"),
        ColorThief = require("../lib/color-thief"),        
        Modes = require('../../modes'),

        Dialogs = brackets.getModule("widgets/Dialogs");
    /*
        Register Dialog Events
    */
    function registerDialogEvents(dialog) {

        // Since we can have Palettes from Images or Aco Files - we need this global
        var palette;

        /*
            Event/Show for the Palette from ACO Button
        */
        dialog.on('click', '.show-btn-aco', function() {

            $(this).addClass('primary');
            $('.show-btn-img').removeClass('primary');

            $('#show-import-img').hide();
            $('#show-import-aco').show();
        });

        /*
            Event/Show for the Palette from IMG Button
        */
        dialog.on('click', '.show-btn-img', function() {
            $(this).addClass('primary');
            $('.show-btn-aco').removeClass('primary');

            $('#show-import-img').show();
            $('#show-import-aco').hide();
        });

        /*
            FileInput Change Event for Image Files (ColorThief)
        */
        dialog.on('change', '#swatcher-colorimport-img', function(changeEvent) {

            dialog.find('.swatcher-colorimport-loading').show();
            dialog.find('#swatcher-colorimport-status').html("");

            if (changeEvent.target.files[0].type.match(/image.*/)) {
                var fr = new FileReader();

                fr.onload = function(fileEvent) {
                    // Colorthief needs a HTML <img> element to inject it into a Canvas, filling src with BASE64 String
                    $('#colorthief').prop('src', fileEvent.target.result);

                    var $image = $('#colorthief'),
                        colnum = parseInt($('#swatcher-colorimport-img-num').val());

                    // Set Palette globally
                    palette = ColorThief.getPalette($image[0], colnum);

                    // Success Message and enable OK Button
                    if (palette.length > 0) {
                        dialog.find('.swatcher-colorimport-loading').hide();
                        dialog.find('#swatcher-colorimport-status').html(
                            messages.getMessage('DIALOG_IMG_PARSESUCCESS', 'count', palette.length)
                        );

                        dialog.find('#swatcher-colorimport-ok').attr('disabled', false);

                        // Error Message - disable OK Button
                    } else {

                        dialog.find('#swatcher-colorimport-status').html(
                            messages.getMessage('DIALOG_IMG_CANTPARSE')
                        );

                        dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');
                    }
                };

                // Reason: <img src="BASE64">
                fr.readAsDataURL(this.files[0]);

                // Wrong MIME
            } else {

                dialog.find('#swatcher-colorimport-status').html(
                    messages.getMessage('DIALOG_WRONGMIME', 'filetype', 'Image (*.png, *.jpg, *.gif, *.bmp)')
                );

                dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');

            }
        });

        /*
            FileInput Change Event for Aco Files (Photoshop Swatches)
        */
        dialog.on('change', '#swatcher-colorimport-aco', function(changeEvent) {
            dialog.find('.swatcher-colorimport-loading').show();
            dialog.find('#swatcher-colorimport-status').html("");

            // file.type on aco is an empty String.... 
            if (changeEvent.target.files[0].name.slice(-3).toLowerCase() === "aco") {

                var fr = new FileReader();

                fr.onloadend = function() {
                    // Set Palette globally
                    palette = Aco.getRGB(this.result);

                    // We cant use aco.colnum because that property can be from all colorspaces - we just want RGB (prevented in lib)
                    if (palette.length > 0) {

                        // Show Success Message with count of colors found and activate OK Button
                        dialog.find('.swatcher-colorimport-loading').hide();
                        dialog.find('#swatcher-colorimport-status').html(
                            messages.getMessage('DIALOG_ACO_PARSESUCCESS', 'count', palette.length)
                        );
                        dialog.find('#swatcher-colorimport-ok').attr('disabled', false);

                    } else {
                        // Show Error Message and disable OK Button
                        dialog.find('#swatcher-colorimport-status').html(messages.getMessage('DIALOG_ACO_CANTPARSE'));
                        dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');
                    }
                };

                fr.readAsArrayBuffer(this.files[0]);

                // Wrong MIME
            } else {

                dialog.find('#swatcher-colorimport-status').html(
                    messages.getMessage('DIALOG_WRONGMIME', 'filetype', 'Photoshop Swatches (*.aco)')
                );

                dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');

            }
        });

        /*
            ClickEvent for OK Button - ColorDefine Panel (Defining Colornames)
        */
        dialog.on('click', '#swatcher-colorimport-ok', function() {
            createPanel(palette);
        });
    }

    /*
        Creates the ColorDefine Panel to define Colornames
    */
    function createPanel(palette) {
        var panelData = [];

        palette.forEach(function(arrayRGB, i) {

            // Hashes are more convenient, since we will never have any transparent colors in Import
            var hash = Utils.hashFromRGB(arrayRGB[0], arrayRGB[1], arrayRGB[2]);

            // Data for Mustache
            panelData.push({
                less: 'color' + i,
                hex: hash,
                style: 'background-color:' + hash
            });
        });

        var html = Mustache.render(ColorDefineTemplate, {
            wrap: panelData
        });

        $('#swatcher-container').empty().show().append(html);
    }

    /*        
        Writes Imported/Defined Colors into Editor (LESS or CSS File)        
    */
    function importColors(currentEditor) {
        if (currentEditor) {
            var mode = currentEditor.document.language._mode,
                ModesObject = Modes.getMode(mode),
                str = "";

            if (ModesObject) {

                $('#swatcher-colordefine-define tr').each(function() {
                    if ($(this).data('hex')) {
                        str += ModesObject.trigger + $(this).find('input').val() + ":" + $(this).data('hex') + "; \n";
                    }
                });

                str = "\n" + '/* Generated by Brackets Swatcher */' + "\n" + str;
                Utils.insert(currentEditor, str);
                $('#swatcher-container').empty();
                
            } else {
                messages.dialog('ACO_NOSUPPORT');                
            }
        } else {
            messages.dialog('ACO_NOFILE');            
        }
    }

    exports.importColors = importColors;

    exports.show = function(PanelInstance) {
        var compiledTemplate = Mustache.render(MainTemplate),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerDialogEvents(dialog.getElement());
    };

});