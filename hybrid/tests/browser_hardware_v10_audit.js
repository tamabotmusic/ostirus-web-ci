"use strict";
/* ROM-free v0.10 hardware-parity audit; runs in actual Chromium. */
(()=>{
  if(!location.search.includes('audit=1'))return;
  const svg=document.querySelector('.ti2-photo-svg');
  const program=window.OsTIrusProgram,mod=window.OsTIrusModifier;
  const report={checks:{},programsSent:[],errors:[]};
  const check=(name,ok)=>{report.checks[name]=!!ok;if(!ok)report.errors.push(name);};
  const button=name=>[...svg.querySelectorAll('.ti2-button-group')]
    .find(n=>n.getAttribute('data-name')===name);
  const knob=svg.querySelector('.ti2-knob[data-label="VALUE 3"]');
  const shift=button('SHIFT');
  const wheel=shiftKey=>knob.dispatchEvent(new WheelEvent('wheel',
    {deltaY:-100,shiftKey,bubbles:true,cancelable:true}));
  const arrow=(key,shiftKey=false)=>knob.dispatchEvent(new KeyboardEvent('keydown',
    {key,shiftKey,bubbles:true,cancelable:true}));
  const click=name=>button(name).dispatchEvent(new MouseEvent('click',{bubbles:true}));
  check('approved_geometry',svg.querySelectorAll('.ti2-knob').length===32&&
    svg.querySelectorAll('.ti2-button-group').length===43);
  check('modifier_api',typeof mod?.state==='function'&&typeof mod?.reset==='function');
  check('shift_initially_off',mod.state().armed===false&&mod.state().held===false&&
    !shift.classList.contains('control-active'));
  check('value3_secondary_program_legend',knob.getAttribute('data-shift-required')==='true'&&
    knob.getAttribute('data-action')==='program-encoder-with-shift');
  wheel(false);arrow('ArrowUp');
  check('unshifted_value3_is_not_program',program.current()===0);
  click('SHIFT');
  check('click_shift_arms_next_gesture',mod.state().armed&&shift.classList.contains('control-active')&&
    shift.getAttribute('aria-pressed')==='true');
  wheel(false);
  check('armed_shift_program_changes_once',program.current()===1&&!mod.state().armed);
  wheel(false);
  check('modifier_is_one_shot',program.current()===1);
  arrow('ArrowUp',true);
  check('keyboard_shift_arrow_is_one_detent',program.current()===2);
  arrow('ArrowUp',true);
  check('keyboard_shift_not_ten_programs',program.current()===3);
  arrow('ArrowDown');
  check('unshifted_arrow_inert',program.current()===3);
  click('VALUE +');
  check('value_plus_still_changes_program',program.current()===4);
  click('VALUE −');
  check('value_minus_still_changes_program',program.current()===3);
  click('SHIFT');arrow('ArrowDown');
  check('armed_shift_arrow_works_and_clears',program.current()===2&&!mod.state().armed);
  click('SHIFT');click('SHIFT');
  check('shift_can_be_disarmed',!mod.state().armed&&!shift.classList.contains('control-active'));
  click('OSC SELECT');
  check('osc_focus_preserved',window.OsTIrusTI2Context.getSelection().oscillator===1);
  click('FILTER SELECT RIGHT');
  check('filter_focus_preserved',window.OsTIrusTI2Context.getSelection().filters.join(',')==='2');
  check('other_unmapped_buttons_remain_inert',!button('ARP ON').hasAttribute('data-action')&&
    !button('OSC EDIT').hasAttribute('data-action'));
  setTimeout(()=>{
    report.programsSent=window.__ti2TestMidi.filter(x=>x.type==='program').map(x=>x.program);
    check('exact_program_change_sequence',
      JSON.stringify(report.programsSent)===JSON.stringify([1,2,3,4,3,2]));
    check('no_unsupported_midi_actions',window.__ti2TestMidi.every(x=>x.type==='program'));
    const pre=document.createElement('pre');pre.id='ti2-v10-hardware-audit';pre.hidden=true;
    pre.textContent=JSON.stringify(report);document.body.appendChild(pre);
  },350);
})();
