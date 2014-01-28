define(function (require, exports, module) {
    var aco = {

        version: 0,
        colnum: 0,
        hex: 0,
        colors: [],

        reset: function () {
            aco.version = 0;
            aco.colnum = 0;
            aco.hex = 0;
            aco.colors = [];
        },

        bin2hex: function (s) {
            var i, l, o = [],
                n;

            s += "";

            for (i = 0, l = s.length; i < l; i++) {
                n = s.charCodeAt(i).toString(16);
                o += n.length < 2 ? "0" + n : n;
            }

            return o;
        },

        genHash: function (r, g, b) {
            var bin = r << 16 | g << 8 | b;
            return (function (h) {
                return new Array(7 - h.length).join("0") + h
            })(bin.toString(16).toUpperCase());
        },

        readword: function (c) {
            if (c > aco.hex.length || c + 4 > aco.hex.length)
                return false;

            return aco.hex.substr(c, 4);
        },

        readaco: function () {
            var pot, col;

            aco.version = parseInt(aco.readword(0), null);
            aco.colnum = parseInt(aco.readword(4), 16);

            if (aco.version < 1 || aco.version > 2) {
                console.log('Unknown ACO Version');
            }

            for (var i = 0; i < aco.colnum; i++) {
                // First item is always on 8 each item iterates on 20 (8 28 48 68 etc)
                // Why 8 ? [0 - 4] is the ACO Version, on [4 - 8] is the Number of all Colors in the Palette (in Hex)
                // Why 20 ? [4] ColorSpace, [4] Red, [4] Green, [4] Blue, [4] ???
                // Only Tested with Version 1
                pot = i * 20;
                col = aco.getColorsV1(8 + pot);
                
                if (col) {
                    aco.colors.push(col);
                }
            }
        },

        /* Colspaces:
        0 RGB           |    1 HSB
        2 CMYK          |    3 PANTONE
        4 FOCOLTONE     |    5 TRUMATCH
        6 TOYO88        |    7 LAB
        8 GREYSCALE     |    9 ???
        10 HKS          |
    */
        getColorsV1: function (cn) {
            var colspace = aco.readword(cn);

            if (colspace != "0000") {
                console.log('Not RGB - skipping color');
                return false;
            }

            // For what i know the indexes are only for RGB
            var r = parseInt(aco.readword(cn + 4), 16) / 256;
            var g = parseInt(aco.readword(cn + 8), 16) / 256;
            var b = parseInt(aco.readword(cn + 12), 16) / 256;
            var hash = "#" + aco.genHash(r, g, b);

            return {
                r: r,
                g: g,
                b: b,
                hash: hash
            };
        },

        getPalette: function (binStr) {
            aco.reset();
            aco.hex = aco.bin2hex(binStr);
            aco.readaco();
            return aco.colors;
        }

    };

    exports.getPalette = aco.getPalette;
});