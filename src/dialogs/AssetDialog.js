/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */
define(function(require, exports) {
    var Template = require('text!../../tpl/AssetPath.html'),
        Dialogs = brackets.getModule('widgets/Dialogs'),
        INSTANCE = null;


    function AssetPath() {
        this.assetPath = '';
        this.currentDocument = null;
    }
    
    AssetPath.prototype.buildPath = function(currentDocument, path) {        
        var os = brackets.platform.indexOf('win') ? 'file:///' : '/';

        if (currentDocument) {

            if (path) {
                return os + currentDocument.file._parentPath + path;
            }

            return os + currentDocument.file._parentPath;

        } else {

            return AssetPath.assetPath;

        }
    };

    AssetPath.prototype.resetPath = function() {
        this.assetPath = '';
    };

    AssetPath.prototype.setPath = function(path, currentDocument) {
        this.assetPath = this.buildPath(currentDocument, path);
        return this.assetPath;
    };

    AssetPath.prototype.getPath = function(currentDocument) {
        if (this.assetPath === '') {
            this.assetPath = this.buildPath(currentDocument);
        }

        return this.assetPath;
    };

    AssetPath.prototype.showDialog = function() {
        var TemplateData = {};
        var defer = $.Deferred();

        TemplateData.AssetPath = this.getPath();

        var template = Mustache.render(Template, TemplateData),
            dialog = Dialogs.showModalDialogUsingTemplate(template);

        var dialogInstance = dialog.getElement();
        var that = this;
        
        dialogInstance.on('click', '#swatcher-set-asset-path', function() {
            var value = $.trim(dialogInstance.find('#swatcher-asset-path').val()),
                lastChar = value.slice(-1);

            if (lastChar !== '/') {
                value = value + '/';
            }

            that.assetPath = value;
            defer.resolve();
        });

        dialogInstance.on('click', '#swatcher-reset-asset-path', function() {
            dialogInstance.find('#swatcher-asset-path').val('');
            defer.resolve();
        });

        dialogInstance.on('click', '.cancel', function() {
            defer.reject();
        });

        return defer.promise();
    };

    function getInstance() {
        if (INSTANCE === null) {
            INSTANCE = new AssetPath();
        }

        return INSTANCE;
    }

    exports.getInstance = getInstance;

});