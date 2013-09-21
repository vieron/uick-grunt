(function(root) {

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
            build: {
              src: 'build/<%= pkg.name %>.js',
              dest: 'build/<%= pkg.name %>.min.js'
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
                banner: "<%= meta.minibanner %>\n"
              },
              files: {
                'build/<%= pkg.name %>.css': ['build/<%= pkg.name %>.css']
              },
            },
            component:{
              options: {
                separator: ';',
                banner: "<%= meta.minibanner %>\n"
              },
              files: {
                'build/<%= pkg.name %>.js': ['build/<%= pkg.name %>.js']
              },
            },
            standalone: {
              options: {
                separator: ';',
                banner: "<%= meta.minibanner %>\n",
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

          watch: {
            files: ['index.js', 'templates/*.html', 'index.scss', 'Gruntfile.js'],
            tasks: ['component_build', 'concat', 'uglify', 'cssmin']
          }
        });

        // Load the plugin that provides the "uglify" task.
        grunt.loadNpmTasks('grunt-contrib-watch');
        grunt.loadNpmTasks('grunt-contrib-concat');
        grunt.loadNpmTasks('grunt-contrib-uglify');
        grunt.loadNpmTasks('grunt-contrib-cssmin');
        grunt.loadNpmTasks('grunt-component-build');
        grunt.loadNpmTasks('grunt-mocha');

        // Default task(s).
        grunt.registerTask('default', ['component_build', 'uglify', 'cssmin']);
        grunt.registerTask('test', ['mocha']);
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