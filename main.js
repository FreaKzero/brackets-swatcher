/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global define, $, brackets, FileReader, Mustache */

define(function (require, exports, module) {
    "use strict";

    var panelHtml = require("text!html/panel.html"),
        swatchHtml = require("text!html/colors.html"),
        acoHtml = require("text!html/aco.html"),
        loadacoHtml = require("text!html/loadaco.html"),

        Aco = require("thirdparty/aco"),
        AppInit = brackets.getModule('utils/AppInit'),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        Menus = brackets.getModule("command/Menus"),
        CommandManager = brackets.getModule("command/CommandManager"),
        PanelManager = brackets.getModule("view/PanelManager"),
        EditorManager = brackets.getModule("editor/EditorManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        FileViewController = brackets.getModule("project/FileViewController"),

        app = {
            ID: "swatcher.run",
            PANEL: "#swatcher",
            CSS: "swatcher.css",
            MENULABEL: "Swatcher",
            MENULOCATION: Menus.AppMenuBar.VIEW_MENU
        },

        actualFile, loaded = false;

    function _getBgPath(s, cdoc) {
        var os = brackets.platform.indexOf('win') ? 'file:///' : '/',
            root = os + cdoc.file._parentPath;

        return s.slice(0, 1) + root + s.slice(1 + Math.abs(0));
    }

    function _handleActive() {
        if (!CommandManager.get(app.ID).getChecked()) {
            CommandManager.get(app.ID).setChecked(true);
            $(app.PANEL).show();
            EditorManager.resizeEditor();
        } else {
            CommandManager.get(app.ID).setChecked(false);
            $(app.PANEL).hide();
            EditorManager.resizeEditor();
            EditorManager.focusEditor();
        }
    }

    function _insert(editor, str) {
        if (editor) {
            var document = editor.document;

            if (editor.getSelectedText().length > 0) {
                var selection = editor.getSelection();
                document.replaceRange(str, selection.start, selection.end);
            } else {
                var pos = editor.getCursorPos();
                document.replaceRange(str, {
                    line: pos.line,
                    ch: pos.ch
                });
            }
        }
    }

    function getSwatchData(cdoc) {
        if (cdoc !== null && typeof (cdoc) !== 'string') {
            actualFile = cdoc.file.fullPath;
            var label, hex, f, e, s, r = [];
            var documentText = cdoc.getText();
            var documentLines = StringUtils.getLines(documentText);

            // (alnum - _)(:)(#HEX) OR (alnum - _)(:)('all chars')
            // @myvar:#FF0000; OR @myvar:'img/mypic.png';
            var regex = /@[0-9a-z\-_]{3,25}\s*:\s*('.*'|#[0-9a-f]{3,6})/ig;

            while ((f = regex.exec(documentText)) !== null) {

                e = f[0].split(":");
                e[0] = $.trim(e[0]);
                e[1] = $.trim(e[1]);

                if (e[1][0] === '#') {
                    s = 'background-color:' + e[1];
                    hex = e[1];
                    label = hex;
                } else {
                    s = "background: url(" + _getBgPath(e[1], cdoc) + ") no-repeat center center #252525;background-size: 90%;";
                    hex = 'background-image: url(' + e[1] + ');';
                    label = '[img]';
                }

                r.push({
                    line: StringUtils.offsetToLineNum(documentLines, f.index),
                    less: e[0],
                    hex: hex,
                    label: label,
                    style: s
                });
            }
            return {
                wrap: r
            };
        }
    }

    function renderSwatches(editor) {
        if (editor) {
            var data = getSwatchData(editor.document),
                html = Mustache.render(swatchHtml, data);

            $('#swatcher-container').empty().append(html);
        }
    }

    function renderAco(data) {
        var name, str = "",
            r = [];

        data.forEach(function (obj, i) {
            if (obj.hash) {
                name = '@color' + i;
                str += name + ":" + obj.hash + "; \n";
                r.push({
                    less: '@color' + i,
                    hex: obj.hash,
                    style: 'background-color:' + obj.hash
                });
            }
        });

        var html = Mustache.render(acoHtml, {
            wrap: r
        });

        $('#swatcher-container').empty().append(html);
    }

    function insertFromAco(editor) {
        if (editor) {
            var ext = editor.document.language._mode,
                str = "";

            $('#swatcher-prepare tr').each(function () {
                if ($(this).data('hex')) {
                    str += $(this).find('input').val() + ":" + $(this).data('hex') + "; \n";
                }
            });

            switch (ext) {
            case 'css':
                str = '/* Generated by Brackets Swatcher' + "\n" + str + '*/';
                break;

            case 'less':
                str = '/* Generated by Brackets Swatcher */' + "\n" + str;
                break;

            default:
                alert("You can only Insert Swatches on a LESS or CSS Document");
                return false;
            }

            _insert(editor, str);
            renderSwatches(editor);
        } else {
            alert("Please Focus a Line of a CSS/LESS Document to Insert Swatches");
        }
    }

    function gotoLine(file, line) {
        FileViewController.addToWorkingSetAndSelect(file, FileViewController.WORKING_SET_VIEW);
        EditorManager.getCurrentFullEditor().setCursorPos(line, 0);
    }

    function registerListeners(instance) {
        instance.on('click', '.swatcher-color', function () {
            var insert, editor = EditorManager.getFocusedEditor(),
                ext = editor.document.language._mode;
            if (ext === 'less') {
                insert = $(this).data("less");
            } else {
                insert = $(this).data("hex");
            }
            _insert(editor, insert);
        });

        instance.on('click', '.swatcher-parse', function () {
            var editor = EditorManager.getFocusedEditor(),
                ext = editor.document.language._mode;

            if (ext === 'css' || ext === 'less') {
                renderSwatches(editor);
            } else {
                alert('Please use a CSS or LESS File to parse Swatches');
                return false;
            }
        });

        instance.on('click', '.swatcher-label', function () {
            gotoLine(actualFile, $(this).data("line"));
        });

        instance.on('click', '.close', function () {
            _handleActive();
        });

        instance.on('click', '.swatcher-toggle', function () {
            var compiledTemplate = Mustache.render(loadacoHtml),
                dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate),
                $dialog = dialog.getElement(),
                palette;

            $dialog.on('change', '#swatcher-file', function () {
                var fr = new FileReader();
                fr.onloadend = function () {
                    palette = Aco.getPalette(this.result);
                    if (palette.length > 0) {
                        $dialog.find('.swatcher-file-status').html('Swatcher Found <strong>' + palette.length + '</strong> parseable RGB Swatches');
                        $dialog.find('button.primary').attr('disabled', false);
                    } else {
                        $dialog.find('.swatcher-file-status').html('<strong style="color:red">Swatcher cant parse any Swatches <br> Please make sure the Swatches are in RGB Format</strong>');
                        $dialog.find('button.primary').attr('disabled', 'disabled');
                    }

                };
                fr.readAsBinaryString(this.files[0]);
            });

            $dialog.find("button.primary").on("click", function () {
                renderAco(palette);
                $('.swatcher-insless').show();
            });
        });

        instance.on('click', '.swatcher-acoInsert', function () {
            insertFromAco(EditorManager.getFocusedEditor());
        });

        instance.on('click', '.swatcher-acoCancel', function () {
            $('#swatcher-container').empty();
        });

        instance.on('keyup', '.filter', function () {
            if ($(this).val().length > 2) {
                $('.swatcher-colorwrap').hide().find('div[data-less*="' + $(this).val() + '"]').parent().show();
            } else {
                $('.swatcher-colorwrap').show();
            }
        });

        loaded = true;
    }

    var _init = function () {
        ExtensionUtils.loadStyleSheet(module, app.CSS);

        var $swatcher = $(Mustache.render(panelHtml));

        if (!loaded) {
            registerListeners($swatcher);
        }

        PanelManager.createBottomPanel(app.ID, $swatcher, 200);
        _handleActive();
    };

    AppInit.appReady(function () {
        var m = Menus.getMenu(app.MENULOCATION);
        CommandManager.register(app.MENULABEL, app.ID, _init);
        m.addMenuItem(app.ID, 'F11');
    });
});