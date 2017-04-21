/*eslint-env node */

var DB_PATH = ':memory:';
var MQTT_HOST = 'mqtt://localhost:1883';
var MQTT_TOPIC = 'home/nodemcu/#';
var API_PORT = 30000;


var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(DB_PATH);

db.serialize(function() {
	db.run("CREATE TABLE IF NOT EXISTS nodemcu (lastUpdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP, ip TEXT, mac TEXT, sdk TEXT, flashSize TEXT, chipID TEXT PRIMARY KEY, flashID TEXT, flashMode TEXT, flashSpeed TEXT, heap TEXT, totalMemory TEXT, bytesUsed TEXT, bytesRemain TEXT)");
});


var express = require('express');
var restapi = express();

restapi.get('/api/nodes', function(req, res) {
	console.log("Called - Get All Nodes");
	db.all("SELECT * FROM nodemcu ORDER BY chipID", function(err, rows) {
		//res.json({ "count" : row.value });
		res.header("Access-Control-Allow-Origin", "*");
		res.json(rows);

	});
});

restapi.get('/api/nodes/:id', function(req, res) {
	var chipID = parseInt(req.params.id);
	console.log("Called - Get Specific Node - " + chipID);
	db.each("SELECT * FROM nodemcu WHERE chipID = $1", chipID, function(err, rows) {
		//res.json({ "count" : row.value });
		res.header("Access-Control-Allow-Origin", "*");
		res.json(rows);
	});
});

restapi.put('/api/nodes', function(req, res) {
	db.run("UPDATE counts SET value = value + 1 WHERE key = ?", "counter", function(err, row) {
		if (err) {
			console.err(err);
			res.status(500);
		} else {
			res.status(202);
		}
		res.end();
	});
});


restapi.listen(API_PORT);



var mqtt = require('mqtt');
var mqttclient = mqtt.connect(MQTT_HOST);

mqttclient.on('connect', function() {
	mqttclient.subscribe(MQTT_TOPIC);
//mqttclient.publish('presence', 'Hello mqtt')
});

mqttclient.on('message', function(topic, message) {

	var payload;

	try {
		payload = JSON.parse(message);
	} catch (e) {
		console.log(e);
		return true;
	}

	console.log(payload.NodeMCU.ChipID);

	db.run("INSERT OR REPLACE INTO nodemcu (chipID, ip, mac, sdk, flashSize, flashID, flashMode, flashSpeed, heap, totalMemory, bytesUsed, bytesRemain) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)", payload.NodeMCU.ChipID, payload.NodeMCU.IP, payload.NodeMCU.MAC, payload.NodeMCU.SDK, payload.NodeMCU.FlashSize, payload.NodeMCU.FlashID, payload.NodeMCU.FlashMode, payload.NodeMCU.FlashSpeed, payload.NodeMCU.Heap, payload.NodeMCU.TotalMemory, payload.NodeMCU.bytesUsed, payload.NodeMCU.bytesRemain, function(err, row) {

		if (err) {
			console.log(err);
		}
	});
});




console.log("Submit GET or POST to http://localhost:" + API_PORT + "/data");