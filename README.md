# Brackets Swatcher

Generates Colorpalette Bottompanel/Codehints via importing directly from LESS, Imagefiles (dominant colors) or Photoshop Swatches (Aco Files).

![Screenshot](https://raw2.github.com/FreaKzero/brackets-swatcher/master/readme.png)

## Features

* Visual Swatches from Imported LESS variables
    * Track your Main LESS Variables File, Colorswatches and Codehints will be updated on save! (Tested with Bootstrap 3.1.1 / uikit 2.6.0)        
    * Supports LESS color-related Functions, rgba() and Hashs
    * Supports backgroundimages (Codeconvention: use Singlequotes)
    * Supports @variable:@variable assignments
    * Configurable Swatch sizes

* Colorpalette Import
    * Load Colorpalettes from RGB Photshop Swatch Files (*.aco)
    * Extract Dominant Colors from any Image File via ColorThief (*.jpg, *.gif, *.bmp, *.png)    
    
* Easy Handling
    * Leftclick on a Swatch to Insert LESS Variable or rgba()/background-image values on other Files
    * Rightclick on a Swatch will direct the Cursor to the place where LESS Variable is defined
    * Filter for Swatches in Bottombar via LESS variable names
    * Codehint Support for LESS Files (Triggerchar: @)


 **Author** FreaKzero  
 [Twitter](https://twitter.com/freakzerodotcom) [G+](https://plus.google.com/+FreaKzero)  

 **Thanks to:**  
Lokesh Dhakar [ColorThief](http://lokeshdhakar.com/projects/color-thief)  
Amin Ullah Khan [GitHub](https://github.com/sprintr)  
Alexander Hochreiter for Testing on Mac/Linux Systems
