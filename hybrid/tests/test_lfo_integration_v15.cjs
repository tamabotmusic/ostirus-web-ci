'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const ui=path.resolve(__dirname,'../ui');
class Element {
 constructor(tag='div'){this.tag=tag;this.attrs={};this.children=[];this.listeners={};this.style={};this.textContent='';this.value='0';this.classList={add:(...classes)=>{this.setAttribute('class',[this.getAttribute('class'),...classes].filter(Boolean).join(' '));},toggle:()=>{}};}
 getAttribute(name){return this.attrs[name]??null;}
 setAttribute(name,value){this.attrs[name]=String(value);}
 removeAttribute(name){delete this.attrs[name];}
 appendChild(child){this.children.push(child);return child;}
 addEventListener(event,listener){(this.listeners[event]??=[]).push(listener);}
 fire(event,props={}){for(const fn of this.listeners[event]||[])fn({type:event,deltaY:-1,button:0,preventDefault(){},...props});}
 querySelectorAll(selector){
  const match=/^(\w+)?(?:\.([\w-]+))?(?:\[([\w-]+)(?:="([^"]+)")?\])?$/.exec(selector);
  if(!match)throw Error('Unsupported selector '+selector);
  const [,tag,cls,attr,value]=match;
  const acc=[];
  const visit=node=>{if((!tag||node.tag===tag)&&(!cls||(node.getAttribute('class')||'').split(' ').includes(cls))&&(!attr||node.getAttribute(attr)!==null&&(value===undefined||node.getAttribute(attr)===value)))acc.push(node);node.children.forEach(visit);};
  this.children.forEach(visit);return acc;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]??null;}
}
function fixture(){
 const panel=new Element(), program=new Element('select'), caption=new Element();
 const ids={'ti2-precision':panel,program,'ti2-precision-edit':caption};
 const document={getElementById:id=>ids[id]??new Element(),createElementNS:(_ns,tag)=>new Element(tag),querySelector:selector=>selector==='#ti2-precision .ti2-photo-svg'?panel.querySelector('.ti2-photo-svg'):null};
 const messages=[];const frame=[];
 const listeners = new Map();
 const window={
  addEventListener(name, handler) {
   if (!listeners.has(name)) listeners.set(name, []);
   listeners.get(name).push(handler);
  },
  dispatchEvent(event) {
   for (const handler of listeners.get(event.type) ?? []) handler(event);
  },
  OsTIrusProgram: {step() {}},
  OsTIrusSendMidi:message=>{messages.push(message);return Promise.resolve();}};
 const ctx=vm.createContext({document,window,Map,Set,Promise,console,
  requestAnimationFrame:fn=>frame.push(fn)});
 for(const file of ['ti2-precision.js','ti2-controls-v09.js','ti2-controls-v10.js','ti2-lfo-rate-v15.js'])
  vm.runInContext(fs.readFileSync(path.join(ui,file),'utf8'),ctx,{filename:file});
 const svg=panel.querySelector('.ti2-photo-svg');
 const buttons=svg.querySelectorAll('.ti2-button-group');
 const button=i=>buttons.find(b=>b.getAttribute('data-name')==='LFO '+i+' SELECT');
 const rate=svg.querySelector('.ti2-knob[data-label="RATE"]');
 return {window,svg,button,rate,messages,frame,caption};
}

test('actual panel has 32 knobs, 43 buttons, LFO LED geometry and RATE CC67 on startup',()=>{
 const {svg,button,rate}=fixture();
 assert.equal(rate.getAttribute('data-cc'),'67');
 for(const i of [1,2,3])assert.ok(button(i));
 assert.equal(svg.querySelectorAll('.ti2-knob').length,32);
 assert.equal(svg.querySelectorAll('.ti2-button-group').length,43);
 for(const i of [1,2,3])assert.ok(svg.querySelector('[data-ti2-dsp-lfo="'+i+'"]'));
});

test('physical RATE wheel issues CC79 after LFO2 SELECT; LFO3 RATE sends a dedicated parameter',()=>{
 const {button,rate,messages,frame,window}=fixture();
 button(2).fire('click');
 assert.equal(rate.getAttribute('data-cc'),'79');
 rate.fire('wheel');
 while(frame.length)frame.shift()();
 assert.equal(messages.length,1);
 assert.equal(messages[0].controller,79);
 button(3).fire('click');
 assert.equal(rate.getAttribute('aria-disabled'),'false');
 assert.equal(rate.getAttribute('data-cc'),null);
 rate.fire('wheel');
 while(frame.length)frame.shift()();
 assert.equal(messages.length,2);
 assert.equal(messages[1].type,'lfo3_rate');
 assert.equal(messages[1].value,65);
 assert.equal(window.OsTIrusTI2Context.getSelection().lfo,3);
});

test('clicking a top LFO indicator selects the matching RATE context and highlights its SELECT button',()=>{
 const {svg,button,rate}=fixture();
 const first=svg.querySelector('[data-ti2-lfo-selector="1"]');
 const second=svg.querySelector('[data-ti2-lfo-selector="2"]');
 second.fire('click');
 assert.equal(button(2).getAttribute('aria-pressed'),'true');
 assert.equal(second.getAttribute('data-selected'),'true');
 assert.equal(rate.getAttribute('data-cc'),'79');
 assert.equal(second.querySelector('circle').getAttribute('fill'),'#242e31');
 button(1).fire('click');
 assert.equal(first.getAttribute('data-selected'),'true');
 assert.equal(second.getAttribute('data-selected'),'false');
 assert.equal(rate.getAttribute('data-cc'),'67');
});

test('oscillator keys use confirmed state, preserve mode choices and skip disabled OSC 3', () => {
 const {window, svg, messages} = fixture();
 const key = name => svg.querySelector('[data-name="' + name + '"]');
 const state = {osc3: 0, sync: 0, keyMode: 0, osc3Backup: 5, monoBackup: 3};
 const readback = detail => window.dispatchEvent({type: 'ti2-oscillator-readback', detail});
 const osc3 = key('OSC 3 ON');
 osc3.fire('click');
 assert.equal(messages.length, 0);
 readback(state);
 for (let i = 0; i < 3; i++) key('OSC SELECT').fire('click');
 assert.equal(window.OsTIrusTI2Context.getSelection().oscillator, 1);
 osc3.fire('click');
 osc3.fire('click');
 assert.equal(messages.length, 1);
 assert.equal(messages[0].type, 'osc3_mode');
 assert.equal(messages[0].value, 5);
 assert.equal(osc3.getAttribute('aria-pressed'), 'false');
 readback({...state, osc3: 5});
 assert.equal(osc3.getAttribute('aria-pressed'), 'true');
 key('SYNC').fire('click');
 key('MONO').fire('click');
 assert.equal(messages[1].type, 'osc_sync');
 assert.equal(messages[1].value, 1);
 assert.equal(messages[2].value, 3);
 readback({...state, osc3: 5, sync: 1, keyMode: 3});
 key('SHIFT').fire('click');
 key('MONO').fire('click');
 assert.equal(messages[3].type, 'key_mode');
 assert.equal(messages[3].value, 4);
 readback(null);
 assert.equal(osc3.getAttribute('aria-disabled'), 'true');
});
