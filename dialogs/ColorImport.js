/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */

define(function (require, exports, module) {
    var MainTemplate = require("text!../html/ColorImport.html"),
        ColorDefineTemplate = require("text!html/ColorDefine.html"),
        messages = require('../src/Messages'),

        Dialogs = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        Aco = require("../src/aco"),
        ColorThief = require("../src/colorthief");


    /*
        Register Dialog Events
    */
    function registerEvents(dialog) {
        var palette;

        dialog.on('click', '.show-btn-aco', function () {

            $(this).addClass('primary');
            $('.show-btn-img').removeClass('primary');

            $('#show-import-img').hide();
            $('#show-import-aco').show();
        });

        dialog.on('click', '.show-btn-img', function () {
            $(this).addClass('primary');
            $('.show-btn-aco').removeClass('primary');

            $('#show-import-img').show();
            $('#show-import-aco').hide();
        });

        dialog.on('change', '#swatcher-colorimport-img', function () {
            var fr = new FileReader();
            //TODO check Mime (!)
            fr.onload = function (event) {
                
                $('#colorthief').prop('src', event.target.result);

                var $image = $('#colorthief'),
                    colnum = parseInt($('#swatcher-colorimport-img-num').val());
                    
                palette = ColorThief.createPalette($image[0], colnum);

                if (palette.length > 0) {                    
                    dialog.find('#swatcher-colorimport-status').html(
                        messages.getMessage('DIALOG_IMG_PARSESUCCESS', 'count', palette.length)
                    );

                    dialog.find('#swatcher-colorimport-ok').attr('disabled', false);

                } else {

                    dialog.find('#swatcher-colorimport-status').html(
                        messages.getMessage('DIALOG_IMG_CANTPARSE')
                    );

                    dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');
                    
                }


            };

            fr.readAsDataURL(this.files[0]);

        });

        /*
            When value of FileInput File changes, Fire
        */
        dialog.on('change', '#swatcher-colorimport-aco', function () {
            var fr = new FileReader();

            fr.onloadend = function () {
                palette = Aco.getRGB(this.result);

                // We cant use aco.colnum because that property can be from all colorspaces - we just want RGB (prevented in lib)
                if (palette.length > 0) {

                    // Show Success Message with count of colors found and activate OK Button
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

        });

        dialog.on('click', '#swatcher-colorimport-ok', function () {            
            createPanel(palette);            
        });
    }

    function createPanel(palette) {
        var name, str = "",
            panelData = [];

        palette.forEach(function (color, i) {

            name = '@color' + i;
            str += name + ":" + color + "; \n";

            panelData.push({
                less: '@color' + i,
                hex: color,
                style: 'background-color:' + color
            });
        });

        var html = Mustache.render(ColorDefineTemplate, {
            wrap: panelData
        });

        $('#swatcher-container').empty().append(html);
    }

    exports.show = function () {
        var compiledTemplate = Mustache.render(MainTemplate),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerEvents(dialog.getElement());
    };

});