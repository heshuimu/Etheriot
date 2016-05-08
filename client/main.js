import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var Web3 = require('web3');

var web3 = new Web3();

var GethIP = '192.168.0.1';
var GethPort = '8545';

var GethCoinbase = null;

var ABIString = '[ { "constant": false, "inputs": [ { "name": "s", "type": "address" }, { "name": "v", "type": "uint256" } ], "name": "invoke", "outputs": [], "type": "function" }, { "anonymous": false, "inputs": [ { "indexed": false, "name": "s", "type": "address" }, { "indexed": false, "name": "v", "type": "uint256" } ], "name": "OnReceive", "type": "event" } ]';
var ContractAddress = '0xf8c4AfB6c71C5FF9A62EF4206C6A675a1D526066';
var blinker = null;
var blink_event = null;

var SensorValue = new ReactiveVar('Sensor not activated');
var IntervalTaskID = null;
var isSensorActive = false;
var isInvokeAllowed = true;
var SensorValueThreshold = 25;

var isReceiver = false;
var isInTakingPicture = false;

function onSensorSuccess(value)
{
	var data = value[0];
	SensorValue.set(data);

	if (data < SensorValueThreshold)
	{
		if(isInvokeAllowed)
		{
			isInvokeAllowed = false;
			blinker.invoke(GethCoinbase, data);
		}
	}
	else
	{
		if(!isInvokeAllowed)
		{
			isInvokeAllowed = true;
		}
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
		SensorValueThreshold = instance.find(".SensorThreshold").value;
		console.log('Threshold: ' + SensorValueThreshold);
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
			sensors.enableSensor("LIGHT");
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
		blink_event = blinker.OnReceive( {}, function(error, result) {
			if (!error) {
				if(result.args.s == GethCoinbase)
				{
					//console.log('Event invoke ignored since the sender is myself. ');
				}
				else
				{
					console.log("Received: " + result.args.v + ' from ' + result.args.s);
					SensorValue.set(result.args.v + " (remote)");
					if (!isInTakingPicture)
					{
						navigator.camera.getPicture(OnCameraSuccess, OnCameraFail);
						isInTakingPicture = true;
					}
				}
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

function OnCameraSuccess(photoPath){
	console.log('Camera get picture successful. Path to picture: ' + photoPath);
	isInTakingPicture = false;
}

function OnCameraFail(errMessage){
	console.log('Camera encountered an error: ' + errMessage);
	isInTakingPicture = false;
}


