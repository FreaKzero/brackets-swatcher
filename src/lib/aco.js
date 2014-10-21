/*jslint vars: true, plusplus: true, nomen: true, devel: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */
define(function (require, exports, module) {

    var aco = {

        version: 0,
        colnum: 0,
        colors: [],
        
        /*
            Reads Version and Colorsum of the Palette
            1 = Version of Palette
            3 = Colorsum 
        */
        readHead: function (array) {
            aco.version = array[1];
            aco.colnum = array[3];
            aco.colors = [];

            if (aco.version < 1 || aco.version > 2) {
                console.log('Unknown ACO Version');
                return false;
            }

            return 1;

        },

        /*
            Colorspace Checker
        */
        checkColorSpace: function (value, type) {
            var cs = {
                'RGB': 0,
                'HSB': 1,
                'CMYK': 2,
                'PANTONE': 3,
                'FOCOLTONE': 4,
                'TRUMATCH': 5,
                'TOYO88': 6,
                'LAB': 7,
                'GREYSCALE': 8,
                'HKS': 10
            };

            if (value === cs[type])
                return true;

            return false;
        },

        /*
        Color Iterates on 10, odd thing: A Color has everytime 2 Codes in it
        Example: 6 (Position for Red) = 200, 7 = sometimes 200, sometimes other value
        This can you see on all Colorcodes
            
        Positions: (x stands for Iterator 10)
            x5      |   COLORSPACE
            x6      |   RED
            x7      |   Strange Red Double ?
            x8      |   GREEN
            x9      |   Strange Green Double ?
            x10     |   BLUE
            x11     |   Strange Blue Double ? 
        */

        getRGB: function (buffer) {
            var pot;
            var data = new Uint8Array(buffer);

            if (!aco.readHead(data)) {
                return false;
            }

            for (var i = 0; i < aco.colnum; i++) {
                pot = i * 10;

                if (aco.checkColorSpace(data[pot + 5], 'RGB')) {
                    aco.colors.push([data[pot + 6], data[pot + 8], data[pot + 10]]);
                } else {
                    console.log('Skipping Color - Not RGB');
                }

            }

            return aco.colors;

        }
    };

    exports.getRGB = aco.getRGB;

});