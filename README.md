# Brackets Swatcher

![Screenshot](https://raw2.github.com/FreaKzero/brackets-swatcher/master/readme.png)

A Brackets.io Extension to load Photoshop ACO Palette Files (RGB only) or parse LESS @variables into the Bottombar for easier use.

## Features
* Load Swatches from Photoshop *.aco File (RGB only)
* Insert loaded Swatches from *.aco File into an LESS/CSS File
* Generate Swatches (Bottombar) from LESS variables
* Leftclick on a Swatch will insert the LESS variable (on *.less Files) or CSS rgba() respectively "background-image:" values (all other Files)
* Rightclick on a Swatch will direct you to the file and line where the LESS variable is defined
* Search for Swatches in Bottombar via LESS variable names
* Support for all LESS color-related Functions, rgba() and Hashs
* Support for backgroundimages (Codeconvention: use Singlequotes)
* Support for @variable:@variable assignments
* Variablename blacklists for specific words in variables (examples: size,height,width)
* Predefined variablename blacklists

### What means "Cant generate Swatches due to an not parseable @var:@var assignment" ?
This was a common Problem with the old filter Function so you were **forced** to use the Blacklists in the Swatcher-Settings Menu.

**Since Swatcher Version 0.3.1 this Problem dont exists anymore - Please update Swatcher via Brackets Extension Manager.**

### Known Bugs
* Background Images filtered fronm @variable:@variable will not parsed

 **Author** [FreaKzero](https://github.com/freakzero) 
 **Extension for** [Brackets.io](http://brackets.io)
