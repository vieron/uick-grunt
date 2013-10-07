;(function(root) {

    var fs   = require('fs')
        sass = require('component-sass'),
        _ = require('underscore');


    var g = {};

    g.gruntfile = function(grunt) {
        var pkg = grunt.file.readJSON('package.json');
        var component = {};
        component[pkg.name] = {
            output: './build/',
            styles: true,
            scripts: true,
            verbose: true,
            configure: function(builder) {
                builder.use(sass);
            }
        };

        component[pkg.name + '-standalone'] =  {
            output: './build/',
            styles: false,
            scripts: true,
            verbose: true,
            noRequire: true,
            standalone: true
        };


        // Project configuration.
        grunt.initConfig({
            pkg: pkg,
            components: grunt.file.readJSON('component.json'),
            meta: {
                banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
                        '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
                        '<%= pkg.homepage ? "* " + pkg.homepage : "" %>\n' +
                        '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                        ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n\n',

                minibanner: '/*! <%= pkg.title || pkg.name %> - v<%= pkg.version %> - ' +
                            '<%= grunt.template.today("yyyy-mm-dd") %> - ' +
                            '<%= pkg.homepage ? "* " + pkg.homepage + " - " : "" %>' +
                            'Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
                            ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */ '
            },
            uglify: {
              options: {
                  banner: '<%= meta.minibanner %>\n'
              },
              min: {
                  files: {
                    'build/<%= pkg.name %>.min.js': ['build/<%= pkg.name %>.js'],
                    'build/<%= pkg.name %>-standalone.min.js': ['build/<%= pkg.name %>-standalone.js']
                  }
              }
            },
            cssmin: {
              compress: {
                  options: {
                      keepSpecialComments: 0,
                      banner: '<%= meta.minibanner %>\n'
                  },
                  files: {
                      "build/<%= pkg.name %>.min.css": ["build/<%= pkg.name %>.css"]
                  }
              }
            },

            component_build: component,

            concat: {
                css:{
                    options: {
                        separator: ';',
                        banner: "<%= meta.banner %>\n"
                    },
                    files: {
                        'build/<%= pkg.name %>.css': ['build/<%= pkg.name %>.css']
                    },
                },
                component:{
                    options: {
                        separator: ';',
                        banner: "<%= meta.banner %>\n"
                    },
                    files: {
                        'build/<%= pkg.name %>.js': ['build/<%= pkg.name %>.js']
                    },
                },
                standalone: {
                    options: {
                        separator: ';',
                        banner: "<%= meta.banner %>\n",
                        // banner: "Uick.register([\"<%= _.map(_.keys(components.dependencies), function(c){ return c.split('/')[1].replace('ui-', ''); }).join('\", \"') %>\"]);\n",
                        process: function(src, filepath) {
                            return src + "\n\nuick.register([\"" + _.map(_.keys(grunt.config('components').dependencies), function(c){ return c.split('/')[1].replace('ui-', ''); }).join('\", \"') + "\"]);\n"
                        }
                    },
                    files: {
                        'build/<%= pkg.name %>-standalone.js': ['build/<%= pkg.name %>-standalone.js']
                    },
                },
            },

            mocha: {
                uick: {
                    src: ['tests/index.html'],
                    options: {
                        mocha: {
                            ignoreLeaks: false
                        },
                        reporter: 'Spec',
                        // Indicates whether 'mocha.run()' should be executed in 'bridge.js'
                        run: true
                    }
                }
            },

            jsduck: {
                main: {
                    // source paths with your code
                    src: [
                        'index.js'
                    ],

                    // docs output dir
                    dest: 'docs',

                    // extra options
                    options: {
                        'title': '<%= pkg.name %>',
                        'builtin-classes': false,
                        'warnings': ['-no_doc', '-dup_member', '-link_ambiguous'],
                        'external': ['XMLHttpRequest']
                    }
                }
            },

            bump: {
              options: {
                files: ['package.json', 'component.json'],
                updateConfigs: ['pkg',  'components'],
                commit: true,
                commitMessage: 'Release v%VERSION%',
                commitFiles: ['package.json', 'component.json', 'CHANGELOG.md', 'build/'], // '-a' for all files
                createTag: true,
                tagName: 'v%VERSION%',
                tagMessage: 'Version %VERSION%',
                push: true,
                pushTo: 'origin',
                gitDescribeOptions: '--tags --always --abbrev=1 --dirty=-d' // options to use with '$ git describe'
              }
            },

            changelog: {
                options: {
                    dest: 'CHANGELOG.md'
                }
            },

            watch: {
                files: ['index.js', 'templates/*.html', 'index.scss', 'Gruntfile.js'],
                tasks: ['component_build', 'concat', 'uglify', 'cssmin']
            }
        });

        // Load the plugin that provides the "uglify" task.
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-contrib-watch');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-contrib-concat');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-contrib-uglify');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-contrib-cssmin');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-component-build');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-mocha');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-jsduck');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-bump');
        grunt.loadNpmTasks('uick-grunt/node_modules/grunt-conventional-changelog');

        // Default task(s).
        grunt.registerTask('default', ['component_build', 'concat', 'uglify', 'cssmin']);
        grunt.registerTask('build', ['default']);
        grunt.registerTask('test', ['mocha']);
        grunt.registerTask('docs', ['jsduck']);
        grunt.registerTask('release', ['build', 'test', 'bump-only:patch', 'build', 'docs', 'changelog', 'bump-commit']);
        grunt.registerTask('release:minor', ['build', 'test', 'bump-only:minor', 'build', 'docs', 'changelog', 'bump-commit']);
        grunt.registerTask('release:major', ['build', 'test', 'bump-only:major', 'build', 'docs', 'changelog', 'bump-commit']);
        grunt.registerTask('release:git', ['build', 'test', 'bump-only:git', 'build', 'docs', 'changelog', 'bump-commit']);
    };




    // AMD / RequireJS
    if (typeof define !== 'undefined' && define.amd) {
        define([], function () {
            return g;
        });
    }
    // Node.js
    else if (typeof module !== 'undefined' && module.exports) {
        module.exports = g;
    }

})(this);