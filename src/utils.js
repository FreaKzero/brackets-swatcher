/*jslint unused: false, vars: true, plusplus: true, devel: true, nomen: true, indent: 4, maxerr: 50 */
/*global define, $, mustache, brackets */

define(function(require, exports) {
    var FileViewController = brackets.getModule("project/FileViewController"),
        EditorManager = brackets.getModule("editor/EditorManager");

    /*
        Build an Imagepath via Filename and parentpath of current document
    */
    function getBgPath(str, currentDocument) {
        var os = brackets.platform.indexOf('win') ? 'file:///' : '/',
            root = os + currentDocument.file._parentPath;

        return str.slice(0, 1) + root + str.slice(1 + Math.abs(0));
    }

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

    exports.getBgPath = getBgPath;
    exports.insert = insert;
    exports.gotoLine = gotoLine;

});
