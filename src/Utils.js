/*jslint unused: false, vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, mustache, brackets */

define(function(require, exports) {
    var FileViewController = brackets.getModule("project/FileViewController"),
        EditorManager = brackets.getModule("editor/EditorManager");

    /*
        Inserts String into focused editor
    */
    function insert(currentEditor, str) {
        if (currentEditor) {
            var document = currentEditor.document;

            if (currentEditor.getSelectedText().length > 0) {
                var selection = currentEditor.getSelection();
                document.replaceRange(str, selection.start, selection.end);
            } else {
                var pos = currentEditor.getCursorPos();
                document.replaceRange(str, {
                    line: pos.line,
                    ch: pos.ch
                });
            }
        }
    }

    /*
        Go to a specific Line of a File
    */
    function gotoLine(file, line) {
        FileViewController.addToWorkingSetAndSelect(file, FileViewController.WORKING_SET_VIEW);
        EditorManager.getCurrentFullEditor().setCursorPos(line, 0);
    }


    function digitToHex(N) {
        if (N === null) return "00";
        N = parseInt(N);
        if (N === 0 || isNaN(N)) return "00";
        N = Math.max(0, N);
        N = Math.min(N, 255);
        N = Math.round(N);
        return "0123456789ABCDEF".charAt((N - N % 16) / 16) + "0123456789ABCDEF".charAt(N % 16);
    }

    /*
        Creates Hexadecimal Colorhashes from R, G, B decimal values
    */

    function hashFromRGB(R, G, B) {
        return "#" + digitToHex(R) + digitToHex(G) + digitToHex(B);
    }

    exports.insert = insert;
    exports.gotoLine = gotoLine;
    exports.hashFromRGB = hashFromRGB;

});
