var mongodb = require('mongodb'),
    config = require('./config.js').config,
    server = new mongodb.Server(config.mongoAddress, config.mongoPort, { }),
    db = mongodb.Db(config.mongoTravelDb, server, {});

function initDb() {
  db.open(function (err, client) {
    if (err) { throw err; }

    var places = new mongodb.Collection(client, config.placesCollection),
        maps = new mongodb.Collection(client, config.mapsCollection),
        connections = new mongodb.Collection(client, config.connectionsCollection);

    places.remove();
    connections.remove();
    maps.remove();

    maps.insert({
      _id: 1,
      name: "Chicago"
    });
    maps.insert({
      _id: 2,
      name: "Washington D.C."
    });
    maps.insert({
      _id: 3,
      name: "USA"
    });
    maps.insert({
      _id: 4,
      name: "Mountain trails"
    });

    places.insert({
      name: "Haiku Stairs",
      location: {
        lat: 21.400788,
        lng: -157.821934
      },
      notes: "Steep trail!",
      pics: ["http://cs7002.vk.me/c540103/v540103264/1e9d6/4cq4et75xmA.jpg", 
        "https://c2.staticflickr.com/8/7049/6863925343_9ac9c68bb4_z.jpg",
        "https://c2.staticflickr.com/6/5281/5298818285_985bcf0b40_z.jpg", 
        "http://lh6.ggpht.com/-0WqtCkikIAw/Ur5y02is7NI/AAAAAAAAuuw/RntKw1VQA1Q/haiku-stairs-3%25255B2%25255D.jpg"],
      parentMaps: [3, 4],
    });

    places.insert({
      name: "Bean",
      location: {
        lat: 41.883456,
        lng: -87.623132
      },
      notes: "",
      pics: ["http://dvogled.rs/wp-content/uploads/2014/08/chicagosculpture.jpg"], 
      parentMaps: [1]
    });

    places.insert({
      name: "Skydeck",
      location: {
        lat: 41.879587,
        lng: -87.636159
      },
      notes: "",
      pics: ["http://33.media.tumblr.com/2a985a4179e6cd8ab916325d79075ee4/tumblr_mw2p7hmE3X1rshyy2o1_1280.jpg"], 
      parentMaps: [1]
    });

    console.log("done");

    db.close();
  });
}

initDb();
