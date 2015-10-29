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
                tasks: ['jshint', 'browserify', 'mocha'],
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
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');
    //grunt.loadNpmTasks('grunt-contrib-jasmine');
    grunt.loadNpmTasks('grunt-mocha');

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-bump');

    // Default task.
    grunt.registerTask('default', ['jshint', 'clean', 'browserify', 'mocha', 'uglify']);

    grunt.registerTask('serve', ['jshint', 'browserify', 'connect:livereload', 'watch']);

    // grunt.registerTask('serve', 
    //         'clean:server',
    //         'concurrent:server',
    //         'autoprefixer',
    //         'connect:livereload',
    //         'watch'
    //     ]);
    // });

    grunt.registerTask('boilerplate-check', 'Ensures defaults have been updated.', function() {
        var configured, log;

        configured = true;
        log = grunt.log;
        if (pkg.name === 'project-name') {
            log.writeln('project.json.name has not been configured.');
            configured = false;
        }
        if (pkg.version === '0.0.0') {
            log.writeln('project.json.version has not been configured. Consider 0.0.1');
            configured = false;
        }
        if (pkg.author === 'Your Name <your.name@domain.com>') {
            log.writeln('project.json.author has not been configured.');
            configured = false;
        }
        if (pkg.description === '') {
            log.writeln('project.json.description has not been configured.');
            configured = false;
        }
        if (pkg.contributors[0].name === 'Your Name') {
            log.writeln('project.json.contributors name has not been configured.');
            configured = false;
        }
        if (pkg.contributors[0].email === 'your.name@domain.com') {
            log.writeln('project.json.contributors email has not been configured.');
            configured = false;
        }
        if (pkg.main === null) {
            log.writeln('project.json.main is null. Use grunt --force and find the file in ./dist');
            configured = false;
        }
        if (pkg.repository.url === 'https://github.com/...') {
            log.writeln('project.json.repository.url has not been configured.');
            configured = false;
        }
        if (!pkg.keywords.length) {
            log.writeln('project.json.keywords have not been configured.');
            configured = false;
        }
        return configured;
    });
};
