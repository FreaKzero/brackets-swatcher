/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */

define(function(require, exports) {
    var MainTemplate = require('text!../../tpl/AcoImport.html'),
        ColorDefineTemplate = require('text!../../tpl/ColorDefine.html'),
        messages = require('../Messages'),
        ColorImporter = require('../ColorImporter'),
        SwatchImporter = require('../lib/SwatchImporter.min'),
        Dialogs = brackets.getModule('widgets/Dialogs'),
        jDataView = require('../lib/jdataview');
    /*
        Register Dialog Events
    */
    function registerDialogEvents(dialog) {
        var palette;

        /*
            FileInput Change Event for Aco Files (Photoshop Swatches)
        */
        dialog.on('change', '#swatcher-colorimport-aco', function(changeEvent) {
            dialog.find('.swatcher-colorimport-loading').show();
            dialog.find('#swatcher-colorimport-status').removeClass().html('');
            var EXT = changeEvent.target.files[0].name.slice(-3).toLowerCase();
            var ALLOWED_EXT = ['aco', 'ase'];

            var fr = new FileReader();

            fr.onloadend = function() {

                if (ALLOWED_EXT.indexOf(EXT) != -1) {
                    try {
                        var data = new jDataView(this.result);
                        var imp = SwatchImporter(EXT);
                        palette = imp.getColors(data);

                        dialog.find('.swatcher-colorimport-loading').hide();
                        dialog.find('#swatcher-colorimport-status')
                            .addClass('success')
                            .html(messages.getMessage('DIALOG_ACO_PARSESUCCESS', 'count', palette.length));

                        dialog.find('#swatcher-colorimport-ok').attr('disabled', false);

                    } catch (e) {
                        
                        dialog.find('#swatcher-colorimport-status')
                            .addClass('error')
                            .html(messages.getMessage('DIALOG_ACO_CANTPARSE'));

                        dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');
                    }
                } else {

                    dialog.find('#swatcher-colorimport-status')
                        .addClass('error')
                        .html(messages.getMessage('DIALOG_WRONGMIME', 'filetype', '(*.aco, *.ase)'));

                    dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');

                }
            };
            fr.readAsArrayBuffer(this.files[0]);
        });

        /*
            ClickEvent for OK Button - ColorDefine Panel (Defining Colornames)
        */
        dialog.on('click', '#swatcher-colorimport-ok', function() {
            var $panel = $('#swatcher-container').empty().show().append(
                Mustache.render(ColorDefineTemplate)
            );

            ColorImporter.registerPanel($panel);
            ColorImporter.addObject(palette);

        });
    }

    exports.show = function() {
        var compiledTemplate = Mustache.render(MainTemplate),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerDialogEvents(dialog.getElement());
    };

});