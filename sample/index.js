var levelup = require('levelup');
var griddown = require('../');

var dbopts = {
  cache: false,
  app: 'sandbox',
  org: 'mdobson',
  type: 'levels'
};

var db = levelup('/who/cares', {
  db: function (location) { return new griddown(location, dbopts); }
});

db.put('foo', 'bar3', function(err) {
  if(err) throw err;

  db.get('foo', function(err, value) {
    if(err) throw err;
    console.log('Got foo = ', value);
  });
});
