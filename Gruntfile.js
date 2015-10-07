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
        uglifyFiles: {}
    };

    // setup dynamic filenames
    config.versioned = [config.pkg.name, config.pkg.version].join('-');
    config.dist = ['dist/', '.js'].join(config.versioned);
    config.uglifyFiles[['dist/', '.min.js'].join(config.versioned)] = config.dist;

    // Project configuration.
    grunt.initConfig({
        pkg: config.pkg,
        lint: {
            files: ['gruntfile.js', 'test/*.js', 'src/*']
        },
        clean: {
            dist : ['dist/']
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
        // jasmine : {
        //     tests : {
        //         src : ['dist/', '.min.js'].join(config.versioned),
        //         options : {
        //             specs : 'test/spec/*.spec.js',
        //             template : 'test/grunt.tmpl'
        //         }
        //     }
        // },
        jshint: {
            options: {
                jshintrc: 'jshint.json'
            },
            all: ["src/geotiff.js"]//config.sources
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
                files: [
                    'test/*.html',
                    'src/*.js',
                    //'<%= yeoman.app %>/images/{,*/}*.{gif,jpeg,jpg,png,svg,webp}'
                ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-jshint');

    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-watch');

    // Default task.
    grunt.registerTask('default', ['jshint', 'clean', 'concat', 'uglify']);

    grunt.registerTask('serve', ['jshint', 'clean', 'concat', 'uglify', 'connect:livereload', 'watch']);

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


// module.exports = function (grunt) {
//     // show elapsed time at the end
//     require('time-grunt')(grunt);
//     // load all grunt tasks
//     require('load-grunt-tasks')(grunt);

//     grunt.loadNpmTasks('grunt-release');
//     grunt.loadNpmTasks('grunt-contrib-compress');
//     grunt.loadNpmTasks('grunt-bump');

//     grunt.initConfig({
//         // configurable paths
//         watch: {
//             livereload: {
//                 options: {
//                     livereload: '<%= connect.options.livereload %>'
//                 },
//                 files: [
//                     '<%= yeoman.app %>/*.html',
//                     '.tmp/styles/{,*/}*.css',
//                     '{.tmp,<%= yeoman.app %>}/{,*/}*.js',
//                     '<%= yeoman.app %>/images/{,*/}*.{gif,jpeg,jpg,png,svg,webp}'
//                 ]
//             }
//         },
//         connect: {
//             options: {
//                 port: 9000,
//                 livereload: 35729,
//                 // change this to '0.0.0.0' to access the server from outside
//                 hostname: '0.0.0.0'
//             },
//             livereload: {
//                 options: {
//                     open: true,
//                     base: [
//                         '.tmp',
//                         '<%= yeoman.app %>'
//                     ]
//                 }
//             },
//             test: {
//                 options: {
//                     base: [
//                         '.tmp',
//                         'test',
//                         '<%= yeoman.app %>'
//                     ]
//                 }
//             },
//             dist: {
//                 options: {
//                     open: true,
//                     base: '<%= yeoman.dist %>',
//                     livereload: false
//                 }
//             }
//         },
//         clean: {
//             dist: {
//                 files: [{
//                     dot: true,
//                     src: [
//                         '.tmp',
//                         'dist/*',
//                         '!dist/.git*'
//                     ]
//                 }]
//             },
//             server: '.tmp'
//         },
//         jshint: {
//             options: {
//                 jshintrc: '.jshintrc',
//                 reporter: require('jshint-stylish')
//             },
//             all: [
//                 'Gruntfile.js'
//             ]
//         },
//         mocha: {
//             all: {
//                 options: {
//                     run: true,
//                     urls: ['http://<%= connect.test.options.hostname %>:<%= connect.test.options.port %>/index.html']
//                 }
//             }
//         },
//         // not used since Uglify task does concat,
//         // but still available if needed
//         /*concat: {
//             dist: {}
//         },*/
//         // not enabled since usemin task does concat and uglify
//         // check index.html to edit your build targets
//         // enable this task if you prefer defining your build targets here
//         uglify: {
//             options: {
//                 mangle: {
//                     except: ['$', 'd3'],
//                     toplevel: false
//                 }
//             }
//         },
//         'bower-install': {
//             app: {
//                 html: '<%= yeoman.app %>/index.html',
//                 ignorePath: '<%= yeoman.app %>/'
//             }
//         },
//         rev: {
//             dist: {
//                 files: {
//                     src: [
//                         '<%= yeoman.dist %>/scripts/{,*/}*.js',
//                         '<%= yeoman.dist %>/styles/{,*/}*.css',
//                         '<%= yeoman.dist %>/images/{,*/}*.{gif,jpeg,jpg,png,webp}',
//                         '<%= yeoman.dist %>/styles/fonts/{,*/}*.*'
//                     ]
//                 }
//             }
//         },
//         useminPrepare: {
//             options: {
//                 dest: '<%= yeoman.dist %>'
//             },
//             html: '<%= yeoman.app %>/index.html'
//         },
//         usemin: {
//             options: {
//                 assetsDirs: ['<%= yeoman.dist %>']
//             },
//             html: ['<%= yeoman.dist %>/{,*/}*.html'],
//             //css: ['<%= yeoman.dist %>/styles/{,*/}*.css']
//         },
//         imagemin: {
//             dist: {
//                 files: [{
//                     expand: true,
//                     cwd: '<%= yeoman.app %>/images',
//                     src: '{,*/}*.{gif,jpeg,jpg,png}',
//                     dest: '<%= yeoman.dist %>/images'
//                 }]
//             }
//         },
//         svgmin: {
//             dist: {
//                 files: [{
//                     expand: true,
//                     cwd: '<%= yeoman.app %>/images',
//                     src: '{,*/}*.svg',
//                     dest: '<%= yeoman.dist %>/images'
//                 }]
//             }
//         },
//         cssmin: {
//             // This task is pre-configured if you do not wish to use Usemin
//             // blocks for your CSS. By default, the Usemin block from your
//             // `index.html` will take care of minification, e.g.
//             //
//             //     <!-- build:css({.tmp,app}) styles/main.css -->
//             //
//             // dist: {
//             //     files: {
//             //         '<%= yeoman.dist %>/styles/main.css': [
//             //             '.tmp/styles/{,*/}*.css',
//             //             '<%= yeoman.app %>/styles/{,*/}*.css'
//             //         ]
//             //     }
//             // }
//         },
//         htmlmin: {
//             dist: {
//                 options: {
//                     /*removeCommentsFromCDATA: true,
//                     // https://github.com/yeoman/grunt-usemin/issues/44
//                     //collapseWhitespace: true,
//                     collapseBooleanAttributes: true,
//                     removeAttributeQuotes: true,
//                     removeRedundantAttributes: true,
//                     useShortDoctype: true,
//                     removeEmptyAttributes: true,
//                     removeOptionalTags: true*/
//                 },
//                 files: [{
//                     expand: true,
//                     cwd: '<%= yeoman.app %>',
//                     src: '*.html',
//                     dest: '<%= yeoman.dist %>'
//                 }]
//             }
//         },
//         // Put files not handled in other tasks here
//         copy: {
//             dist: {
//                 files: [{
//                     expand: true,
//                     dot: true,
//                     cwd: '<%= yeoman.app %>',
//                     dest: '<%= yeoman.dist %>',
//                     src: [
//                         '*.{ico,png,txt}',
//                         '.htaccess',
//                         'images/{,*/}*.{webp,gif}',
//                         'styles/fonts/{,*/}*.*',
//                     ]
//                 }]
//             },
//             styles: {
//                 expand: true,
//                 dot: true,
//                 cwd: '<%= yeoman.app %>/styles',
//                 dest: '.tmp/styles/',
//                 src: '{,*/}*.css'
//             }
//         },
//         concurrent: {
//             server: [
//                 'compass',
//                 'copy:styles'
//             ],
//             test: [
//                 'copy:styles'
//             ],
//             dist: [
//                 'compass',
//                 'copy:styles',
//                 'imagemin',
//                 'svgmin',
//                 'htmlmin'
//             ]
//         },
//         release: {
//             options: {
//                 push: false, //default: true
//                 pushTags: false, //default: true
//                 npm: false, //default: true
//                 tagName: 'v<%= version %>', //default: '<%= version %>'
//                 tagMessage: 'Tagging version v<%= version %>', //default: 'Version <%= version %>',
//                 commitMessage: 'Release v<%= version %>', //default: 'release <%= version %>'
//                 github: false
//             }
//         },
//         bump: {
//             options: {
//                 files: ['package.json', 'bower.json'],
//                 updateConfigs: [],
//                 commit: true,
//                 commitMessage: 'Release v%VERSION%',
//                 commitFiles: ['package.json', 'bower.json'],
//                 createTag: true,
//                 tagName: 'v%VERSION%',
//                 tagMessage: 'Version %VERSION%',
//                 push: true,
//                 pushTo: 'git@github.com:santilland/plotty.git',
//                 gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d',
//                 globalReplace: false,
//                 prereleaseName: false,
//                 regExp: false
//             }
//         },
//         compress: {
//             release: {
//                 options: {
//                     archive: 'release/plotty.zip'
//                 },
//                 files: [
//                     { expand: true, cwd: '<%= yeoman.dist %>/scripts', src: ['*.min.js'], dest: 'plotty' },
//                     { expand: true, cwd: '<%= yeoman.dist %>/styles', src: ['*.min.css'], dest: 'plotty' },
//                     { expand: true, src: ['README.md'], dest: 'plotty' }
//                 ]
//             }
//         }

//     });

//     grunt.registerTask('serve', function (target) {
//         if (target === 'dist') {
//             return grunt.task.run(['build', 'connect:dist:keepalive']);
//         }

//         grunt.task.run([
//             'clean:server',
//             'concurrent:server',
//             'autoprefixer',
//             'connect:livereload',
//             'watch'
//         ]);
//     });

//     grunt.registerTask('server', function () {
//       grunt.log.warn('The `server` task has been deprecated. Use `grunt serve` to start a server.');
//       grunt.task.run(['serve']);
//     });


//     grunt.registerTask('build', [
//         'clean:dist',
//         'useminPrepare',
//         'concurrent:dist',
//         'autoprefixer',
//         'concat',
//         'cssmin',
//         'uglify',
//         'copy:dist',
//         'usemin'
//     ]);


//     grunt.registerTask('createrelease', [
//         'clean:dist',
//         'build',
//         'compress:release',
//         'release'
//     ]);

//     grunt.registerTask('default', [
//         'jshint',
//         'test',
//         'build'
//     ]);
// };
