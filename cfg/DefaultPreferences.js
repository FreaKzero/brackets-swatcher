 define(function (require, exports, module) {
     "use strict";

     // Default preferences are different for platforms
     var DefaultPreferences = {
         blacklist: 'font,height,width,size,radius,min,max,margin,padding',
         animation: 'checked'
     };
     
     module.exports = DefaultPreferences;
 });