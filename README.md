# Brackets Swatcher

![Screenshot](https://raw2.github.com/FreaKzero/brackets-swatcher/master/readme.png)

A Brackets.io Extension to load Photoshop ACO Palette Files (RGB only) or parse LESS @variables into the Bottombar for easier use.

## Features
* Load Swatches from Photoshop *.aco File (RGB only)
* Insert loaded Swatches from *.aco File into an LESS/CSS File
* Parse LESS @variables from active Editor
* Leftclick on a Swatch will insert the LESS @variable or HTML Hashcolor
* Rightclick on a Swatch will direct you to the file and line where the @variable is defined
* Filter via @variable names
* Support for Background Images | Code Convention: '../path/to/file.jpg'
* Support for lighten/darken/saturate/desaturate/fadein/fadeout/fade/spin/mix Colorfunctions (also in CSS with Colorhashes)
* Support for @variable:@variable assignments (Blacklist Support)
* Predefined Blacklists

### What means "Cant generate Swatches due to an not parseable @var:@var assignment" ?
Swatcher catches following lines:

    // Colors
    @variable: #hexadecimal
    
    // Images
    @variable: '.*'
    
    // @var:@var assignment
    @variable: @alphanumeric and dash
    
    // Colorfunctions
    @variable: lighten/darken/saturate/desaturate/fadein/fadeout/fade/spin/mix(.*)

An assignment starting with numbers or is not on this list will not be catched from Swatcher

    Example:
    @font-base: 16px; // will not be catched
    @font-size-h1: floor((@font-base * 2.6)); // will not be catched
    @font-content: @font-base; // catched

**@font-content** cant be parsed because the **@font-base** isnt catched by Swatcher, this results into an **LESS error**.
In this case use the word "font" in the Blacklist and all @variables with "font" wouldnt catched by Swatcher.

### Known Bugs
* @variable:@variable problems with Background Images

 **Author** [FreaKzero](https://github.com/freakzero) 
 **Extension for** [Brackets.io](http://brackets.io)
