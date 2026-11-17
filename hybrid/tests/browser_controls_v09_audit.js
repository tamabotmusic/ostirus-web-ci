"use strict";
/* ROM-free v0.9 Chromium control audit. */
(()=>{
  if(!location.search.includes('audit=1'))return;
  const svg=document.querySelector('.ti2-photo-svg');
  const ctx=window.OsTIrusTI2Context,programs=window.OsTIrusProgram;
  const report={checks:{},ccSent:[],errors:[]};
  const check=(name,ok)=>{report.checks[name]=!!ok;if(!ok)report.errors.push(name)};
  const button=name=>[...svg.querySelectorAll('.ti2-button-group')].find(n=>n.getAttribute('data-name')===name);
  const knob=(name,index=0)=>[...svg.querySelectorAll('.ti2-knob[data-label="'+name+'"]')][index];
  const cc=(name,index=0)=>knob(name,index)?.getAttribute('data-cc');
  const led=(kind,i)=>svg.querySelector('[data-ti2-'+kind+'-select-led="'+i+'"]');
  const click=(name,shiftKey=false)=>button(name).dispatchEvent(new MouseEvent('click',{bubbles:true,shiftKey}));
  const wheel=(name,index=0)=>knob(name,index).dispatchEvent(new WheelEvent('wheel',{deltaY:-100,bubbles:true,cancelable:true}));
  const ccs=()=>window.__ti2TestMidi.filter(x=>x.type==='cc');
  check('physical_inventory',svg.querySelectorAll('.ti2-knob').length===32&&svg.querySelectorAll('.ti2-button-group').length===43);
  check('v08_program_api',!!programs&&typeof programs.step==='function');
  check('all_selection_leds_off_on_load',[1,2,3].every(i=>led('osc',i).getAttribute('data-state')==='unavailable')&&
    [1,2].every(i=>led('filter',i).getAttribute('data-state')==='unavailable'));
  check('v08_default_cc',cc('WAVE')==='17'&&cc('RESONANCE')==='42'&&cc('ENV AMOUNT')==='44');
  check('envelope_ccs', ['54','55','56','58'].every((n,i)=>cc(['ATTACK','DECAY','SUSTAIN','RELEASE'][i])===n)&&
    ['59','60','61','63'].every((n,i)=>cc(['ATTACK','DECAY','SUSTAIN','RELEASE'][i],1)===n));
  check('filter_mode_leds_unavailable',[...svg.querySelectorAll('[data-ti2-filter-mode-right]')]
    .every(n=>n.getAttribute('data-state')==='unavailable'));
  click('OSC SELECT');
  check('osc1_focus',ctx.getSelection().oscillator===1&&led('osc',1).getAttribute('data-state')==='local'&&cc('WAVE')==='17');
  wheel('WAVE');
  click('OSC SELECT');
  check('osc2_ccs',ctx.getSelection().oscillator===2&&led('osc',2).getAttribute('data-state')==='local'&&
    led('osc',1).getAttribute('data-state')==='unavailable'&&cc('WAVE')==='22'&&
    cc('WAVE SELECT/PW')==='24'&&cc('SEMITONE')==='25'&&cc('DETUNE 2/3')==='26');
  check('osc2_value_unknown',knob('WAVE').getAttribute('aria-valuetext').includes('desconocido'));
  wheel('WAVE');wheel('DETUNE 2/3');
  click('OSC SELECT');
  check('osc3_unmapped',ctx.getSelection().oscillator===3&&cc('WAVE')===null&&
    cc('DETUNE 2/3')===null&&knob('WAVE').getAttribute('aria-disabled')==='true'&&cc('FM AMOUNT')==='27');
  const count=ccs().length;wheel('WAVE');
  check('osc3_does_not_send_cc',ccs().length===count);
  click('OSC SELECT');
  check('osc1_cached_local_value',ctx.getSelection().oscillator===1&&cc('WAVE')==='17'&&
    knob('WAVE').getAttribute('aria-valuenow')==='65');
  click('FILTER SELECT LEFT');
  check('filter1_focus',ctx.getSelection().filters.join(',')==='1'&&
    led('filter',1).getAttribute('data-state')==='local'&&cc('RESONANCE')==='42'&&cc('ENV AMOUNT')==='44');
  wheel('RESONANCE');
  click('FILTER SELECT RIGHT');
  check('filter2_ccs',ctx.getSelection().filters.join(',')==='2'&&
    led('filter',2).getAttribute('data-state')==='local'&&led('filter',1).getAttribute('data-state')==='unavailable'&&
    cc('RESONANCE')==='43'&&cc('ENV AMOUNT')==='45');
  wheel('RESONANCE');wheel('ENV AMOUNT');
  click('FILTER SELECT LEFT',true);
  check('both_filters',ctx.getSelection().filters.join(',')==='1,2'&&
    led('filter',1).getAttribute('data-state')==='local'&&led('filter',2).getAttribute('data-state')==='local'&&
    knob('RESONANCE').getAttribute('data-cc-list')==='42,43');
  wheel('RESONANCE');wheel('ATTACK');wheel('ATTACK',1);
  window.dispatchEvent(new CustomEvent('ti2-local-midi-cc',{detail:{controller:55,value:12}}));
  check('incoming_cc_local_cache',knob('DECAY').getAttribute('aria-valuenow')==='12');
  check('unmapped_controls_inert',!button('OSC EDIT').hasAttribute('data-action')&&
    !button('FILTER 1').hasAttribute('data-action')&&!button('ARP ON').hasAttribute('data-action'));
  // Allow the requestAnimationFrame MIDI batches to flush before patch change.
  setTimeout(()=>{
    report.ccSent=ccs().map(x=>[x.controller,x.value]);
    const expected=[[17,65],[22,65],[26,65],[42,65],[43,65],[45,65],[42,66],[43,66],[54,65],[59,65]];
    check('exact_cc_sequence',JSON.stringify(report.ccSent)===JSON.stringify(expected));
    const before=ccs().length;programs.select(1);
    check('patch_change_invalidates_cc_cache',knob('ATTACK').getAttribute('aria-valuenow')==='64'&&
      knob('ATTACK').getAttribute('aria-valuetext').includes('desconocido'));
    check('patch_change_no_extra_cc',ccs().length===before);
    const pre=document.createElement('pre');pre.id='ti2-v09-functional-audit';pre.hidden=true;
    pre.textContent=JSON.stringify(report);document.body.appendChild(pre);
  },350);
})();
