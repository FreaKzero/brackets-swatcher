/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */
define(function (require, exports, module) {
    var DefaultPreferences = require("../../cfg/DefaultPreferences"),
        BlacklistSets = require("../../cfg/BlacklistSets"),
        Template = require("text!../../html/SettingsDialog.html"),
        ShortcutHelper = require("../../src/helpers/ShortcutHelper"),

        Dialogs = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        preferences;

    function registerEvents(dialog) {
        ShortcutHelper.register('#swatcher-settings-shortcut');
        
        dialog.on('click', '#swatcher-settings-restore', function () {
            preferences.setValue('blacklist', DefaultPreferences.blacklist);
            preferences.setValue('animation', DefaultPreferences.animation);
            preferences.setValue('sets', DefaultPreferences.sets);
            preferences.setValue('swatchsize', DefaultPreferences.swatchsize);
            CommandManager.execute("debug.refreshWindow");
        });

        dialog.on('change', '#swatcher-settings-sets', function () {
            $('#swatcher-settings-firstoption').text('Empty Blacklist');
            $('#swatcher-settings-blacklist').val($(this).val());
        });

        dialog.on('click', '#swatcher-settings-save', function () {
            var $animationValue = $('#swatcher-settings-animation').prop("checked") ? 'checked' : '',
                $swatchsize = $('#swatcher-settings-size option:selected').val(),
                $shortcut = $('#swatcher-settings-shortcut').val();
            
            preferences.setValue('blacklist', $.trim($('#swatcher-settings-blacklist').val()));
            preferences.setValue('animation', $animationValue);
            preferences.setValue('shortcut', $shortcut);
            
            if ($swatchsize !== "0") {
                preferences.setValue('swatchsize', $swatchsize);
            }
                                     
            CommandManager.execute("debug.refreshWindow");
        });

    }

    exports.show = function (prefs) {
        preferences = prefs;

        var TemplateData = preferences.getAllValues();
        TemplateData.sets = BlacklistSets.getSets();

        var compiledTemplate = Mustache.render(Template, TemplateData),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerEvents(dialog.getElement());

    };

});