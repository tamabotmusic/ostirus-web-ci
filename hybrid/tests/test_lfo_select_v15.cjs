"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const source = fs.readFileSync(path.resolve(__dirname, '../ui/ti2-lfo-rate-v15.js'), 'utf8');
function fixture() {
  const buttons = [1, 2, 3].map(index => ({
    name:'LFO ' + index + ' SELECT', attrs:{}, listeners:{},
    classList:{add(){}},
    getAttribute(key) {return key === 'data-name' ? this.name : this.attrs[key] ?? null;},
    setAttribute(key,value) {this.attrs[key] = String(value);},
    addEventListener(type,fn) {(this.listeners[type] ||= []).push(fn);},
    dispatch(type,extra={}) {for(const fn of this.listeners[type] || []) fn({preventDefault(){},...extra});},
  }));
  const led = {fill:'#ec4566',state:'dsp'};
  const caption = {textContent:'original'};
  const svg = {querySelectorAll: selector => selector === '.ti2-button-group' ? buttons : []};
  const selected = {oscillator:2,filters:[2]};
  let snapshots = [];
  const window = {
    OsTIrusTI2Context:Object.freeze({
      getSelection:()=>selected,
      resolveCC:({label,baseCC})=>label==='RESONANCE'?43:baseCC,
    }),
    OsTIrusTI2Knobs:{refresh() {snapshots.push({
      rate:window.OsTIrusTI2Context.resolveCC({label:'RATE',baseCC:67}),
      resonance:window.OsTIrusTI2Context.resolveCC({label:'RESONANCE',baseCC:42}),
    });}},
  };
  const document = {
    querySelector: selector => selector==='#ti2-precision .ti2-photo-svg'?svg:null,
    getElementById: id => id==='ti2-precision-edit'?caption:null,
  };
  vm.runInNewContext(source,{window,document});
  return {window,buttons,caption,led,snapshots};
}

test('unknown startup selection preserves legacy RATE CC67 without fake LED feedback', () => {
  const {window,buttons,snapshots}=fixture();
  assert.equal(window.OsTIrusLFOFocus.current(),null);
  assert.equal(snapshots.at(-1).rate,67);
  assert.ok(buttons.every(button=>button.attrs['aria-pressed']==='false'));
});
test('LFO1 and LFO2 selectors remap RATE to verified CC67 and CC79', () => {
  const {window,buttons,snapshots}=fixture();
  buttons[1].dispatch('click');
  assert.equal(snapshots.at(-1).rate,79);
  assert.equal(snapshots.at(-1).resonance,43);
  assert.equal(window.OsTIrusTI2Context.getSelection().oscillator,2);
  assert.equal(window.OsTIrusTI2Context.getSelection().filters[0],2);
  buttons[0].dispatch('click');
  assert.equal(snapshots.at(-1).rate,67);
});
test('LFO3 selector binds RATE to the native parameter', () => {
  const {buttons,snapshots,caption}=fixture();
  buttons[2].dispatch('click');
  assert.equal(snapshots.at(-1).rate,'lfo3_rate');
  assert.match(caption.textContent,/página B/);
});
test('LFO keys are keyboard-accessible and repeated select does not invent a menu', () => {
  const {buttons,snapshots,caption}=fixture();
  buttons[1].dispatch('keydown',{key:'Enter'});
  assert.equal(snapshots.at(-1).rate,79);
  const previous=snapshots.length;
  buttons[1].dispatch('keydown',{key:' '});
  assert.equal(snapshots.length,previous);
  assert.match(caption.textContent,/menú de destinos pendiente/);
  assert.equal(buttons[1].attrs['aria-pressed'],'true');
  assert.equal(buttons[0].attrs['aria-pressed'],'false');
});
test('physical DSP LED visuals and geometry untouched', () => {
  const {buttons,led}=fixture();
  buttons[2].dispatch('click');
  assert.deepEqual(led,{fill:'#ec4566',state:'dsp'});
  assert.equal(source.includes('data-ti2-dsp-lfo'),false);
  assert.equal(source.includes('logoLedLevel'),false);
  assert.equal(source.includes('fetch('),false);
});
