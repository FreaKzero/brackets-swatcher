module.exports = function(grunt) {
    // Project configuration.

    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        watch: {
            lesswatch: {
                files: ['styles/src/**/*.less'],
                tasks: ['less:main', 'cssmin:main']
            }
        },

        less: {
            main: {
                files: {
                    'styles/swatcher.css': 'styles/src/swatcher.less'
                }
            }
        },
        cssmin: {
            main: {
                files: [{
                    expand: true,
                    cwd: 'styles',
                    src: ['*.css', '!*.min.css'],
                    dest: 'styles',
                    ext: '.min.css'
                }]
            }
        }
    });

    // Plugins  
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
};