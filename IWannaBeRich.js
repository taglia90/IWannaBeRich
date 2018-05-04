/*
  IWannaBeRich strategy - 2018-05-03
 */
// helpers
var _ = require('lodash');
var log = require('../core/log.js');

var bb = require('./indicators/BB.js');
var rsi = require('./indicators/RSI.js');
var macd = require('./indicators/MACD.js');

// let's create our own strat
var strat = {};


// prepare everything our strat needs
strat.init = function () {
  this.name = 'IWannaBeRich';
  this.nsamples = 0;
  this.trend = {
    zone: 'none',  // none, top, high, low, bottom
    duration: 0,
    persisted: false
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('bb', 'BB', this.settings.bbands);
  this.addIndicator('rsi', 'RSI', this.settings.rsi);
  this.addIndicator('macd', 'MACD', this.settings.macd);
}


// what happens on every new candle?
strat.update = function(candle) {
  // nothing!
}

// for debugging purposes log the last
// calculated parameters.
strat.log = function (candle) {
   var digits = 8;
   
   //BB logging
   var bb = this.indicators.bb;
   //BB.lower; BB.upper; BB.middle are your line values 

   log.debug('______________________________________');
   log.debug('calculated BB properties for candle ', this.nsamples);

   if (bb.upper > candle.close) log.debug('\t', 'Upper BB:', bb.upper.toFixed(digits));
   if (bb.middle > candle.close) log.debug('\t', 'Mid   BB:', bb.middle.toFixed(digits));
   if (bb.lower >= candle.close) log.debug('\t', 'Lower BB:', bb.lower.toFixed(digits));
   log.debug('\t', 'price:', candle.close.toFixed(digits));
   if (bb.upper <= candle.close) log.debug('\t', 'Upper BB:', bb.upper.toFixed(digits));
   if (bb.middle <= candle.close) log.debug('\t', 'Mid   BB:', bb.middle.toFixed(digits));
   if (bb.lower < candle.close) log.debug('\t', 'Lower BB:', bb.lower.toFixed(digits));
   log.debug('\t', 'Band gap: ', bb.upper.toFixed(digits) - bb.lower.toFixed(digits));

   //RSI logging
   var rsi = this.indicators.rsi;

   log.debug('calculated RSI properties for candle:');
   log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
   log.debug('\t', 'price:', candle.close.toFixed(digits));
   
   //MACD logging
   var macd = this.indicators.macd;
   
   var diff = macd.diff;
   var signal = macd.signal.result;
   
   log.debug('calculated MACD properties for candle:');
   log.debug('\t', 'short:', macd.short.result.toFixed(digits));
   log.debug('\t', 'long:', macd.long.result.toFixed(digits));
   log.debug('\t', 'macd:', diff.toFixed(digits));
   log.debug('\t', 'signal:', signal.toFixed(digits));
   log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function (candle) {
  var bb = this.indicators.bb;
  var price = candle.close;
  this.nsamples++;

  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  var macd = this.indicators.macd;
  var macddiff = this.indicators.macd.result;

  // price Zone detection
  var zone = 'none';
  if (price >= bb.upper) zone = 'top';
  if ((price < bb.upper) && (price >= bb.middle)) zone = 'high';
  if ((price > bb.lower) && (price < bb.middle)) zone = 'low';
  if (price <= bb.lower) zone = 'bottom';
  log.debug('current zone:  ', zone);
  log.debug('current trend duration:  ', this.trend.duration);

  if (this.trend.zone == zone) {
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: this.trend.duration+1,
      persisted: true
    }
  }
  else {
    this.trend = {
      zone: zone,  // none, top, high, low, bottom
      duration: 0,
      persisted: false
    }
  }

  if (price <= bb.lower 
      && rsiVal <= this.settings.thresholds.low 
      && this.trend.duration >= this.settings.thresholds.persistence) {
    this.advice('long')
  }
  if (price >= bb.middle 
      && rsiVal >= this.settings.thresholds.high) {
    this.advice('short')
  }

  // this.trend = {
  //   zone: zone,  // none, top, high, low, bottom
  //   duration: 0,
  //   persisted: false
}


// Optional for executing code
// after completion of a backtest.
// This block will not execute in
// live use as a live gekko is
// never ending.
strat.end = function() {
  // your code!
}

module.exports = strat;
