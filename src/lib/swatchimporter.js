/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */
define(function(require, exports, module) {

    var AcoImport = function() {
        this.version = 0;
        this.colnum = 0;
        this.colors = [];
    };

    AcoImport.prototype._readHead = function(array) {
        this.version = array[1];
        this.colnum = array[3];
        this.colors = [];

        if (this.version < 1 || this.version > 2) {
            console.log('Unknown ACO Version');
            return false;
        }

        return true;
    };

    AcoImport.prototype.getColorSpace = function(value) {

        var cs = {
            0: 'RGB',
            1: 'HSB',
            2: 'CMYK',
            3: 'PANTONE',
            4: 'FOCOLTONE',
            5: 'TRUMATCH',
            6: 'TOYO88',
            7: 'LAB',
            8: 'GREYSCALE',
            10: 'HKS'
        };

        if (typeof cs[value] !== 'undefined') {
            return cs[value];
        }

        return false;
    };

    AcoImport.prototype.getColors = function(buffer, hash) {
        var pot,
            colorspace,
            data = new Uint8Array(buffer);

        if (!this._readHead(data)) {
            return false;
        }

        for (var i = 0; i < this.colnum; i++) {
            pot = i * 10;
            colorspace = this.getColorSpace(data[pot + 5]);
            var rgb;

            switch (colorspace) {
                case 'RGB':
                    rgb = [data[pot + 6], data[pot + 8], data[pot + 10]];
                    break;

                case 'CMYK':
                    rgb = SwatchImporter.cmyk2rgb(data[pot + 6], data[pot + 8], data[pot + 10], data[pot + 12]);
                    break;

                default:
                    console.log('Colorspace not supported - skipping Color');
                    break;
            }

            if (hash) {
                this.colors.push(SwatchImporter.rgb2hex(rgb));
            } else {
                this.colors.push(rgb);
            }
        }

        return this.colors;
    };

    AcoImport.prototype.getRGB = function(buffer) {
        return this.getColors(buffer);
    };

    AcoImport.prototype.getHash = function(buffer) {
        return this.getColors(buffer, 1);
    };

    var SwatchImporter = {

        rgb2hex: function(array) {
            function digitToHex(N) {
                if (N === null) return "00";
                N = parseInt(N);
                if (N === 0 || isNaN(N)) return "00";
                N = Math.max(0, N);
                N = Math.min(N, 255);
                N = Math.round(N);
                return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
            }

            return "#" + digitToHex(array[0]) + digitToHex(array[1]) + digitToHex(array[2]);
        },

        cmyk2rgb: function(c, m, y, k) {
            var r = Math.round(c * (k / 255));
            var g = Math.round(m * (k / 255));
            var b = Math.round(y * (k / 255));

            return [r, g, b];
        },

        init: function(type) {
            switch (type) {
                case 'aco':
                    return new AcoImport();

                case 'ase':
                    return 1;

            }
        }
    };

    return SwatchImporter;

});