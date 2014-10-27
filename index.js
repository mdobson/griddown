var AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN;
var util = require('util');
var usergrid = require('usergrid');

var search = function(client, key, type, cb) {
  collection = client.createCollection({ type: type, ql: 'where key=' + key}, function(err, collection) {
    if(err) {
      cb(err);
    } else {
      var entity = collection.getFirstEntity();
      var value = entity.get('value');
      cb(null, value);
    }
  });
}

var del = function(client, key, type, cb) {
  collection = client.createCollection({ type: type, ql: 'where key=' + key}, function(err, collection) {
    if(err) {
      cb(err);
    } else {
      var entity = collection.getFirstEntity();
      if(entity) {
        entity.destroy(function(err){
          if(err) {
            cb(err);
          } else {
            cb();
          }
        })
      } else {
        cb();
      }
    }
  }); 
}

var updateOrCreate = function(client, key, value, type, cb) {
  collection = client.createCollection({ type: type, ql: 'where key=' + key}, function(err, collection) {
    if(err) {
      cb(err);
    } else {
      var entity = collection.getFirstEntity();
      if(entity) {
        entity.set('key', key);
        entity.set('value', value);
        entity.save(function(err) {
          if(err) {
            cb(err);
          } else {
            cb();
          }
        });
      } else {
        var opts = {
          type: type,
          key: key,
          value: value
        }

        client.createEntity(opts, function(err) {
          if(err) {
            cb(err)
          } else {
            cb();
          }
        });
      }
    }
  });
}

var UserGridLevelDOWN = module.exports = function(location) {
  AbstractLevelDOWN.call(this, location);
  this.client = null;
  this.collection = null;
};
util.inherits(UserGridLevelDOWN, AbstractLevelDOWN);

UserGridLevelDOWN.prototype._open = function(options, callback) {
  this.opts = options || {};
  this.client = new usergrid.client({
    orgName: this.opts.org,
    appName: this.opts.app
  });

  if(this.opts.cache) {
    this._cache = {};
  }

  process.nextTick(function() { callback(null, this) }.bind(this));
};

UserGridLevelDOWN.prototype._put = function(key, value, options, callback) {
  key = '_' + key;
  
  if(this.opts.cache) {
    this._cache[key] = value;
  }

  updateOrCreate(this.client, key, value, this.opts.type, function(err) {
    if(err) {
      callback(err);
    } else {
      callback();
    }
  });

};

UserGridLevelDOWN.prototype._get = function(key, options, callback) {
  key = '_' + key;


  if(this.opts.cache) {
    var val = this._cache[key];
    if(!val) {
      search(this.client, key, this.opts.type, function(err, value) {
        if(err) {
          callback(err);
        } else {
          if(!value) {
            callback(new Error('NotFound'));
          } else {
            callback(null, value);
          }
        }
      });
    } else {
      callback(null, val);
    }
  } else {
    search(this.client, key, this.opts.type, function(err, value) {
      if(err) {
        callback(err);
      } else {
        if(!value) {
          callback(new Error('NotFound'));
        } else {
          callback(null, value);
        }
      }
    });
  }
};


UserGridLevelDOWN.prototype._del = function(key, options, callback) {
  key = '_' + key;
  if(this.opts.cache) {
    delete this._cache[key];
  }

  del(this.client, key, this.opts.type, function(err) {
    if(err) {
      callback(err);
    } else {
      callback();
    }
  });
};



