/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */
define(function(require, exports) {
    var Template = require("text!../../tpl/AssetPath.html"),
        Dialogs = brackets.getModule("widgets/Dialogs");


    var AssetDialog = {
        AssetPath: false,

        setAssetPath: function(path) {
            AssetDialog.AssetPath = path;
        },

        getAssetPath: function() {
            return AssetDialog.AssetPath;
        },

        show: function() {
            var TemplateData = {};

            if (AssetDialog.getAssetPath()) {
                TemplateData.AssetPath = AssetDialog.getAssetPath();
            }

            var template = Mustache.render(Template, TemplateData),
                dialog = Dialogs.showModalDialogUsingTemplate(template);

            var instance = dialog.getElement();

            instance.on('click', '#swatcher-set-asset-path', function() {
                AssetDialog.AssetPath = $.trim(instance.find('#swatcher-asset-path').val());
            });
        }
    };

    return AssetDialog;
});
