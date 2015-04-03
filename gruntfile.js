module.exports = function(grunt) {
    // Project configuration.
        
    var buildPath = 'C:/Users/FreaK/AppData/Roaming/Brackets/extensions/user/brackets.swatcher';
    var packPath = 'build/';

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
        },

        copy: {
            build: {
                src: ['src/**', 'styles/*.min.css', 'tpl/**', 'main.js', 'package.json', 'modes.js','styles/images/**'],
                dest: buildPath,
                expand: true
            },
        },

        compress: {
            main: {
                options: {
                    archive: packPath+'<%= pkg.name %>-<%= pkg.version %>.zip'
                },

                files: [{
                        src: ['src/**', 'styles/*.min.css', 'tpl/**', 'main.js', 'package.json', 'modes.js','styles/images/**'],
                        dest: '/'
                    }
                ]
            }
        }
    });

    // Plugins
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-contrib-compress');
    grunt.loadNpmTasks('grunt-contrib-copy');

    grunt.registerTask('pack', ['less', 'cssmin', 'compress']);
    grunt.registerTask('build', ['less', 'cssmin', 'copy']);
};