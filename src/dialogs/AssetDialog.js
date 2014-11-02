/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */
define(function(require, exports) {
    var Template = require("text!../../tpl/AssetPath.html"),
        Dialogs = brackets.getModule("widgets/Dialogs");


    var AssetDialog = {
        AssetPath: '',

        _buildPath: function(currentDocument) {
            var os = brackets.platform.indexOf('win') ? 'file:///' : '/';

            if (currentDocument) {
                return os + currentDocument.file._parentPath;
            } else {
                return AssetDialog.AssetPath;
            }
        },

        resetAssetPath: function() {
            AssetDialog.AssetPath = '';
        },

        setAssetPath: function(currentDocument) {
            AssetDialog.AssetPath = AssetDialog._buildPath(currentDocument);
            return AssetDialog.AssetPath;
        },

        getAssetPath: function(currentDocument) {
            if (AssetDialog.AssetPath === '') {
                AssetDialog.AssetPath = AssetDialog._buildPath(currentDocument);
            }

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
                var value = $.trim(instance.find('#swatcher-asset-path').val());
                AssetDialog.AssetPath = value;
            });
        }
    };

    return AssetDialog;
});
