/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */

define(function(require, exports, module) {
    var MainTemplate = require("text!../../html/ColorImport.html"),
        ColorDefineTemplate = require("text!html/ColorDefine.html"),
        messages = require('../Messages'),

        Dialogs = brackets.getModule("widgets/Dialogs"),
        Aco = require("../importers/aco"),
        ColorThief = require("../importers/color-thief");


    /*
        Register Dialog Events
    */
    function registerEvents(dialog) {

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


    function toHex(N) {
        if (N == null) return "00";
        N = parseInt(N);
        if (N == 0 || isNaN(N)) return "00";
        N = Math.max(0, N);
        N = Math.min(N, 255);
        N = Math.round(N);
        return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
    }

    /*
        Creates Hexadecimal Colorhashes from R, G, B decimal values
    */

    function hashFromRGB(R, G, B) {
        return "#" + toHex(R) + toHex(G) + toHex(B);
    }

    /*        
        Writes Imported/Defined Colors into Editor (LESS or CSS File)        
    */
    function importColors(currentEditor) {
        if (currentEditor) {
            var mode = currentEditor.document.language._mode,
                str = "";

            $('#swatcher-colordefine-define tr').each(function() {
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
                    messages.dialog('MAIN_WRONGFILE');
                    return false;
            }

            // Insert Less String and Refresh Panel
            Utils.insert(currentEditor, str);
            SwatchPanel.update(currentEditor);

        } else {
            messages.dialog('ACO_NOFILE');
        }
    }

    /*
        Creates the ColorDefine Panel to define Colornames
    */
    function createPanel(palette) {
        var panelData = [];

        palette.forEach(function(arrayRGB, i) {

            // Hashes are more convenient, since we will never have any transparent colors in Import
            var hash = hashFromRGB(arrayRGB[0], arrayRGB[1], arrayRGB[2]);

            // Data for Mustache
            panelData.push({
                less: '@color' + i,
                hex: hash,
                style: 'background-color:' + hash
            });
        });

        var html = Mustache.render(ColorDefineTemplate, {
            wrap: panelData
        });

        $('#swatcher-container').empty().append(html);
    }

    exports.show = function() {
        var compiledTemplate = Mustache.render(MainTemplate),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerEvents(dialog.getElement());
    };

});