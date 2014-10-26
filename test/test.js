var assert = require('assert');
var levelup = require('levelup');
var griddown = require('../');
var usergrid = require('usergrid');

var client = new usergrid.client({
  appName: 'sandbox',
  orgName: 'mdobson'
});

var dbopts = {
  cache: true,
  app: 'sandbox',
  org: 'mdobson',
  type: 'levels'
};

function getEntity(key, cb){
  client.createCollection({
    type: dbopts.type, 
    ql:'where key=_'+key
  }, function(err, coll) {
    if(err) cb(err)

    var entity = coll.getFirstEntity();
    cb(null, entity);
  });
}


describe('griddown', function(){
  var db = null;

  beforeEach(function(done) {
    db = levelup('/foo', {
      db: function(location) { return new griddown(location, dbopts); }
    });
    done();
  });

  it('will initialize griddown', function(done){
    assert.ok(db);
    done();
  });

  it('will save a key to cache with put', function(done) {
    db.put('foo2', 'bar', function(err) {
      assert.ok(!err);
      assert.equal(db.db._cache['_foo2'], 'bar');
      done();
    });
  });

  it('will save a key to usergrid with put', function(done) {
    db.put('foo3', 'bar', function(err) {
      getEntity('foo3', function(err, entity) {
        assert.ok(entity);
        assert.equal(entity.get('key'), '_foo3');
        assert.equal(entity.get('value'), 'bar');
        done();
      });
    });
  });

  it('will update the key value pair', function(done) {
    db.put('foo3', 'bar2', function(err) {
      getEntity('foo3', function(err, entity) {
        assert.ok(!err);
        assert.equal(entity.get('key'), '_foo3');
        assert.equal(entity.get('value'), 'bar2');
        done();
      });
    });
  });

  

  it('will update the key value pair in the cache', function(done) {
    db.put('foo2', 'bar2', function(err) {
      assert.ok(!err);
      assert.equal(db.db._cache['_foo2'], 'bar2');
      done();
    });
  });

  it('will retrieve the value with get', function(done) {
    db.get('foo3', function(err, value) {
      assert.ok(!err);
      assert.equal(value, 'bar2');
      done();
    });
  });

  it('will delete a key from the cache', function(done) {
    db.del('foo2', function(err) {
      assert.ok(!err);
      assert.ok(!db.db._cache['_foo2']);
      done();
    });
  });

  it('will delete a key from usergrid', function(done) {
    db.del('foo3', function(err) {
      assert.ok(!err);
      getEntity('foo3', function(err, entity) {
        assert.ok(!err);
        assert.ok(!entity);
        done();
      });
    });
  });
});
