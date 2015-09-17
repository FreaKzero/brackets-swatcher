# Brackets Swatcher  

[![Join the chat at https://gitter.im/FreaKzero/brackets-swatcher](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/FreaKzero/brackets-swatcher?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)
Generates CodeHints/Colorpalettes from importing via LESS/SASS Files, Images or Adobe Swatchfiles (*.aco, *.ase)

![Filter](https://raw.githubusercontent.com/FreaKzero/brackets-swatcher/master/readme/readme-filter.gif)

![Variables](https://raw.githubusercontent.com/FreaKzero/brackets-swatcher/master/readme/readme-variables.gif)

![ColorPicker](https://raw.githubusercontent.com/FreaKzero/brackets-swatcher/master/readme/readme-picker.gif)

##Restrictions  
* use Singlequotes for Paths, doublequotes for Font-Families / CSS contents  
* No Support for BASE64 encoded Images  

##Features  
* Support for SASS/SCSS/LESS Files  
* Support for all color-related functions, rgba() and Hashs  
* Configurable Swatch sizes  
* Codehints  
* Dark and Brighttheme Support  
* Filter/Search via Variablename or the Variablevalue  

* Define an Assetpath for Images  
	* Change Assetfolder once a Session via Dialog  
	* //swatcher-assets: "relative/path/from/project" annotation in the first Line of your File  

* Bottompanel Colorpalette  
    * Leftclick to insert Variable or Value  
    * Rightclick for jumping to Definition  
    * Updates on Filesave  
    
* Colorpalette Import  
    * Import Colorpalettes from Photshop Swatch Files (*.aco)  
    * Import Colorpalettes from Adobe Swatch Exchange Files (*.ase)  
    * Importer converts colors from CMYK, HSV and RGB values, the Importer will give you a warning when CMYK is converted
    * Generate Colorpalettes with an Image Colorpicker  

* Colorpicker  
	* Load Images directly from Disc  
	* Load Imagedata/Printscreendata directly from Clipboard  
	* Scroll for Zoom, rightclick to pan Image  
    * CTRL + Click picks color directly into List
    * Rightclick on the "Colorpreview/Add" copies Color into Clipboard

##TODO/Known Bugs
  
* Stylus Support  
* Better Support for grouped ASE Swatches

**Author** FreaKzero  
 [Twitter](https://twitter.com/freakzerodotcom) [G+](https://plus.google.com/+FreaKzero) [Web] (http://www.freakzero.com)
 
**Thanks to:**  
Amin Ullah Khan [GitHub](https://github.com/sprintr)  
Alexander Hochreiter for Testing on Mac/Linux Systems
