/* jshint node: true */

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
    banner: '/**\n' +
              '* jsGen v<%= pkg.version %> by @zensh\n' +
              '* Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.email %>\n' +
              '*/\n',
    dist: '../dist',

    // Task configuration.
    clean: {
      dist: [
        'static/dist/*'
      ]
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: 'static/src/js/*.js'
      },
      server: {
        src: ['app.js', 'api/*.js', 'dao/*.js', 'lib/*.js', 'patch/*.js']
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      reserveLoad: {
        dest: 'static/dist/js/reserveLoad.min.js',
        src: 'static/bower_components/reserveLoadjs/reserveLoad.js'
      },
      ie: {
        dest: 'static/dist/js/ie.min.js',
        src: [
          'static/bower_components/es5-shim/es5-shim.js',
          'static/bower_components/json2/json2.js',
          'static/bower_components/html5shiv/dist/html5shiv.js',
          'static/bower_components/respond/respond.src.js'
        ]
      },
      jquery: {
        dest: 'static/dist/js/jquery.old.js',
        src: ['static/bower_components/jquery.old/jquery.js']
      },
      angular: {
        dest: 'static/dist/js/angular-all.min.js',
        src: [
          'static/bower_components/angular/angular.js',
          'static/bower_components/angular-animate/angular-animate.js',
          'static/bower_components/angular-cookies/angular-cookies.js',
          'static/bower_components/angular-resource/angular-resource.js',
          'static/bower_components/angular-route/angular-route.js'
        ]
      },
      lib: {
        dest: 'static/dist/js/lib.min.js',
        src: [
          'static/bower_components/angular-file-upload/angular-file-upload.js',
          'static/bower_components/google-code-prettify/src/prettify.js',
          'static/bower_components/marked/lib/marked.js',
          'static/bower_components/toastr/toastr.js',
          'static/src/js/lib/angular-locale_zh-cn.js',
          'static/src/js/lib/angular-ui.js',
          'static/src/js/lib/bootstrap.js',
          'static/src/js/lib/hmac-sha256.js',
          'static/src/js/lib/Markdown.Editor.js',
          'static/src/js/lib/sanitize.js',
          'static/src/js/lib/store.js',
          'static/src/js/lib/utf8.js'
        ]
      },
      jsgen: {
        dest: 'static/dist/js/<%= pkg.name %>.min.js',
        src: [
          'static/src/js/locale_zh-cn.js',
          'static/src/js/router.js',
          'static/src/js/tools.js',
          'static/src/js/services.js',
          'static/src/js/filters.js',
          'static/src/js/directives.js',
          'static/src/js/controllers.js',
          'static/src/js/app.js'
        ]
      }
    },

    recess: {
      dist: {
        options: {
          compile: true,
          compress: true
        },
        dest: 'static/dist/css/<%= pkg.name %>.min.css',
        src: [
          'static/bower_components/pure/pure.css',
          'static/bower_components/toastr/toastr.css',
          'static/src/css/prettify.css',
          'static/src/css/main.css'
        ]
      }
    },

    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        dest: 'static/dist/tpl/',
        src: ['static/src/tpl/*.html']
      }
    },

    copy: {
      fonts: {
        expand: true,
        flatten: true,
        dest: 'static/dist/fonts/',
        src: ['static/src/bower_components/font-awesome/fonts/*']
      },
      css: {
        expand: true,
        flatten: true,
        dest: 'static/dist/css/',
        src: ['static/src/bower_components/font-awesome/css/font-awesome.min.css']
      },
      jquery: {
        expand: true,
        flatten: true,
        dest: 'static/dist/js/',
        src: ['static/src/bower_components/jquery/jquery.min.js']
      },
      img: {
        expand: true,
        flatten: true,
        dest: 'static/dist/img/',
        src: ['static/src/img/*']
      },
      tpl: {
        expand: true,
        flatten: true,
        dest: 'static/dist/tpl/',
        src: ['static/src/tpl/*']
      },
      md: {
        expand: true,
        flatten: true,
        dest: 'static/dist/md/',
        src: ['static/src/md/*']
      }
    },

    hash: {
      index: {
        options: {
          algorithm: 'md5',
          urlCwd: 'static/dist/'
        },
        dest: 'static/dist/index.html',
        src: 'static/src/index_src.html'
      }
    }

  });


  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  // grunt.loadNpmTasks('grunt-contrib-htmlmin');
  // grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-hash-url');
  grunt.loadNpmTasks('grunt-recess');

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'uglify', 'recess', 'copy', 'hash']);
};
