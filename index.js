var mongodb = require('mongodb'),
    config = require('./config.js').config
 
function initNetwork(dbApi) {
  var express = require('express'),
      cors = require('cors'),
      bodyParser = require('body-parser');

  var app = express();

  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded());

  var callback = function(resp) {
    return function(result) {
      if(result.err) resp.status(500).send(result);
      else resp.send(result);
    };
  };

  app.get('/places', function (req, res) {
    if (req.query.map) {
      dbApi.getPlacesOnMap(req.query, callback(res));
    } else {
      dbApi.getAllPlaces(callback(res));      
    }
  });

  app.post('/places', function (req, res) {
    dbApi.updatePlace(req.body, callback(res));
  });

  app.get('/maps', function (req, res) {
    if (req.query.ids) {
      dbApi.getMapsWithIds(req.query.ids, callback(res));
    } else {
      dbApi.getAllMaps(callback(res));
    }
  });

  app.put('/map', function (req, res) {
    dbApi.updateMap(req.body, callback(res));
  });

  app.post('/map', function (req, res) {
    dbApi.addMap(req.body, callback(res));
  });

  app.delete('/map', function (req, res) {
    dbApi.deleteMap(req.query.id, callback(res));
  });

  app.listen(8089);
}

function initDb(callback) {
  var server = new mongodb.Server(config.mongoAddress, config.mongoPort, { }),
      db = mongodb.Db(config.mongoTravelDb, server, {});

  db.open(function (err, client) {
    if (err) { throw err; }

    var places = new mongodb.Collection(client, config.placesCollection),
        maps = new mongodb.Collection(client, config.mapsCollection),
        connections = new mongodb.Collection(client, config.connectionsCollection);

    places.ensureIndex( { "name": "" }, { unique: true } );

    function getId(id) {
      if (id.length == 24) 
        return mongodb.ObjectID(id);
      else 
        return parseInt(id);
    };

    function updateExistingPlace(place, callback) {
      places.update(
        { _id:  getId(place._id) },
        { $set:  {
          name: place.name,
          location: place.location,
          notes: place.notes,
          pics: place.pics, 
          parentMaps: place.parentMaps }
        },
        {w: 1},
        function (err, result) {
          if (result == 1) {
            callback({});
          } else {
            callback({err: err});
          }
        }
      );
    };

    function addPlace(place, callback) {
      places.insert(place, {w: 1}, function(err, doc){
        if (err) {
          callback({err: err});
        } else {
          callback({});
        }
      });
    };

    var dbApi = {

      getAllPlaces: function(callback) {
      	places.find({}, {}, {w: 1}).toArray ( function (err, res) {
          if (err) {
            callback({err: err});
          } else {

            callback(res);
          }
      	});
      },

      getAllMaps: function(callback) {
        maps.find({}, {}, {w: 1}).toArray ( function (err, res) {
          if (err) {
            callback({err: err});
          } else {
            callback(res);
          }
        });
      },

      getMapsWithIds: function(ids, callback) {
        var idNums = [];
        if( typeof ids === 'string' ) {
          idNums = [ getId(ids) ];
        } else {
          idNums = ids.map(function(id) { return getId(id); } );
        }
        maps.find( { _id: { $in: idNums }}, 
          {}, {w: 1}).
          toArray ( function (err, res) {
            if (err) {
              callback({err: err});
            } else {
              callback(res);
            }
        });
      },

      updatePlace: function(place, callback) {
        if ( ! place._id) {
          addPlace(place, callback);
        } else {
          places.find({_id: getId(place._id)}).limit(1).count(function (e, count) {
            if (count == 0) {
              addPlace(place, callback);
            } else {
              updateExistingPlace(place, callback);
            }
          });
        }
      },

      getPlacesOnMap: function(params, callback) {
        places.find(
          {parentMaps: { $all : [ getId(params.map) ]} }, 
          {}, 
          {w: 1}
        ).toArray ( function (err, res) {
          if (err) {
            callback({err: err});
          } else {
            callback(res);
          }
        });
      },

      deleteMap: function(id, callback) {
        maps.remove({_id: getId(id)}, {w: 1}, function (err, result) {
          if (result == 1) {
            callback({});
          } else {
            callback({err: err});
          }
        })
      },

      updateMap: function(map, callback) {
        maps.update(
          { _id:  getId(map._id) },
          { $set:  { name: map.name }
        },
        {w: 1},
        function (err, result) {
          if (result == 1) {
            callback({});
          } else {
            callback({err: err});
          }
        });
      },

      addMap: function (map, callback) {
        maps.insert(map, {w: 1}, function(err, doc) {
          if (err) {
            callback({err: err});
          } else {
            callback({_id: doc[0]._id});
          }
        });
      }

    }

    callback(dbApi);

  });
}

initDb(function(dbApi) {
  initNetwork(dbApi)
});
