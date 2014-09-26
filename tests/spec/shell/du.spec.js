var Filer = require('../../..');
var util = require('../../lib/test-utils.js');
var expect = require('chai').expect;

describe('The shell du command', function(){
  beforeEach(util.setup);
  afterEach(util.cleanup);

  it('should exist as a function', function(){
    var sh = util.shell();

    expect(sh.du).to.be.a('function');
  });

  it('should be able to read a relative file path', function(done){
    var fs = util.fs();
    var sh = fs.Shell();
    var specs = [{path: '/file', size: 2}];

    fs.writeFile('/file', 'hi', function(err) {
      if(err) {
        throw err;
      }

      sh.du('/file', function(err, sizes) {
        expect(err).not.to.exist;

        expect(sizes.entries).to.deep.equal(specs);
        expect(sizes.total).to.equal(2);

        done();
      });
    });
  });

  it('should be able to read and calculate a symbolic link reference', function(done){
    var fs = util.fs();
    var sh = fs.Shell();
    var specs = [{path: '/sym1', size: 9}];

    fs.writeFile('/f1', 'Testing 1', function(err) {
      if(err) {
        throw err;
      }

      fs.symlink('/f1', '/sym1', function(err) {
        if(err) {
          throw err;
        }

        sh.du('/sym1', {symLinks: true}, function(err, sizes) {
          expect(err).not.to.exist;

          expect(sizes).to.exist;
          expect(sizes.entries).to.deep.equal(specs);
          expect(sizes.total).to.equal(9);

          done();
        });
      });
    });
  });

  it('should be able to calculate the total size in kilobytes', function(done){
    var fs = util.fs();
    var sh = fs.Shell();
    var specs = [{path: '/file', size: 0.002}];

    fs.writeFile('/file', 'hi', function(err) {
      if(err) {
        throw err;
      }

      sh.du('/file', {format: 'kb'}, function(err, sizes) {
        expect(err).not.to.exist;

        expect(sizes.entries).to.deep.equal(specs);
        expect(sizes.total).to.equal(0.002);

        done();
      });
    });
  });

  it('should be able to calculate the total size in megabytes', function(done){
    var fs = util.fs();
    var sh = fs.Shell();
    var specs = [{path: '/file', size: 0.000007}];

    fs.writeFile('/file', 'bye now', function(err) {
      if(err) {
        throw err;
      }

      sh.du('/file', {format: 'mb'}, function(err, sizes) {
        expect(err).not.to.exist;

        expect(sizes.entries).to.deep.equal(specs);
        expect(sizes.total).to.equal(0.000007);

        done();
      });
    });
  });

  it('should be able to calculate the total size in gigabytes', function(done){
    var fs = util.fs();
    var sh = fs.Shell();
    var specs = [{path: '/file', size: 0.000000008}];

    fs.writeFile('/file', 'whatever', function(err) {
      if(err) throw err;

      sh.du('/file', {format: 'gb'}, function(err, sizes) {
        expect(err).not.to.exist;

        expect(sizes.entries).to.deep.equal(specs);
        expect(sizes.total).to.equal(0.000000008);

        done();
      });
    });
  });

  it('should be able to recursively calculate a nested directory structure', function(done){
    var fs = util.fs();
    var sh = fs.Shell();
    var specs = [{path: '/d1/f1', size: 22},
                          {path: '/d1', size: 22},
                          {path: '/d2/d3', size: 0},
                          {path: '/d2/sym1', size: 6},
                          {path: '/d2', size: 6},
                          {path: '/', size: 28}];

    function createFilesAndLinks(callback) {
      fs.writeFile('/d1/f1', 'things alongside stuff', function(err) {
        if(err) {
          throw err;
        }
        fs.symlink('/d1/f1', '/d2/sym1', function(err) {
          if(err) {
            throw err;
          }
          callback();
        });
      });
    }

    function createDirectories(callback) {
      fs.mkdir('/d1', function(err) {
        if(err) {
          throw err;
        }
        fs.mkdir('/d2', function(err) {
          if(err) {
            throw err;
          }
          sh.mkdirp('/d2/d3', function(err) {
            if(err) {
              throw err;
            }
            callback();
          });
        });
      });
    }

    createDirectories(function() {
      createFilesAndLinks(function() {
        sh.du('/', function(err, sizes) {
          expect(err).not.to.exist;

          expect(sizes).to.exist;
          expect(sizes.entries).to.deep.equal(specs);
          expect(sizes.total).to.equal(28);

          done();
        });
      });
    });
  });

  it('should error out when a nonexistent file is passed in', function(done){
    var sh = util.fs().Shell();

    sh.du('/idontexist', function(err, sizes) {
      expect(err).to.exist;

      expect(err.code).to.equal('ENOENT');
      expect(sizes).not.to.exist;

      done();
    });
  });
});
