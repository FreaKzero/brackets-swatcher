# Brackets Swatcher

![Screenshot](https://raw2.github.com/FreaKzero/brackets-swatcher/master/readme.png)

Generates a Colorpalette Bottompanel via importing directly from LESS, Imagefiles (dominant colors) or Photoshop Swatches (Aco Files).

## Features

* Visual Swatches from Imported LESS variables
    * Supports LESS color-related Functions, rgba() and Hashs
    * Supports backgroundimages (Codeconvention: use Singlequotes)
    * Supports @variable:@variable assignments

* Colorpalette Import
    * Load Colorpalettes from RGB Photshop Swatch Files (*.aco)
    * Extract Dominant Colors from any Image File via ColorThief (*.jpg, *.gif, *.bmp, *.png)
    * Insert Colors in a CSS or LESS File
    
* Easy Handling
    * Leftclick on a Swatch to Insert LESS Variable or rgba()/background-image values on other Files
    * Rightclick on a Swatch will direct the Cursor to the place where LESS Variable is defined
    * Filter for Swatches in Bottombar via LESS variable names
    
* Blacklists for Variable Names
    * User defined Blacklists
    * Blacklist Sets

### Planned Features / TODO
* Codehint Feature
* Define Custom Shortcuts
* More Blacklist Sets (Foundation, Twitter Bootstrap 2)
* Dark Theme/Bright Theme

### Known Bugs
* Background Images filtered fronm @variable:@variable dont show up 

### What means "Cant generate Swatches due to an not parseable @var:@var assignment" ?
This was a common Problem with the old filter Function so you were **forced** to use the Blacklists in the Swatcher-Settings Menu.

**Since Swatcher Version 0.3.1 this Problem dont exists anymore - Please update Swatcher via Brackets Extension Manager.**

 **Author** [FreaKzero](https://github.com/freakzero)

 **Scripts Used:**[ColorThief](http://lokeshdhakar.com/projects/color-thief)
 
 **Extension for** [Brackets.io](http://brackets.io)
