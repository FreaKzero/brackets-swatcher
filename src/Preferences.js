/*global brackets, define */

define(function(require, exports, module) {
    "use strict";

    var _ = brackets.getModule('thirdparty/lodash'),
        PreferencesManager = brackets.getModule('preferences/PreferencesManager'),
        prefs = PreferencesManager.getExtensionPrefs('brackets.swatcher');

    var defaultPreferences = {
        "swatchsize": {
            "type": "string",
            "value": "big"
        },
        "shortcut": {
            "type": "string",
            "value": "F11"
        }
    };

    _.each(defaultPreferences, function(definition, key) {
        if (definition.os && definition.os[brackets.platform]) {
            prefs.definePreference(key, definition.type, definition.os[brackets.platform].value);
        } else {
            prefs.definePreference(key, definition.type, definition.value);
        }
    });
    prefs.save();

    prefs.getAll = function() {
        var obj = {};
        _.each(defaultPreferences, function(definition, key) {
            obj[key] = this.get(key);
        }, this);
        return obj;
    };

    prefs.getDefaults = function() {
        var obj = {};
        _.each(defaultPreferences, function(definition, key) {
            var defaultValue;
            if (definition.os && definition.os[brackets.platform]) {
                defaultValue = definition.os[brackets.platform].value;
            } else {
                defaultValue = definition.value;
            }
            obj[key] = defaultValue;
        }, this);
        return obj;
    };
        
    prefs.persist = function(key, value) {
        this.set(key, value);
        this.save();
    };
    
    module.exports = prefs;
});