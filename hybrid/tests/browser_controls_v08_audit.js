"use strict";
/* ROM-free end-to-end browser audit for v0.8. Run only with ?audit=1. */
(() => {
  if (!location.search.includes('audit=1')) return;
  const report = { checks: {}, programsSent: [], errors: [] };
  const check = (name, condition) => {
    report.checks[name] = !!condition;
    if (!condition) report.errors.push(name);
  };
  const program = window.OsTIrusProgram;
  const selector = document.getElementById('program');
  const svg = document.querySelector('#ti2-precision .ti2-photo-svg');
  const getButton = name => [...svg.querySelectorAll('.ti2-button-group')]
    .find(node => node.getAttribute('data-name') === name);
  const minus = getButton('VALUE −'), plus = getButton('VALUE +');
  const knob = svg.querySelector('.ti2-knob[data-label="VALUE 3"]');
  const lcd = svg.querySelector('.lcd-title');
  const needle = knob?.querySelector('line:not(.ti2-dial-tick)');
  const arrow = (key, shiftKey = false) =>
    knob.dispatchEvent(new KeyboardEvent('keydown', { key, shiftKey, bubbles: true, cancelable: true }));
  check('physical_inventory',svg.querySelectorAll('.ti2-knob').length === 32 &&
    svg.querySelectorAll('.ti2-button-group').length === 43);
  check('program_api_present',!!program && typeof program.step === 'function');
  check('value_buttons_accessible',!!minus && !!plus &&
    minus.getAttribute('role') === 'button' && plus.getAttribute('role') === 'button' &&
    minus.getAttribute('tabindex') === '0' && plus.getAttribute('tabindex') === '0');
  check('value3_contextual_no_fake_cc',!!knob && !knob.hasAttribute('data-cc') &&
    knob.getAttribute('role') === 'slider' && knob.getAttribute('aria-valuemax') === '128');
  check('initial_lcd_001',lcd?.textContent === 'PROGRAM 001');
  check('approved_resting_needle_unchanged',!needle.hasAttribute('transform'));

  plus.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  check('plus_click',program.current() === 1 && lcd.textContent === 'PROGRAM 002');
  plus.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
  check('plus_keyboard',program.current() === 2);
  minus.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true }));
  check('minus_keyboard',program.current() === 1);
  knob.dispatchEvent(new WheelEvent('wheel', { deltaY: -100, bubbles: true, cancelable: true }));
  check('value3_wheel',program.current() === 2);
  arrow('ArrowUp', true);
  check('value3_shift_arrow',program.current() === 12);
  selector.value = '23';
  selector.dispatchEvent(new Event('change', { bubbles: true }));
  check('dropdown_sync',program.current() === 23 && lcd.textContent === 'PROGRAM 024');
  program.select(30);
  check('api_sync',program.current() === 30 && knob.getAttribute('aria-valuenow') === '31');
  program.step(-100);
  check('lower_boundary',program.current() === 0);
  program.step(200);
  check('upper_boundary',program.current() === 127 && lcd.textContent === 'PROGRAM 128' &&
    needle.getAttribute('transform') === 'rotate(130)');
  const unchanged = program.step(1);
  check('no_wrap_or_duplicate_at_boundary',unchanged === false && program.current() === 127);
  check('other_buttons_remain_unmapped',!getButton('ARP ON').hasAttribute('data-action') &&
    !getButton('OSC SELECT').hasAttribute('data-action'));
  check('no_fake_firmware_leds',[...svg.querySelectorAll('[data-state]')]
    .every(node => node.getAttribute('data-state') === 'unavailable'));

  setTimeout(() => {
    report.programsSent = window.__ti2TestMidi?.filter(x => x.type === 'program').map(x => x.program) || [];
    check('exactly_one_program_change_per_action',
      JSON.stringify(report.programsSent) === JSON.stringify([1,2,1,2,12,23,30,0,127]));
    const pre = document.createElement('pre');
    pre.id = 'ti2-v08-functional-audit';
    pre.hidden = true;
    pre.textContent = JSON.stringify(report);
    document.body.appendChild(pre);
  }, 200);
})();
