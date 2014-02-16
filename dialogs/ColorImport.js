/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */
define(function (require, exports, module) {
    var MainTemplate = require("text!../html/ColorImport.html"),
        ColorDefineTemplate = require("text!html/ColorDefine.html"),
        messages = require('../src/Messages'),

        Dialogs = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        Aco = require("../src/aco");

    function registerEvents(dialog) {
        var palette;

        dialog.on('change', '#swatcher-colorimport-file', function () {
            var fr = new FileReader();
            fr.onloadend = function () {
                palette = Aco.getRGB(this.result);

                // We cant use aco.colnum because that property can be from all colorspaces - we just want RGB (prevented in lib)
                if (palette.length > 0) {

                    dialog.find('#swatcher-colorimport-status').html(
                        //messages.DIALOG_PARSESUCCESS.replace('{count}', palette.length)
                        messages.getMessage('DIALOG_PARSESUCCESS', 'count', palette.length)
                    );
                    dialog.find('#swatcher-colorimport-ok').attr('disabled', false);

                } else {
                    dialog.find('#swatcher-colorimport-status').html(messages.getMessage('DIALOG_CANTPARSE'));
                    dialog.find('#swatcher-colorimport-ok').attr('disabled', 'disabled');
                }

            };
            fr.readAsArrayBuffer(this.files[0]);
        });

        dialog.on('click', '#swatcher-colorimport-ok', function () {
            panelFromAco(palette);
        });
    }

    function panelFromAco(acoPalette) {
        var name, str = "",
            panelData = [];

        acoPalette.forEach(function (color, i) {

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