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
 const window={addEventListener(){}, dispatchEvent(){},
  OsTIrusSendMidi:message=>{messages.push(message);return Promise.resolve();}};
 const ctx=vm.createContext({document,window,Map,Set,Promise,console,
  requestAnimationFrame:fn=>frame.push(fn)});
 for(const file of ['ti2-precision.js','ti2-controls-v09.js','ti2-lfo-rate-v15.js'])
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

test('physical RATE wheel issues CC79 after LFO2 SELECT; LFO3 RATE never edits LFO1',()=>{
 const {button,rate,messages,frame,window}=fixture();
 button(2).fire('click');
 assert.equal(rate.getAttribute('data-cc'),'79');
 rate.fire('wheel');
 while(frame.length)frame.shift()();
 assert.equal(messages.length,1);
 assert.equal(messages[0].controller,79);
 button(3).fire('click');
 assert.equal(rate.getAttribute('aria-disabled'),'true');
 rate.fire('wheel');
 while(frame.length)frame.shift()();
 assert.equal(messages.length,1);
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
