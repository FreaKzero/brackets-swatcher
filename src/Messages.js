 define(function(require, exports, module) {
     'use strict';
     var Dialogs = brackets.getModule('widgets/Dialogs'),
         DialogTemplate = require('text!tpl/MessageDialog.html'),         

         store = {
             SYSTEM_ERROR: 'Unknown System Error',
             ACO_NOFILE: 'Please focus a Line of a CSS/Preprocessor Document to insert Swatches',
             ACO_NOSUPPORT: 'Importing into this Filetype is not Supported',
             MAIN_WRONGFILE: 'Wrong Filetype - Please Open a LESS or SASS/SCSS File',
             MAIN_NODOCUMENT: 'Please open a CSS or Preprocessor File',
             MAIN_WRONGEXT: 'Swatcher can only parse CSS or Preprocessor Files',
             MAIN_LESSERROR: 'Cant generate Swatches due to an LESS Parsererror<br><code>{errorMessage}</code>',
             MAIN_SASSERROR: 'Cant generate Swatches due to an SASS Parsererror<br><code>{errorMessage}</code>',
             MAIN_NOSWATCHES: 'No parseable Variables Found <br> File is tracked, define Variables and Save Document to generate Swatches',

             DIALOG_WRONGMIME: 'Please use an Adobe Colorswatch File {filetype} to Import Colorpalettes',

             DIALOG_ACO_CANTPARSE: 'Swatcher cant parse any Swatches <br> Please make sure the Swatches are in parseable Colorspaces',
             DIALOG_ACO_PARSESUCCESS: 'Swatcher Found {count} importable Swatches',
         },
         messages = {
             notice: function(key, search, replace) {
                 var head = '<br><div class="swatcher-notice"> <h3>Swatcher Notice</h3> <hr />',
                     foot = '</div>';

                 var msg = this.getMessage(key, search, replace);
                 $('#swatcher-container').empty().hide().append(head + msg + foot).fadeIn();
             },

             error: function(key, search, replace) {                 

                 var head = '<br><div class="swatcher-error"> <h3>Swatcher Error</h3> <hr />',
                     foot = '</div>';

                 var msg = this.getMessage(key, search, replace);
                 $('#swatcher-container').empty().hide().append(head + msg + foot).fadeIn();
             },

             dialog: function(key, search, replace) {
                 var msg = {
                     errorMessage: this.getMessage(key, search, replace)
                 },
                     compiledTemplate = Mustache.render(DialogTemplate, msg),
                     dialog = Dialogs.showModalDialogUsingTemplate(compiledTemplate);
             },

             getMessage: function(key, search, replace) {
                 var output;
                 store[key] ? output = store[key] : output = store.SYSTEM_ERROR;
                 return this.prepare(output, search, replace);
             },

             prepare: function(tpl, search, replace) {
                 if (!replace) {
                     return tpl;
                 } else {
                     return tpl.replace('{' + search + '}', replace);
                 }
             }
         };

     module.exports = messages;
 });
