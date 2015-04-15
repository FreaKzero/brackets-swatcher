# Brackets Swatcher  
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

##TODO/Known Bugs
* Colorpicker +/- Zoom center on zoomed Position  
* Stylus Support  
* Better Support for grouped ASE Swatches

**Author** FreaKzero  
 [Twitter](https://twitter.com/freakzerodotcom) [G+](https://plus.google.com/+FreaKzero)  
 
**Thanks to:** 
Amin Ullah Khan [GitHub](https://github.com/sprintr)  
Alexander Hochreiter for Testing on Mac/Linux Systems
