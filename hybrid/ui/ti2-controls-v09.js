"use strict";
/** OsTIrus TI2 v0.9: shared physical OSC and FILTER focus.
 * Source: Access Virus TI2 Quickstart, Oscillator/Filter sections; Virus TI
 * MIDI controller chart. Selection LEDs indicate *local focus only*.
 * OSC SELECT skips oscillator 3 when native readback reports it disabled.
 * Geometry and approved v0.7 silkscreen remain unchanged.
 */
(() => {
  const svg=document.querySelector('#ti2-precision .ti2-photo-svg');
  const knobs=window.OsTIrusTI2Knobs;
  if(!svg || !knobs) return;

  // null = focus not explicitly chosen by this browser. Preserve the v0.8
  // default CC path for OSC1 and Filter1, but keep ALL selection LEDs dark.
  let oscillator=null;
  let osc3Enabled=null;
  let filters=[];
  const effectiveOsc=()=>oscillator===null?1:oscillator;
  const effectiveFilters=()=>filters.length?filters:[1];

  const context=Object.freeze({
    resolveCC:({label,baseCC})=>{
      const osc=effectiveOsc();
      if(label==='WAVE') return {1:17,2:22,3:null}[osc];
      // This is WAVE SELECT only. Pulsewidth depends on oscillator mode,
      // which cannot be read from the native host yet.
      if(label==='WAVE SELECT/PW') return {1:19,2:24,3:null}[osc];
      if(label==='SEMITONE') return {1:20,2:25,3:null}[osc];
      if(label==='DETUNE 2/3') return osc===2?26:null;
      if(label==='RESONANCE') return effectiveFilters().map(f=>f===1?42:43);
      if(label==='ENV AMOUNT') return effectiveFilters().map(f=>f===1?44:45);
      return baseCC;
    },
    getSelection:()=>({oscillator,filters:[...filters]}),
  });
  window.OsTIrusTI2Context=context;

  const getButton=name=>[...svg.querySelectorAll('.ti2-button-group')]
    .find(node=>node.getAttribute('data-name')===name);
  const selectOsc=getButton('OSC SELECT');
  const selectF1=getButton('FILTER SELECT LEFT');
  const selectF2=getButton('FILTER SELECT RIGHT');
  if(!selectOsc||!selectF1||!selectF2)throw Error('TI2 selector caps missing');

  const oscLEDs=[1,2,3].map(i=>svg.querySelector('[data-ti2-osc-select-led="'+i+'"]'));
  const filterLEDs=[1,2].map(i=>svg.querySelector('[data-ti2-filter-select-led="'+i+'"]'));
  if([...oscLEDs,...filterLEDs].some(node=>!node))throw Error('TI2 selector LEDs missing');

  const editStatus=document.getElementById('ti2-precision-edit');
  const status=text=>{if(editStatus)editStatus.textContent=text+' · selección local, sin lectura de firmware';};
  function refresh(){
    oscLEDs.forEach((led,i)=>{
      const selected=oscillator===i+1;
      led.setAttribute('data-state',selected?'local':'unavailable');
      led.setAttribute('aria-label','OSC '+(i+1)+(selected?' seleccionado localmente':' no seleccionado'));
    });
    filterLEDs.forEach((led,i)=>{
      const selected=filters.includes(i+1);
      led.setAttribute('data-state',selected?'local':'unavailable');
      led.setAttribute('aria-label','FILT '+(i+1)+(selected?' seleccionado localmente':' no seleccionado'));
    });
    selectOsc.setAttribute('aria-label','OSC SELECT: '+(oscillator===null?'foco local no elegido':'OSC '+oscillator));
    selectF1.setAttribute('aria-pressed',String(filters.includes(1)));
    selectF2.setAttribute('aria-pressed',String(filters.includes(2)));
    knobs.refresh();
  }
  function makeKey(node,action,label,callback){
    node.classList.add('control-live');
    node.setAttribute('role','button');
    node.setAttribute('tabindex','0');
    node.setAttribute('data-action',action);
    node.setAttribute('aria-label',label);
    node.addEventListener('click',event=>callback(event.shiftKey));
    node.addEventListener('keydown',event=>{
      if(event.key!=='Enter'&&event.key!==' ')return;
      event.preventDefault();
      callback(event.shiftKey);
    });
  }
  makeKey(selectOsc,'oscillator-focus','Seleccionar oscilador; solo selección local',()=>{
    oscillator=oscillator===null || oscillator===(osc3Enabled===false?2:3)?1:oscillator+1;
    refresh();
    status('OSC '+oscillator+(oscillator===3?' · sin CC estándar para los encoders compartidos':''));
  });
  window.addEventListener('ti2-oscillator-readback',event=>{
    osc3Enabled=event.detail ? event.detail.osc3>0 : null;
    if(osc3Enabled===false && oscillator===3){
      oscillator=1;
      refresh();
    }
  });
  function selectFilter(f,combined){
    // The TI2 manual allows both filters to be selected together.
    // Shift+click (or Shift+Enter) emulates pressing both physical SELECT
    // buttons simultaneously, which is not possible with a single mouse.
    filters=combined? [...new Set([...effectiveFilters(),f])].sort() : [f];
    refresh();
    status('FILTER '+filters.join(' + '));
  }
  makeKey(selectF1,'filter-focus-1','Seleccionar Filter 1 (Shift: ambos filtros)',
    combined=>selectFilter(1,combined));
  makeKey(selectF2,'filter-focus-2','Seleccionar Filter 2 (Shift: ambos filtros)',
    combined=>selectFilter(2,combined));
  refresh();
})();
