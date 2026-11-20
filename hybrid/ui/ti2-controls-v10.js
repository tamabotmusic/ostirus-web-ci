"use strict";
/** TI2 hardware parity v0.10: momentary SHIFT and SHIFT + VALUE 3 / PROGRAM.
 * Manufacturer's panel: VALUE 3 adjusts the LCD parameter; PROGRAM is the
 * red secondary legend, reached by holding SHIFT. The v0.8 prototype let
 * VALUE 3 change programs without SHIFT; this layer corrects that deviation.
 *
 * No menu readback exists: with no SHIFT, VALUE 3 deliberately does nothing.
 * Mouse users may click SHIFT to arm it for ONE control gesture; this is an
 * accessibility equivalent of holding the physical key, not a new DSP mode.
 * No changes to firmware, native engine, patch data, or the approved drawing.
 */
(() => {
  const svg=document.querySelector('#ti2-precision .ti2-photo-svg');
  const programs=window.OsTIrusProgram;
  const knob=svg?.querySelector('.ti2-knob[data-label="VALUE 3"]');
  const shift=[...(svg?.querySelectorAll('.ti2-button-group')||[])]
    .find(node=>node.getAttribute('data-name')==='SHIFT');
  if(!svg||!programs||!knob||!shift)throw Error('TI2 hardware modifier: missing controls');

  const edit=document.getElementById('ti2-precision-edit');
  let held=false,armed=false,usedWhileHeld=false,heldPointer=null;
  const status=text=>{if(edit)edit.textContent=text;};
  function refresh(){
    const active=held||armed;
    shift.classList.toggle('control-active',active);
    shift.setAttribute('aria-pressed',String(active));
    shift.setAttribute('aria-label',active?'SHIFT activo; siguiente gesto compatible':
      'SHIFT; mantén pulsado para funciones secundarias o pulsa para el próximo gesto');
    shift.setAttribute('data-modifier',active?'active':'inactive');
    knob.setAttribute('data-shift-required','true');
    knob.setAttribute('data-action','program-encoder-with-shift');
    knob.setAttribute('aria-label','VALUE 3: parámetro de pantalla; SHIFT más VALUE 3: seleccionar programa');
    knob.setAttribute('aria-description','Sin menú disponible. Mantén SHIFT del teclado o pulsa el botón SHIFT del panel antes de girar.');
  }
  function modifier(event){
    return Boolean(event.shiftKey||held||armed);
  }
  function consume(event){
    if(!modifier(event))return false;
    if(held)usedWhileHeld=true;
    armed=false;
    refresh();
    return true;
  }
  function unsupported(){
    status('VALUE 3 · función de pantalla pendiente; mantén SHIFT para PROGRAM');
  }
  shift.classList.add('control-live');
  shift.setAttribute('role','button');
  shift.setAttribute('tabindex','0');
  shift.setAttribute('data-action','shift');
  shift.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    held=true;heldPointer=event.pointerId;usedWhileHeld=false;
    shift.setPointerCapture(event.pointerId);
    refresh();event.preventDefault();
  });
  function release(event){
    if(heldPointer!==event.pointerId)return;
    held=false;heldPointer=null;refresh();
  }
  shift.addEventListener('pointerup',release);
  shift.addEventListener('pointercancel',event=>{
    release(event);usedWhileHeld=true;
  });
  shift.addEventListener('lostpointercapture',()=>{
    held=false;heldPointer=null;refresh();
  });
  shift.addEventListener('click',()=>{
    if(usedWhileHeld){usedWhileHeld=false;return;}
    armed=!armed;
    refresh();
    status(armed?'SHIFT preparado · gira VALUE 3 para cambiar programa':
      'SHIFT desactivado');
  });
  shift.addEventListener('keydown',event=>{
    if(event.key!=='Enter'&&event.key!==' ')return;
    event.preventDefault();
    armed=!armed;refresh();
    status(armed?'SHIFT preparado · siguiente control':'SHIFT desactivado');
  });
  window.addEventListener('blur',()=>{
    held=false;armed=false;heldPointer=null;usedWhileHeld=false;refresh();
  });

  // Capture BEFORE the existing v0.8 listeners; suppress only actions
  // whose modifier is absent. All other knobs and buttons are unaffected.
  knob.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    if(!consume(event)){
      event.stopImmediatePropagation();unsupported();
    }
  },true);
  knob.addEventListener('wheel',event=>{
    if(!consume(event)){
      event.preventDefault();event.stopImmediatePropagation();unsupported();
    }
  },{capture:true,passive:false});
  const keySteps={ArrowUp:1,ArrowRight:1,ArrowDown:-1,ArrowLeft:-1,
    PageUp:10,PageDown:-10,Home:-127,End:127};
  knob.addEventListener('keydown',event=>{
    if(!(event.key in keySteps))return;
    event.preventDefault();event.stopImmediatePropagation();
    if(!consume(event)){unsupported();return;}
    // Shift+Arrow means a single encoder detent, not a 10-patch jump.
    programs.step(keySteps[event.key]);
  },true);
  refresh();
  const oscillatorKeys = [
    {label:'OSC 3 ON', field:'osc3', type:'osc3_mode',
      active:value=>value>0, next:state=>state.osc3 ? 0 : state.osc3Backup},
    {label:'SYNC', field:'sync', type:'osc_sync',
      active:value=>value===1, next:state=>1-state.sync},
    {label:'MONO', field:'keyMode', type:'key_mode',
      active:value=>value>=1 && value<=4,
      next:(state,shifted)=>shifted ? (state.keyMode+1)%6 :
        state.keyMode>=1 && state.keyMode<=4 ? 0 : state.monoBackup},
  ];
  let oscillatorState=null;
  for(const key of oscillatorKeys){
    const node=[...svg.querySelectorAll('.ti2-button-group')]
      .find(button=>button.getAttribute('data-name')===key.label);
    if(!node)continue;
    let pending=null;
    function render(){
      const value=oscillatorState?.[key.field];
      if(pending && (value===pending.value || Date.now()>=pending.until))pending=null;
      const ready=Number.isInteger(value);
      node.classList.toggle('control-live',ready);
      node.classList.toggle('control-active',ready && key.active(value));
      node.setAttribute('aria-disabled',String(!ready || Boolean(pending)));
      node.setAttribute('aria-pressed',String(ready && key.active(value)));
    }
    function activate(event){
      if(!oscillatorState || pending)return;
      const value=key.next(oscillatorState,key.field==='keyMode' && consume(event));
      const request={value,until:Date.now()+3000};
      pending=request;
      render();
      window.OsTIrusSendMidi({type:key.type,value}).catch(()=>{
        if(pending===request)pending=null;
        render();
        status('MIDI ERROR · HOST NO DISPONIBLE');
      });
    }
    node.setAttribute('role','button');
    node.setAttribute('tabindex','0');
    node.setAttribute('aria-label',key.label);
    node.addEventListener('click',activate);
    node.addEventListener('keydown',event=>{
      if(event.key!=='Enter' && event.key!==' ')return;
      event.preventDefault();
      if(!event.repeat)activate(event);
    });
    window.addEventListener('ti2-oscillator-readback',event=>{
      oscillatorState=event.detail;
      if(!oscillatorState)pending=null;
      render();
    });
    render();
  }
  window.OsTIrusModifier=Object.freeze({
    state:()=>({held,armed}),
    reset:()=>{held=false;armed=false;heldPointer=null;refresh();},
  });
})();
