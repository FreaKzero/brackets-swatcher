define(function (require, exports, module) {

    var mods = {
        16: 'Shift',
        17: 'Ctrl',
        18: 'Alt',
        91: 'Cmd',
        93: 'Cmd'
    },
        keymap = {
            '8': 'Backspace',
            '9': 'Tab',
            '13': 'Enter',
            '32': 'Space',
            '35': 'End',
            '36': 'Home',
            '37': 'Left',
            '38': 'Up',
            '39': 'Right',
            '40': 'Down',
            '46': 'Delete',
            '112': 'F1',
            '113': 'F2',
            '114': 'F3',
            '115': 'F4',
            '116': 'F5',
            '117': 'F6',
            '118': 'F7',
            '119': 'F8',
            '120': 'F9',
            '121': 'F10',
            '122': 'F11',
            '123': 'F12'
        },

        modsPressed = [];

    function register(selector) {
        $(selector).on('keydown', function (event) {

            event.preventDefault();
            event.stopPropagation();

            dev('#dev', event.which);

            setMods(event.which);
            var sc = getShortcut(event.which);

            $(selector).val(sc);

        }).on('keyup', function (event) {
            modsPressed = [];
        });
    }

    function setMods(key) {
        var cmdChar = mods[key];
        if (cmdChar) {
            modsPressed[cmdChar] = cmdChar;
        }
    }

    function dev($s, key) {
        $($s).text(key);
    }

    function getMods() {
        var str = '';

        for (var index in modsPressed) {
            str += index + "-";
        }

        return str;
    }

    function getShortcut(key) {
        var char;

        if (!mods[key]) {
            if (keymap[key]) {
                char = keymap[key];
            } else {
                char = String.fromCharCode(key);
            }

            return getMods() + char;
        }

    }

    exports.register = register;

});