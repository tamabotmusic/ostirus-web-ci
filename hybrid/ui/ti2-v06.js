"use strict";
/*
 * OsTIrus TI2 Desktop v0.6 — faithful physical topology, no ROM or photos.
 * The real TI2 front panel has 32 rotary controls and 42 tactile buttons.
 * Unmapped buttons are inert physical depictions, never fake controls.
 * Live CC dials send MIDI to the already working local native engine.
 */
(() => {
  const root = document.getElementById("ti2-v06");
  if (!root) throw new Error("OsTIrus TI2 v0.6 mount is missing");

  const dialGroups = {
    master: [["VOLUME",91,98]],
    modulators: [["LFO 1 RATE",67,64],["LFO 2 RATE",79,64]],
    oscillators: [["WAVE",17,64],["PULSE WIDTH",18,64],["WAVE SELECT",24,64],["SEMITONE",20,64],["FM AMOUNT",27,0]],
    mixer: [["OSC BALANCE",33,64],["OSC VOLUME",36,100]],
    filters: [["CUTOFF 1",40,110],["RESONANCE 1",42,20],["ENV AMOUNT",44,64],["FILTER BALANCE",48,64],["CUTOFF 2",41,100],["RESONANCE 2",43,25]],
    effects: [["SEND / GAIN",114,64],["TIME / COLOR",115,64],["FEEDBACK",116,64],["TYPE / MIX",104,64],["INTENSITY",107,64]],
    values: [["VALUE 1",null,64],["VALUE 2",null,64],["VALUE 3",null,64]],
    envFilter: [["ATTACK",54,0],["DECAY",55,64],["SUSTAIN",56,100],["RELEASE",58,40]],
    envAmp: [["ATTACK",59,0],["DECAY",60,64],["SUSTAIN",61,100],["RELEASE",63,40]]
  };
  const keys = {
    master: ["EDIT","ARP ON"],
    matrix: ["DEST −","DEST +","MOD SELECT"],
    modulators: ["EDIT","ENV MODE","LFO 1","LFO 2","LFO 3"],
    oscillators: ["SELECT","EDIT","OSC 3 ON","UNISON","SYNC","OSC 1/2"],
    filters: ["FILT 1","FILT 2","MODE","EDIT"],
    effects: ["DELAY SEL","DELAY EDIT","DIST SEL","DIST EDIT","CHORUS SEL","CHORUS EDIT","TRANS −","TRANS +"],
    navLeft: ["EXIT","TAP","EDIT","CONFIG","STORE","UNDO"],
    navRight: ["PART −","PART +","MULTI","SINGLE","SHIFT","SEARCH"],
    env: ["FILT EDIT","AMP EDIT"]
  };
  const numKnobs = Object.values(dialGroups).reduce((s,arr)=>s+arr.length,0);
  const numKeys = Object.values(keys).reduce((s,arr)=>s+arr.length,0);
  if (numKnobs !== 32 || numKeys !== 42) {
    throw new Error("TI2 panel geometry must be 32 knobs + 42 keys");
  }

  const led = (on=false) => '<i class="v06-led'+(on?' lit':'')+'" aria-hidden="true"></i>';
  const title = text => '<div class="v06-zone-title">'+text+'</div>';
  const tactile = (text, lit) =>
    '<span class="v06-hard-button" title="'+text+' · integración pendiente">'+
    '<span class="v06-button-face" aria-hidden="true"></span>'+
    '<span class="v06-button-caption">'+text+'</span>'+
    (lit?led(true):'')+'</span>';
  const keyset = (key, style="") =>
    '<div class="v06-buttons '+style+'">'+keys[key].map((x,i)=>tactile(x,i===0&&key!=="navRight")).join('')+'</div>';

  const dial = ([label,cc,initial]) => {
    const live = cc !== null;
    const attributes = live ? ' data-cc="'+cc+'" data-init="'+initial+'"' : ' data-static="1"';
    return '<div class="v06-dial'+(live?' is-live':'')+'"'+attributes+'>'+
      '<div class="v06-knob-shell">'+(live?
        '<button type="button" class="v06-knob" role="slider" aria-label="'+label+
        ' CC '+cc+'" aria-valuemin="0" aria-valuemax="127" aria-valuenow="'+initial+
        '" title="'+label+' · MIDI CC '+cc+' (valor de patch no sincronizado)"><span class="v06-knob-core"></span></button>':
        '<span class="v06-knob is-static" title="Edición de parámetros de pantalla pendiente"><span class="v06-knob-core"></span></span>')+
      '</div><span class="v06-knob-label">'+label+'</span></div>';
  };
  const dialset = (key, css) => '<div class="'+css+'">'+dialGroups[key].map(dial).join('')+'</div>';
  const leds = (names) => names.map((name,index)=>'<span>'+led(index===0)+' '+name+'</span>').join('');

  const parts = [];
  parts.push('<div class="v06-tophead"><div class="v06-brand"><span class="v06-brand-mark">✧</span>OsTIrus<small>TI²</small></div>');
  parts.push('<div class="v06-port-labels"><span>USB</span><span>MIDI IN</span><span>MIDI OUT</span><span>MIDI THRU</span><span>OUTPUTS 1–6</span></div></div>');
  parts.push('<div class="v06-layout">');

  parts.push('<section class="v06-zone v06-master">'+dialset('master','v06-volume')+
    '<div class="v06-master-arp">'+title('ARP')+keyset('master')+'</div></section>');

  parts.push('<section class="v06-zone v06-matrix">'+title('MATRIX')+
    '<div class="v06-matrix-copy">DEMOMODE<br>PRESS + HOLD</div>'+keyset('matrix')+
    '<div class="v06-matrix-leds"><strong>MOD</strong>'+leds(['SLOT 1','SLOT 2','SLOT 3','SLOT 4','SLOT 5','SLOT 6'])+'</div></section>');

  parts.push('<section class="v06-zone v06-modulators">'+title('MODULATORS')+
    '<div class="v06-mod-leds">'+leds(['LFO 1','LFO 2','LFO 3'])+'</div>'+
    '<div class="v06-mod-waves">〜　⌁　∩　△</div>'+dialset('modulators','v06-mod-knobs')+keyset('modulators')+'</section>');

  parts.push('<section class="v06-zone v06-oscillators">'+title('OSCILLATORS')+
    dialset('oscillators','v06-osc-knobs')+
    '<div class="v06-osc-types">'+leds(['CLASSIC','HYPERSAW','WAVETABLE','GRAIN','FORMANT'])+'</div>'+
    keyset('oscillators')+'</section>');

  parts.push('<section class="v06-zone v06-middle v06-mixer">'+title('MIXER')+
    dialset('mixer','v06-mixer-knobs')+'<div class="v06-mixer-symbol">✥</div>'+
    '<div class="v06-mixer-copy">OSCILLATOR<br>FILTER<br>OUTPUT</div></section>');

  parts.push('<section class="v06-zone v06-filters">'+title('FILTERS')+
    '<div class="v06-filter-labels">'+led(true)+' FILTER 1　　'+led()+' FILTER 2</div>'+
    dialset('filters','v06-filter-knobs')+
    '<div class="v06-filter-types">CUTOFF · RESONANCE · ENV · BALANCE</div>'+
    keyset('filters')+'</section>');

  parts.push('<section class="v06-zone v06-effects">'+title('EFFECTS')+
    '<div class="v06-fx-leds">'+leds(['DELAY','REVERB','LOW EQ','MID EQ','HIGH EQ','DISTORTION','CHORUS','PHASER'])+'</div>'+
    dialset('effects','v06-fx-dials')+keyset('effects')+'</section>');

  parts.push('<section class="v06-zone v06-center">'+
    '<div class="v06-screen-assembly">'+
      '<div class="v06-nav-col">'+keyset('navLeft','v06-nav')+'</div>'+
      '<div class="v06-screen-center"><div class="v06-lcd-frame"><div class="v06-lcd">'+
        '<div class="v06-lcd-header" id="v06-lcd-head">SINGLE　　PATCH 001 / 128</div>'+
        '<div class="v06-lcd-name" id="v06-lcd-patch">PROGRAM 001</div>'+
        '<div class="v06-lcd-section" id="v06-lcd-param">TI2 DESKTOP · OsTIrus</div>'+
        '<div class="v06-lcd-data" id="v06-lcd-data">PARAMETER STATE NOT YET READ</div>'+
        '</div><span class="v06-lcd-sign">OsTIrus TI²</span></div>'+
        dialset('values','v06-soft-values')+
      '</div><div class="v06-nav-col">'+keyset('navRight','v06-nav')+'</div></div></section>');

  parts.push('<section class="v06-zone v06-envelopes">'+title('ENVELOPES')+
    '<div class="v06-env-title">FILTER ENVELOPE　'+led(true)+'</div>'+
    dialset('envFilter','v06-env-knobs')+
    '<div class="v06-env-title">AMPLIFIER ENVELOPE　'+led()+'</div>'+
    dialset('envAmp','v06-env-knobs')+keyset('env')+'</section>');

  parts.push('</div><div class="v06-etched-footer"><span>TI2 DESKTOP · 32 KNOBS · 42 PHYSICAL KEYS</span>'+
    '<span>OS-TI / HARDWARE PANEL · PATCH VALUES REQUIRE SYNC</span></div>');
  root.innerHTML = parts.join('');

  const selector = document.getElementById('program');
  const lcdParam = document.getElementById('v06-lcd-param');
  const lcdData = document.getElementById('v06-lcd-data');
  const patchInfo = () => {
    const program = Number(selector.value)+1;
    document.getElementById('v06-lcd-head').textContent =
      'SINGLE　　PATCH '+String(program).padStart(3,'0')+' / 128';
    document.getElementById('v06-lcd-patch').textContent =
      'PROGRAM '+String(program).padStart(3,'0');
    lcdParam.textContent='PATCH CHANGED';
    lcdData.textContent='KNOB VALUES NOT YET SYNCHRONIZED';
  };
  selector.addEventListener('change',patchInfo);
  patchInfo();

  const sendCC = async(cc,value) => {
    const r = await fetch('/api/midi',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({type:'cc',controller:cc,value}),cache:'no-store'
    });
    if(!r.ok)throw new Error('MIDI CC not accepted');
  };
  for (const wrapper of root.querySelectorAll('.v06-dial.is-live')) {
    const cc=Number(wrapper.dataset.cc), initial=Number(wrapper.dataset.init);
    const button=wrapper.querySelector('button.v06-knob');
    const core=button.querySelector('.v06-knob-core');
    const name=wrapper.querySelector('.v06-knob-label').textContent;
    let value=initial, drag=null, pending=false, touched=false;
    function paint() {
      core.style.setProperty('--angle',(-135+270*value/127)+'deg');
      button.setAttribute('aria-valuenow',String(value));
    }
    function setValue(v) {
      const next=Math.min(127,Math.max(0,Math.round(v)));
      if(touched&&next===value)return;
      value=next;
      touched=true;
      paint();
      lcdParam.textContent=name;
      lcdData.textContent='CC '+cc+' · '+value+' / 127 · SENT';
      if(!pending) {
        pending=true;
        requestAnimationFrame(()=>{
          pending=false;
          sendCC(cc,value).catch(()=>{
            lcdParam.textContent='MIDI CC ERROR';
            lcdData.textContent='CC '+cc+' NOT DELIVERED';
          });
        });
      }
    }
    button.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      drag={y:e.clientY,original:value,id:e.pointerId};
      button.setPointerCapture(e.pointerId);e.preventDefault();
    });
    button.addEventListener('pointermove',e=>{
      if(drag&&e.pointerId===drag.id)setValue(drag.original+(drag.y-e.clientY)*1.25);
    });
    button.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id)drag=null;});
    button.addEventListener('pointercancel',()=>{drag=null;});
    button.addEventListener('lostpointercapture',()=>{drag=null;});
    button.addEventListener('wheel',e=>{e.preventDefault();setValue(value+(e.deltaY<0?2:-2));},{passive:false});
    button.addEventListener('keydown',e=>{
      const step=e.shiftKey?10:1;
      if(e.key==='ArrowUp'||e.key==='ArrowRight')setValue(value+step);
      else if(e.key==='ArrowDown'||e.key==='ArrowLeft')setValue(value-step);
      else if(e.key==='Home')setValue(0);
      else if(e.key==='End')setValue(127);
      else return;
      e.preventDefault();
    });
    button.addEventListener('dblclick',()=>setValue(initial));
    paint();
  }
})();
