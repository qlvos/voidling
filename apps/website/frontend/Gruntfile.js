module.exports = function(grunt) {
  // Project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        mangle: true
      },
      build: {
        files : {
          'build/main.js': ['./src/main.js'],
          'build/chaindata.js': ['src/chaindata.js'],
          'build/voidlingdrawer.js': ['src/voidlingdrawer.js'],
          'build/prophecies.js': ['src/prophecies.js'],
          'build/plothelpers.js': ['src/plothelpers.js'],
          'build/optimizedbufferpool.js': ['src/optimizedbufferpool.js'],
          'build/voidling-config-agitated.js': ['src/voidling-config-agitated.js'],
          'build/voidling-config-cautious.js': ['src/voidling-config-cautious.js'],
          'build/voidling-config-curious.js': ['src/voidling-config-curious.js'],
          'build/voidling-config-excited.js': ['src/voidling-config-excited.js'],
          'build/voidling-config-serene.js': ['src/voidling-config-serene.js'],
          'build/voidling-config-mob.js': ['src/voidling-config-mob.js'],
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s)
  grunt.registerTask('default', ['uglify']);
};
