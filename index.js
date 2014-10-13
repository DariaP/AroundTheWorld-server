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
      if(result.err) resp.status(500).send(result)
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

  app.get('/maps', function (req, res) {
    dbApi.getAllMaps(callback(res));
  });

  app.post('/places', function (req, res) {
    dbApi.updatePlace(req.body, callback(res));
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

    function normPlace(place) {
      if(!place.notes) place.notes="";
      if(!place.parentMaps) place.parentMaps=[];
      if(!place.pics) 
        place.pics=[];
      else
        place.pics = place.pics.split(/[, \n]+/);

      var latlng = place.location.split(/[, ]+/);
      place.location = {lat: parseInt(latlng[0]), lng: parseInt(latlng[1])}

      return place;
    }

    function updateExistingPlace(place, callback) {
      places.update(
        { _id:  mongodb.ObjectID(place._id) },
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

      updatePlace: function(place, callback) {
        var id = mongodb.ObjectID(place._id);
        places.find({_id: id}).limit(1).count(function (e, count) {
          if (count == 0) {
            addPlace(place, callback);
          } else {
            updateExistingPlace(place, callback);
          }
        });
      },

      getPlacesOnMap: function(params, callback) {
        places.find({parentMaps: { $all : [ parseInt(params.map) ]} }, {}, {w: 1}).toArray ( function (err, res) {
          if (err) {
            callback({err: err});
          } else {
            callback(res);
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
