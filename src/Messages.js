 define(function (require, exports, module) {
     "use strict";
     var Dialogs = brackets.getModule("widgets/Dialogs"),
         DialogTemplate = require("text!../html/MessageDialog.html"),

         store = {
             SYSTEM_ERROR: 'Unknown System Error',
             ACO_NOFILE: 'Please focus a Line of a CSS/LESS Document to insert Swatches',
             ACO_WRONGFILE: 'You can only insert Swatches on a LESS or CSS Document',             
             MAIN_NODOCUMENT: 'Please focus an editor window',
             MAIN_WRONGEXT: 'Swatcher can only parse CSS or LESS Files',             
             MAIN_LESSERROR: 'Cant generate Swatches due to an LESS Parsererror<br><br>LESS ERRORMESSAGE: </b><u>{errorMessage}</u>',

             DIALOG_WRONGMIME: '<strong style="color:red">Please use an {filetype} File to Import Colorpalettes</strong>',             
             
             DIALOG_IMG_CANTPARSE: '<strong style="color:red">Cant extract any Colors from Image</strong>',
             DIALOG_IMG_PARSESUCCESS: '<strong style="color:green">Successfully extracted {count} Colors</strong>',
             
             DIALOG_ACO_CANTPARSE: '<strong style="color:red">Swatcher cant parse any Swatches <br> Please make sure the Swatches are in RGB Format</strong>',
             DIALOG_ACO_PARSESUCCESS: '<strong style="color:green">Swatcher Found {count} parseable RGB Swatches</strong>',
         },
         messages = {
             panel: function (key, search, replace) {
                 var head = '<br><div class="swatcher-error"> <h3>Swatcher Error</h3> <hr />',
                     foot = '</div>';

                 var msg = this.getMessage(key, search, replace);
                 $('#swatcher-container').empty().append(head + msg + foot);
             },

             dialog: function (key, search, replace) {
                 var msg = { errorMessage : this.getMessage(key, search, replace) },
                     compiledTemplate = Mustache.render(DialogTemplate, msg),
                     dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);
             },

             getMessage: function (key, search, replace) {
                 var output;
                 store[key] ? output = store[key] : output = store.SYSTEM_ERROR;
                 return this.prepare(output, search, replace);
             },

             prepare: function (tpl, search, replace) {
                 if (!replace) {
                     return tpl;
                 } else {
                     return tpl.replace("{" + search + "}", replace);
                 }
             }
         };

     module.exports = messages;
 });