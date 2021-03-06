module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            css: {
                src: [
                    'app/public/styles/*.css'
                ],
                dest: 'dist/checkinApp.css'
            },
            js: {
                src: [
                    'app/config/*.js',
                    'app/controllers/*.js',
                    'app/models/*.js',
                    'app/public/*.js'
                ],
                dest: 'dist/checkinApp.js'
            }
        },
        cssmin: {
            css: {
                src: 'dist/checkinApp.css',
                dest: 'dist/checkinApp.min.css'
            }
        },
        uglify: {
            js: {
                src: 'dist/checkinApp.js',
                dest: 'dist/checkinApp.min.js'
            }
        },
        watch: {
            files: ['app/*'],
            tasks: ['concat', 'cssmin', 'uglify']
        },
        ngtemplates: {
            app: {
                src: ['app/public/partials/**.html'],
                dest: 'app/scripts/templates.js'
            },
            options: {
                module: 'checkInApp'
            }
        }
    });
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.registerTask('default', ['concat:css', 'cssmin:css', 'concat:js', 'uglify:js']);
};