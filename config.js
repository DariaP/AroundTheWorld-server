
var config = {
  dataServerPort: 29999,
  dataServerAddress: 'http://localhost',
  mongoAddress: "127.0.0.1",
  mongoPort: 27017,
  mongoTravelDb: 'Travel',
  placesCollection: "places",
  mapsCollection: "maps",
  connectionsCollection: "connections"
};

module.exports = { 
  config : config,
}
