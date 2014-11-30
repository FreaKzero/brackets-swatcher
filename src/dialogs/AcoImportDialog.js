/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */

define(function(require, exports) {
    var MainTemplate = require("text!../../tpl/AcoImport.html"),
        ColorDefineTemplate = require("text!../../tpl/ColorDefine.html"),
        messages = require('../Messages'),
        ColorImporter = require('../ColorImporter'),
        Utils = require('../Utils'),
        Aco = require("../lib/aco"),
        Dialogs = brackets.getModule("widgets/Dialogs");
    /*
        Register Dialog Events
    */
    function registerDialogEvents(dialog) {

        // Since we can have Palettes from Images or Aco Files - we need this global
        var palette;

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
            var $panel = $('#swatcher-container').empty().show().append(
                Mustache.render(ColorDefineTemplate)
            );

            ColorImporter.registerPanel($panel);

            palette.forEach(function(arrayRGB) {
                var hash = Utils.hashFromRGB(arrayRGB[0], arrayRGB[1], arrayRGB[2]);
                ColorImporter.add(hash);
            });
        });
    }

    exports.show = function() {
        var compiledTemplate = Mustache.render(MainTemplate),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerDialogEvents(dialog.getElement());
    };

});
