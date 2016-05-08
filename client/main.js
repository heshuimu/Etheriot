import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var Web3 = require('web3');

var web3 = new Web3();

var GethIP = '192.168.0.1';
var GethPort = '8545';

var GethCoinbase = null;

var ABIString = '[{ "constant": false, "inputs": [{ "name": "x", "type": "uint256"}], "name": "set", "outputs": [], "type": "function"}, { "constant": true, "inputs": [], "name": "get", "outputs": [{ "name": "retVal", "type": "uint256"}], "type": "function"}, { "anonymous": false, "inputs": [{ "indexed": false, "name": "data", "type": "uint256" }], "name": "ItBlinks", "type": "event"}]';
var ContractAddress = '0x720391DB3f787614d25b6c52056eAE20EeE0825E';
var blinker = null;
var blink_event = null;

var SensorValue = new ReactiveVar('Sensor not activated');
var IntervalTaskID = null;
var isSensorActive = false;

function onSensorSuccess(value)
{
	//console.log("ProximityState returned. ");
	var state = value[0];
	if (state <= 0)
	{
		SensorValue.set('Near');
	}
	else
	{
		SensorValue.set('Far');
	}

};

Template.proximity.onCreated(function() {
});

Template.proximity.helpers({
	SensorValue(){
		return SensorValue.get();
	}
});

// sensor plugin reference to: https://github.com/fabiorogeriosj/cordova-plugin-sensors
Template.proximity.events({
	'click button'(event, instance) {
		if(isSensorActive)
		{
			sensors.disableSensor();
			SensorValue.set('Sensor deactivated');
			Meteor.clearInterval(IntervalTaskID);
			isSensorActive = false;
		}
		else
		{
			SensorValue.set('Sensor activating');
			sensors.enableSensor("PROXIMITY");
			IntervalTaskID = Meteor.setInterval(function() {sensors.getState(onSensorSuccess);}, 100);
			isSensorActive = true;
		}
	}
});

Template.coinbase.onCreated(function coinbaseOnCreated() {
	this.CoinbaseValue = new ReactiveVar(null);
});

Template.coinbase.helpers({
	CoinbaseValue(){
		return Template.instance().CoinbaseValue.get();
	}
});

Template.coinbase.events({
	'click button'(event, instance) {
		console.log('Refreshing coinbase');
		instance.CoinbaseValue.set(web3.eth.getBalance(GethCoinbase));
	}
});

Template.ABIInterface.events({
	'click button'(event, instance) {
		var ABI = JSON.parse(ABIString);
		web3.eth.defaultAccount = web3.eth.accounts[0];
		blinker = web3.eth.contract(ABI).at(ContractAddress);
		console.log("blinker: " + blinker);
		blink_event = blinker.ItBlinks( {}, function(error, result) {
			if (!error) {
				// when ItBlinks event is fired, output the value 'data' from the result object and the block number
				var msg = "\n\n*********";
				msg += "Blink!: " + result.args.data + " (block:" + result.blockNumber + ")";
				msg += "*********";
				console.log(msg);

				//DO STUFF...

			}
		});
	}
});

Template.testlabel.events({
	'click button'(event, instance) {
		GethIP = instance.find(".GethIPInput").value;
		GethPort = instance.find(".GethPortInput").value;
		var GethAddr = 'http://' + GethIP + ':' + GethPort;
		console.log('Connecting to Addr: ' + GethAddr);
		web3.setProvider(new web3.providers.HttpProvider(GethAddr));
	}
});

Template.hello.onCreated(function helloOnCreated() {
	// counter starts at 0
	this.counter = new ReactiveVar(0);
	this.ConnectivityStat = new ReactiveVar('INIT');
});

Template.hello.helpers({
	counter() {
		return Template.instance().counter.get();
	},
	Connectivity() {
		return Template.instance().ConnectivityStat.get();
	}
});

Template.hello.events({
	'click button'(event, instance) {
		// increment the counter when button is clicked
		instance.counter.set(instance.counter.get() + 1);
		console.log('Hellooooooooooooooo');
		console.log('Ethereum web3 version: ' + web3.version.api);
		console.log('Is web3 connected: ' + web3.isConnected());
		if (web3.isConnected()) {
			instance.ConnectivityStat.set('Connected');
			getCoinbase();
		}
		else {
			instance.ConnectivityStat.set('Not Connected...');
		}
	}
});

function getCoinbase()
{
	GethCoinbase = web3.eth.coinbase;
	console.log(GethCoinbase);
}


