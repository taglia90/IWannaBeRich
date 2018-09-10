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
  this.name = 'IWannaBeRich-MI';
  this.nsamples = 0;
  this.trend = {
    //zone: 'none',  // none, top, high, low, bottom
    duration: 0,
    persisted: false,
    direction: '', //up, down
    adviced: false 
  //  max: 0,
  //  min: 0
  };

  this.requiredHistory = this.tradingAdvisor.historySize;

  // define the indicators we need
  this.addIndicator('bb', 'BB', this.settings.bbands);
  this.addIndicator('rsi', 'RSI', this.settings.rsi);
  this.addIndicator('macd', 'MACD', this.settings.macd);
}


// what happens on every new candle?
strat.update = function(candle) {
  // 
  /*this.trend = {
    //zone: this.trend.zone, 
    duration: this.trend.duration,
    persisted: this.trend.persisted,
    direction: 
    adviced: this.trend.adviced
    //max: Math.max(this.trend.max, candle.close),
    //min: Math.min(this.trend.min, candle.close)
  }*/
}

// for debugging purposes log the last
// calculated parameters.
strat.log = function (candle) {
   var digits = 8;
   
   var bb = this.indicators.bb;
   var rsi = this.indicators.rsi;
   var macd = this.indicators.macd;
   var diff = macd.diff;
   var signal = macd.signal.result;

   ////BB logging
   ////BB.lower; BB.upper; BB.middle are your line values
   //log.debug('______________________________________');
   //log.debug('calculated BB properties for candle ', this.nsamples);
   //
   //if (bb.upper > candle.close) log.debug('\t', 'Upper BB:', bb.upper.toFixed(digits));
   //if (bb.middle > candle.close) log.debug('\t', 'Mid   BB:', bb.middle.toFixed(digits));
   //if (bb.lower >= candle.close) log.debug('\t', 'Lower BB:', bb.lower.toFixed(digits));
   //log.debug('\t', 'price:', candle.close.toFixed(digits));
   //if (bb.upper <= candle.close) log.debug('\t', 'Upper BB:', bb.upper.toFixed(digits));
   //if (bb.middle <= candle.close) log.debug('\t', 'Mid   BB:', bb.middle.toFixed(digits));
   //if (bb.lower < candle.close) log.debug('\t', 'Lower BB:', bb.lower.toFixed(digits));
   //log.debug('\t', 'Band gap: ', bb.upper.toFixed(digits) - bb.lower.toFixed(digits));
   //
   ////RSI logging
   //log.debug('calculated RSI properties for candle:');
   //log.debug('\t', 'rsi:', rsi.result.toFixed(digits));
   //log.debug('\t', 'price:', candle.close.toFixed(digits));
   //
   ////MACD logging
   //log.debug('calculated MACD properties for candle:');
   //log.debug('\t', 'short:', macd.short.result.toFixed(digits));
   //log.debug('\t', 'long:', macd.long.result.toFixed(digits));
   //log.debug('\t', 'macd:', diff.toFixed(digits));
   //log.debug('\t', 'signal:', signal.toFixed(digits));
   //log.debug('\t', 'macdiff:', macd.result.toFixed(digits));
}

// Based on the newly calculated
// information, check if we should
// update or not.
strat.check = function (candle) {
  // advice variables
  // -2 = strong sell
  // -1 = sell
  // 0 = neutral
  // 1 = buy
  // 2 = strong buy
  var bbAdvice = 0
  var rsiAdvice = 0;
  var macdAdvice = 0;
  var resultAdvice = 0;

  var bb = this.indicators.bb;
  var price = candle.close;
  this.nsamples++;

  var rsi = this.indicators.rsi;
  var rsiVal = rsi.result;

  var macd = this.indicators.macd;
  var macddiff = this.indicators.macd.result;

  if(this.settings.bbands.active){
    if(price <= bb.lower) bbAdvice = 2;
    else if (price < bb.middle) bbAdvice = 1;
    else if (price >= bb.up) bbAdvice = -2;
    else if (price > bb.middle) bbAdvice = -1;
  }

  if(this.settings.rsi.active){
    if(rsiVal <= this.settings.rsi.strongLow) rsiAdvice = 2;
    else if(rsiVal < this.settings.rsi.low) rsiAdvice = 1;
    else if(rsiVal > this.settings.rsi.high) rsiAdvice = -1;
    else if(rsiVal >= this.settings.rsi.strongHigh) rsiAdvice = -2;
  }

  if(this.settings.macd.active){
    if(macddiff > this.settings.macd.up) macdAdvice = 2;
    else if(macddiff < this.settings.macd.down) macdAdvice = -2;
  }

  resultAdvice = bbAdvice + rsiAdvice + macdAdvice;
  log.debug('bbAdvice = ', bbAdvice);
  log.debug('rsiAdvice = ', rsiAdvice);
  log.debug('macdAdvice = ', macdAdvice);
  log.debug('resultAdvice = ', resultAdvice);
  
  //uptrend
  if (resultAdvice > 0) {
      // new trend detected
      if(this.trend.direction !== 'up'){
         // reset the state for the new trend
        this.trend = {
          duration: 0,
          persisted: false,
          direction: 'up',
          adviced: false
        };
      }
      this.trend.duration++;
      log.debug('In uptrend since', this.trend.duration, 'candle(s)');

      if(this.trend.duration >= this.settings.persistence){
          this.trend.persisted = true;
      }

      if(this.trend.persisted && !this.trend.adviced) {
        this.trend.adviced = true;
        //this.advice('long');
        this.advice({
          direction: 'long',
          trigger: { // ignored when direction is not "long"
            type: 'trailingStop',
            trailPercentage: 8
            // or:
            // trailValue: 100
          }
        });
        log.debug('advice long');
      } else
        this.advice();
      
      return;
  }
  
  //downtrend
  if (resultAdvice < 0) {
    // new trend detected
    if(this.trend.direction !== 'down'){
      // reset the state for the new trend
      this.trend = {
      duration: 0,
      persisted: false,
      direction: 'down',
      adviced: false
      };
    }

    this.trend.duration++;

    log.debug('In downtrend since', this.trend.duration, 'candle(s)');

    if(this.trend.duration >= this.settings.persistence){
      this.trend.persisted = true;
    }

    if(this.trend.persisted && !this.trend.adviced) {
      this.trend.adviced = true;
      this.advice('short');
      //log.debug('advice short');
      this.advice({
        direction: 'short',
        trigger: { // ignored when direction is not "long"
          type: 'trailingStop',
          trailPercentage: 5
          // or:
          // trailValue: 100
        }
      });
    } else
      this.advice();

    return;
  }

  //no trend: if resultAdvice = 0
  this.trend.advice = '';
  this.advice();

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
