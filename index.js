var mongodb = require('mongodb'),
    config = require('./config.js').config
 
function initNetwork(dbApi) {
  var express = require('express'),
      cors = require('cors');

  var app = express();

  app.use(cors());

  app.get('/getAllPlaces', function (req, res) {
    //req.query
    dbApi.getAllPlaces(function(places) {
      res.send(places);
    })
  });

  app.get('/getAllMaps', function (req, res) {
    dbApi.getAllMaps(function(maps) {
      res.send(maps);
    })
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
    var dbApi = {
      getAllPlaces: function(callback) {
      	places.find({}, {}).toArray ( function (err, res) {
          callback(res);
      	})
      },
      addPlace: function(params, callback) {
        places.insert(normPlace(params));
        callback({result: 'done'});
      },
      addPlaceOnMap: function (params, callback) {
        places.update(
          { name: params.place },
          { $push: { parentMaps: params.map }}
        );
        callback({result: 'done'});
      },
      getAllMaps: function(callback) {
        maps.find({}, {}).toArray ( function (err, res) {
            callback(res);
        })
      },
      getPlacesOnMap: function(params, callback) {
        places.find({parentMaps: { $all : [params.map]} }, {}).toArray ( function (err, res) {
          callback(res);
        });
      }
    }

    callback(dbApi)
  });
}

initDb(function(dbApi) {
  initNetwork(dbApi)
});
