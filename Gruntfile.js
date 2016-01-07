'use strict';


module.exports = function(grunt) {
    "use strict";
    var pkg, config;

    pkg = grunt.file.readJSON('package.json');

    config = {
        banner: [
            '/**\n',
            ' * <%= pkg.name %> v<%= pkg.version %> - <%= grunt.template.today("yyyy-mm-dd") %>\n',
            ' * <%= pkg.description %>\n',
            ' *\n',
            ' * Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author %>\n',
            ' * Licensed <%= pkg.license %>\n',
            ' */\n'
        ].join(''),

        sources: [
            'src/geotiff.js',
        ],
        pkg: pkg,
        uglifyFiles: {},
        browserifyFiles: {}
    };

    // setup dynamic filenames
    config.dist = ['dist/', '.js'].join(config.pkg.name);
    config.browserifyFiles[['dist/', '.js'].join(config.pkg.name)] = ["src/main.js"];
    config.uglifyFiles[['dist/', '.min.js'].join(config.pkg.name)] = config.dist;

    // Project configuration.
    grunt.initConfig({
        pkg: config.pkg,
        lint: {
            files: ['gruntfile.js', 'test/*.js', 'src/*']
        },
        clean: {
            dist: ['dist/']
        },
        concat: {
            options: {
                stripBanners: true,
                banner: config.banner
            },
            dist: {
                src: config.sources,
                dest: config.dist
            }
        },
        uglify: {
            options: { mangle: true },
            dist: {
                files: config.uglifyFiles
            }
        },
        jasmine : {
            tests : {
                src : ['dist/', '.js'].join(config.pkg.name),
                options : {
                    specs : 'test/*.spec.js',
                    //template : 'test/grunt.tmpl'
                }
            }
        },
        jshint: {
            options: {
                jshintrc: 'jshint.json'
            },
            all: ["src/*.js"]
        },
        connect: {
            livereload: true,
            options: {
                port: 9000,
                livereload: 35729,
                // change this to '0.0.0.0' to access the server from outside
                hostname: '0.0.0.0'
            },
        },
        watch: {
            livereload: {
                options: {
                    livereload: '<%= connect.options.livereload %>'
                },
                tasks: ['jshint', 'browserify'],
                files: [
                    'test/*.html',
                    'src/*.js',
                    'test/*.spec.js'
                ]
            },

        },
        browserify: {
            dist: {
                files: config.browserifyFiles
            },
        },
        bump: {
            options: {
                pushTo: 'origin'
            }
        },

        karma: {
            all: {
                configFile: 'karma.conf.js'
            }
        },
        jsdoc: {
            dist: {
                src: ['src/*.js', 'test/*.js'],
                options: {
                    destination: 'docs'
                }
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-karma');
    grunt.loadNpmTasks('grunt-jsdoc');

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-bump');

    // Default task.
    grunt.registerTask('default', ['jshint', 'clean', 'browserify', 'uglify']);

    grunt.registerTask('serve', ['jshint', 'browserify', 'connect:livereload', 'watch']);

    grunt.registerTask('test', ['jshint', 'karma']);
};
