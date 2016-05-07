import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';

import './main.html';

var Web3 = require('web3');

var web3 = new Web3();

Template.testlabel.onCreated(function testlabelOnCreated(){
  this.sample = new ReactiveVar('abdhasklabvb');
});

Template.testlabel.helpers({
  sampletext(){
    return Template.instance().sample.get();
  }
});

Template.testlabel.events({
  'click button'(event, instance) {
    console.log('Connecting');
    web3.setProvider(new web3.providers.HttpProvider('http://10.125.66.6:9990'));
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
    if(web3.isConnected())
    {
      instance.ConnectivityStat.set('Connected');
    }
    else
    {
      instance.ConnectivityStat.set('Not Connected...');
    }
  },
});
