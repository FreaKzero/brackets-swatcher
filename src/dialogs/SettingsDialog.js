/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, Mustache */
define(function(require, exports) {
    var Template = require("text!../../html/SettingsDialog.html"),
        ShortcutHelper = require("../../src/helpers/ShortcutHelper"),

        Dialogs = brackets.getModule("widgets/Dialogs"),
        CommandManager = brackets.getModule("command/CommandManager"),
        preferences;

    function registerEvents(dialog) {
        ShortcutHelper.register('#swatcher-settings-shortcut');

        dialog.on('click', '#swatcher-settings-restore', function() {
            var defaults = preferences.getDefaults()
            preferences.persist('animation', defaults.animation);
            preferences.persist('shortcut', defaults.shortcut);
            preferences.persist('swatchsize', defaults.swatchsize);

            CommandManager.execute("debug.refreshWindow");

        });

        dialog.on('click', '#swatcher-settings-save', function() {
            var $animationValue = $('#swatcher-settings-animation').prop("checked") ? 'checked' : '',
                $swatchsize = $('#swatcher-settings-size option:selected').val(),
                $shortcut = $('#swatcher-settings-shortcut').val();

            preferences.persist('animation', $animationValue);
            preferences.persist('shortcut', $shortcut);

            if ($swatchsize !== "0") {
                preferences.persist('swatchsize', $swatchsize);
            }

            CommandManager.execute("debug.refreshWindow");
        });

    }

    exports.show = function(prefs) {
        preferences = prefs;

        var TemplateData = preferences.getAll(),
            compiledTemplate = Mustache.render(Template, TemplateData),
            dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);

        registerEvents(dialog.getElement());

    };

});