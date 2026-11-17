"use strict";
/** OsTIrus TI2 Desktop front panel: coordinate-derived vector recreation.
 *  Reference geometry: user-supplied front-view photo of the original hardware.
 *  The hardware reference photo is NOT embedded, distributed or uploaded.
 *  Controls with confirmed CC mappings send messages to the existing local engine.
 *  All unimplemented physical buttons are disabled visual representations.
 */
(() => {
  const panel = document.getElementById('ti2-precision');
  if (!panel) return;
  const ns = 'http://www.w3.org/2000/svg';
  const create = (tag, props = {}, parent) => {
    const element = document.createElementNS(ns, tag);
    for (const [key, value] of Object.entries(props)) element.setAttribute(key, String(value));
    if (parent) parent.appendChild(element);
    return element;
  };
  const txt = (parent, x, y, value, cls = 'panel-legend', attrs = {}) => {
    const node = create('text', {x, y, class: cls, ...attrs}, parent);
    node.textContent = value;
    return node;
  };
  const rootSvg = create('svg', {
    viewBox: '0 0 1533 685', role: 'group',
    'aria-label': 'OsTIrus TI2 Desktop: frontal físico fiel, con controles MIDI locales',
    xmlns: ns
  }, panel);
  rootSvg.classList.add('ti2-photo-svg');
  const defs = create('defs', {}, rootSvg);
  // Registered against the owner's black TI2 photo (1533 × 685 px).
  // Apply a single face transform so controls, silkscreen and LEDs cannot drift apart.
  const svg = create('g', {transform:'translate(-30 -20) scale(1.018 1.017)',
    'data-registration':'TI2-black-photo-2026-11-17'}, rootSvg);
  const gradient = (id, stops, radial = false) => {
    const g = create(radial ? 'radialGradient' : 'linearGradient', {id, x1:'0%',y1:'0%',x2:'85%',y2:'100%'}, defs);
    stops.forEach(([position,color]) => create('stop', {offset:position,'stop-color':color},g));
  };
  gradient('chassis', [['0%','#303638'],['35%','#252b2e'],['74%','#292f32'],['100%','#1c2225']]);
  gradient('panelInset', [['0%','#3d484c'],['100%','#2a3033']]);
  gradient('knob', [['0%','#7c8788'],['28%','#495257'],['55%','#30373c'],['90%','#11171b'],['100%','#667073']]);
  gradient('button', [['0%','#657176'],['22%','#404a50'],['72%','#242b2f'],['100%','#12181c']]);
  gradient('display', [['0%','#d7f1f0'],['43%','#a4d8df'],['100%','#6da3b4']]);
  const filter = create('filter',{id:'steelNoise',x:'0',y:'0',width:'100%',height:'100%'},defs);
  create('feTurbulence',{type:'fractalNoise',baseFrequency:'0.75 0.11',numOctaves:'2',seed:'4',result:'noise'},filter);
  create('feColorMatrix',{type:'saturate',values:'0'},filter);
  // The TI2 Desktop face fills the photographed chassis; no invented corner screws.
  create('rect',{x:29,y:19,width:1506,height:674,rx:2,fill:'#1d2427',stroke:'#5e6c70','stroke-width':1},svg);
  create('rect',{x:30,y:20,width:1504,height:672,rx:2,fill:'url(#chassis)'},svg);
  create('rect',{x:31,y:21,width:1502,height:670,rx:2,fill:'#aeb8b9',opacity:'.025',filter:'url(#steelNoise)'},svg);
  // Shallow silkscreen and engraved connector labels.
  txt(svg, 52,65, '✧ OsTIrus', 'panel-logo');
  txt(svg, 204,70, 'TI²', 'panel-model');
  const connectorNames = [
    [451,'USB'],[541,'MIDI IN'],[612,'MIDI OUT'],[681,'MIDI THRU'],[790,'S/PDIF'],
    [914,'INPUT'],[1042,'OUTPUT 1'],[1159,'OUTPUT 2'],[1267,'OUTPUT 3'],[1392,'12V DC IN'],[1472,'HEADPHONES']
  ];
  for(const [x,label] of connectorNames){
    create('rect',{x:x-30,y:48,width:60,height:14,rx:1,fill:'#aebec1',opacity:'.9'},svg);
    txt(svg,x,58,label,'connector-text',{'text-anchor':'middle'});
  }
  // Hardware silkscreen: outlines are continuous contours, not boxed UI cards.
  // Unlike the v0.6 design, these regions use very light engraved separators.
  const engrave = (d,width=1.5) => create('path',{d,fill:'none',stroke:'#e0eaeb','stroke-width':width,opacity:'.9'},svg);
  // Upper control silkscreen: one continuous line, with Mixer as a vertical stripe.
  create('rect',{x:1008,y:111,width:101,height:505,fill:'#b4c0c2',opacity:'.19'},svg);
  engrave('M164 111 H1506 Q1515 111 1515 122 V333 Q1515 341 1507 341 H1109');
  engrave('M1008 111 V623');
  engrave('M1109 111 V623');
  // The original has no strong partition lines separating MATRIX, MODULATORS and OSCILLATORS.
  // Distinctive asymmetrical ARP and effects surround.
  engrave('M164 111 V223 Q164 239 150 239 H50 Q42 239 42 249 V332 Q42 341 51 341 H1008',1.6);
  engrave('M48 353 H453 Q462 353 462 362 V500 Q462 518 448 518 H353 Q339 518 336 535 L333 622');
  engrave('M48 353 Q40 353 40 365 V607 Q40 622 53 622 H333');
  // The notch is joined to the upper contour and the lower perimeter at (333,622).
  engrave('M1109 367 H1503 Q1514 367 1514 380 V472 Q1514 482 1504 482 H1109');
  engrave('M1109 508 H1503 Q1514 508 1514 520 V611 Q1514 622 1504 622 H1109');
  // Black recessed filter-mode and effect-selection bars are added as graphics.
  create('rect',{x:62,y:370,width:356,height:16,rx:1,fill:'#111719',opacity:'.7'},svg);
  create('rect',{x:62,y:499,width:356,height:15,rx:1,fill:'#111719',opacity:'.65'},svg);
  // A subtle Mixer emblem guide replaces artificial section cards.
  const sectionTabs = [
    [167,97,'MATRIX'],[289,97,'MODULATORS'],[603,97,'OSCILLATORS'],
    [1016,97,'MIXER'],[1118,97,'FILTERS'],[43,355,'EFFECTS'],
    [1120,355,'FILTER ENVELOPE'],[1120,493,'AMPLIFIER ENVELOPE']
  ];
  for (const [x,y,label] of sectionTabs) {
    const width=label.length*6.0+16;
    create('rect',{x,y,width,height:14,rx:3,fill:'#c2cfd0',opacity:'.9'},svg);
    txt(svg,x+7,y+10,label,'section-tab');
  }

  // Single physical ARP/MATRIX divider. The former duplicate crossed the ARP tab.
  // Do not draw a second parallel outline over the shared hardware contour.
  create('rect',{x:45,y:224,width:65,height:16,rx:4,fill:'#aebfc1',opacity:'.8'},svg);
  txt(svg,50,236,'ARP','section-mini');

  // Every coordinate below is measured against the reference frontal photograph
  // (user's photo mapped to the 1533 × 685 reference frame).
  const knobs = [
    ['VOLUME',79,155,31,null],
    ['RATE',531,162,27,67],
    ['WAVE',638,161,28,17],['WAVE SELECT/PW',742,161,28,19],
    ['SEMITONE',843,161,28,20],['DETUNE 2/3',947,161,28,26],['FM AMOUNT',947,280,27,27],
    ['OSC BALANCE',1057,161,29,33],['SUB OSC VOLUME',1057,276,29,34],
    ['OSC VOLUME',1057,443,29,36],['NOISE VOLUME',1057,557,29,37],
    ['CUTOFF',1179,160,28,40],['RESONANCE',1281,160,28,42],
    ['ENV AMOUNT',1378,160,28,44],['FILTER BALANCE',1480,160,27,48],['CUTOFF 2',1179,280,27,41],
    ['SEND',185,436,28,null],['TIME/COLOR',292,436,28,null],['FEEDBACK/DAMPING',392,436,28,null],
    ['TYPE/MIX',185,564,28,null],['INTENSITY',292,564,28,null],
    ['VALUE 1',634,563,28,null],['VALUE 2',734,563,28,null],['VALUE 3',831,563,28,null],
    ['ATTACK',1177,417,28,54],['DECAY',1275,417,28,55],['SUSTAIN',1377,417,28,56],['RELEASE',1478,417,28,58],
    ['ATTACK',1177,563,28,59],['DECAY',1275,563,28,60],['SUSTAIN',1377,563,28,61],['RELEASE',1478,563,28,63]
  ];
  // Photo-registered physical key caps. The filter SELECT pair has two separate caps.
  const buttons = [
    ['ARP EDIT',83,288],['ARP ON',127,288],
    ['DEST 1',194,175],['DEST 2',237,175],['MOD SELECT',194,289],
    ['EDIT',314,175],['ENV MODE',359,175],['SHAPE',427,175],
    ['LFO 1 SELECT',314,288],['LFO 2 SELECT',425,288],['LFO 3 SELECT',545,288],
    ['OSC SELECT',625,288],['OSC EDIT',667,288],['OSC 3 ON',710,288],['MONO',824,288],['SYNC',866,288],
    ['FILTER EDIT',1244,288],['FILTER 1',1286,288],['FILTER 2',1390,288],
    ['FILTER SELECT LEFT',1432,288],['FILTER SELECT RIGHT',1477,288],
    ['EFFECT SELECT',83,445],['EFFECT EDIT',127,445],['EFFECT SELECT',83,568],['EFFECT EDIT',127,568],
    ['EXIT',501,381],['TAP',545,381],['EDIT',501,456],['CONFIG',545,456],
    ['STORE',501,522],['UNDO',545,522],['SHIFT',501,588],['SEARCH',545,588],
    ['PART −',935,381],['PART +',977,381],['MULTI',935,456],['SINGLE',977,456],
    ['PARAM −',935,522],['PARAM +',977,522],['VALUE −',935,588],['VALUE +',977,588],
    ['TRANS −',386,588],['TRANS +',428,588],
  ];
  if(knobs.length!==32 || buttons.length!==43) throw new Error('TI2 geometry check failed: '+knobs.length+' knobs/'+buttons.length+' button caps');

  // Knob rendering uses concentric hardware rings, 13 printed arc ticks and a rotating pointer.
  function drawKnob([label,x,y,r,cc]){
    const group=create('g',{class:'ti2-knob',transform:'translate('+x+' '+y+')',
      'data-label':label,...(cc===null?{}:{'data-cc':cc})},svg);
    for(let j=0;j<=12;j++){
      const angle=(-220+j*260/12)*Math.PI/180;
      const p1=r+5, p2=r+7.6;
      create('line',{x1:Math.cos(angle)*p1,y1:Math.sin(angle)*p1,
        x2:Math.cos(angle)*p2,y2:Math.sin(angle)*p2,class:'ti2-dial-tick'},group);
    }
    create('circle',{r:r+2.5,fill:'#101618',opacity:'.56'},group);
    create('circle',{r,fill:'url(#knob)',stroke:'#141a1d','stroke-width':1.5},group);
    create('path',{d:'M'+(-r*.62)+' '+(-r*.53)+' A'+r*.84+' '+r*.84+' 0 0 1 '+r*.29+' '+(-r*.76),
      fill:'none',stroke:'#d7e2e1','stroke-width':1,opacity:'.22'},group);
    const needle=create('line',{x1:0,y1:-(r*.86),x2:0,y2:-(r*.34),stroke:'#ecf7f4','stroke-width':3.2,
      'stroke-linecap':'round'},group);
    let val=64;
    const angleDeg=()=>-130+val*260/127;
    const paint=()=>needle.setAttribute('transform','rotate('+angleDeg()+')');
    paint();
    const hasRibbon = (y===161 && x>=594 && x<990) ||
      (y===160 && ['RESONANCE','ENV AMOUNT'].includes(label));
    if (!hasRibbon) {
      // Keep silkscreen inside the photo's section borders; long captions use a smaller face.
      const captionY=(y===563 && x>=1100)?y+r+12:y+r+(label.startsWith('VALUE ')?27:14);
      const captionX=label==='FILTER BALANCE'?1462:x;
      const captionClass=label.length>13?'knob-caption-long':'knob-caption';
      txt(svg,captionX,captionY,label,captionClass,{'text-anchor':'middle'});
    }
    if(label!=='VOLUME') {
      // The black TI2 silkscreen shows CUTOFF 2 as -6/+6; FILTER BALANCE as 0/12.
      const left=label==='SEMITONE'?'-48':label==='CUTOFF 2'?'-6':'0';
      const right=label==='SEMITONE'?'+48':label==='CUTOFF 2'?'+6':'12';
      const scaleY=(label==='CUTOFF 2'||(y===563&&x>=1100))?y+r+1:y+r+5;
      txt(svg,x-r+1,scaleY,left,'panel-scale');
      txt(svg,x+r-1,scaleY,right,'panel-scale',{'text-anchor':'end'});
    }

    if(cc!==null){
      group.setAttribute('tabindex','0');group.setAttribute('role','slider');
      group.setAttribute('aria-label',label+' (CC '+cc+')');group.setAttribute('aria-valuemin','0');
      group.setAttribute('aria-valuemax','127');group.setAttribute('aria-valuenow',String(val));
      group.classList.add('control-live');
      let grab=null,pending=false;
      const send=(v)=>{
        const next=Math.min(127,Math.max(0,Math.round(v)));
        if(next===val)return;
        val=next;paint();group.setAttribute('aria-valuenow',String(val));
        const editStatus=document.getElementById('ti2-precision-edit');
        if(editStatus)editStatus.textContent=label+' · CC '+cc+' · '+val+' / 127';
        if(!pending){pending=true;requestAnimationFrame(()=>{
          pending=false;
          fetch('/api/midi',{method:'POST',headers:{'Content-Type':'application/json'},
            body:JSON.stringify({type:'cc',controller:cc,value:val})}).then(response=>{
              if(!response.ok)throw new Error('Host unavailable');
            }).catch(()=>{if(editElement)editElement.textContent='MIDI ERROR · HOST NO DISPONIBLE';});
        });}
      };
      group.addEventListener('pointerdown',e=>{if(e.button!==0)return;grab={id:e.pointerId,y:e.clientY,value:val};group.setPointerCapture(e.pointerId);e.preventDefault()});
      group.addEventListener('pointermove',e=>{if(grab&&e.pointerId===grab.id)send(grab.value+(grab.y-e.clientY)*1.1)});
      for(const event of ['pointerup','pointercancel','lostpointercapture'])group.addEventListener(event,()=>grab=null);
      group.addEventListener('wheel',e=>{e.preventDefault();send(val+(e.deltaY<0?1:-1))},{passive:false});
      group.addEventListener('keydown',e=>{const inc=e.shiftKey?10:1;
        if(e.key==='ArrowUp'||e.key==='ArrowRight')send(val+inc);
        else if(e.key==='ArrowDown'||e.key==='ArrowLeft')send(val-inc);
        else if(e.key==='Home')send(0);else if(e.key==='End')send(127);else return;
        e.preventDefault();
      });
    }else group.classList.add('control-pending');
  }

  // Basic tactile shape; unimplemented buttons deliberately not interactive.
  function drawButton([name,x,y]) {
    const group=create('g',{class:'ti2-button-group',transform:'translate('+x+' '+y+')'},svg);
    // ~42 px physical keycaps in the photo; the former 36×35 shapes were undersized.
    create('rect',{x:-20.5,y:-21,width:41,height:42,rx:3,fill:'#11181c',stroke:'#97a4a8','stroke-width':.8},group);
    create('rect',{x:-19,y:-19,width:38,height:38,rx:2,fill:'url(#button)',stroke:'#141c20','stroke-width':1},group);
    create('rect',{x:-18,y:-19,width:36,height:3,rx:1,fill:'#afbfc0',opacity:'.15'},group);
    const caption = name==='FILTER 1' ? 'FILT 1' :
      name==='FILTER 2' ? 'FILT 2' :
      name.startsWith('FILTER ') ? name.slice(7) :
      name.startsWith('EFFECT ') ? name.slice(7) :
      name==='ARP EDIT' ? 'EDIT' :
      name==='MOD SELECT' ? 'SELECT' :
      name.startsWith('LFO ') ? 'SELECT' :
      name.startsWith('OSC ') && name.includes('SELECT') ? 'SELECT' :
      name.startsWith('OSC ') && name.includes('EDIT') ? 'EDIT' : name;
    if (!name.startsWith('TRANS ') && !name.startsWith('VALUE ') &&
        !name.startsWith('PARAM ') && !name.startsWith('PART ') &&
        !name.startsWith('FILTER SELECT '))
      txt(svg,x,y+30,caption,'button-caption',{'text-anchor':'middle'});
  }
  knobs.forEach(drawKnob);
  buttons.forEach(drawButton);
  txt(svg,1454,318,'SELECT','button-caption',{'text-anchor':'middle'});

  // Matrix / LFO / filter and effects status indicators, all physical-position references.
  // All LEDs are neutral: firmware state is not exposed to the web UI.
  const indicator=(x,y,caption,on=false,anchor='start')=>{
    create('circle',{cx:x,cy:y,r:3.4,fill:'#242e31',stroke:'#829193','stroke-width':.8,
      'data-state':'unavailable'},svg);
    txt(svg,x+(anchor==='start'?7:-7),y+2.7,caption,'indicator-caption',{'text-anchor':anchor});
  };
  ['SLOT 1','SLOT 2','SLOT 3','SLOT 4','SLOT 5','SLOT 6'].forEach((s,i)=>indicator(226,231+i*18,s));
  [['LFO 1',310],['LFO 2',352],['LFO 3',400]].forEach(([s,x])=>indicator(x,125,s));
  ['OSC 1','OSC 2','OSC 3'].forEach((s,i)=>indicator(618+i*49,236,s));
  ['AF','LP','HP','BP','BS'].forEach((s,i)=>indicator(1326,240+i*15,s));
  ['FILT 1','FILT 2'].forEach((s,i)=>indicator(1420+i*51,240,s));
  ['DELAY','REVERB','LOW EQ','MID EQ','HIGH EQ'].forEach((s,i)=>indicator(67+i*85,380,s));
  ['DISTORTION','CHARACTER','CHORUS','PHASER','OTHERS'].forEach((s,i)=>indicator(67+i*85,500,s));
  // Actual TI2 photo: top LFO group has waveform symbols, not RESONANCE text.
  const lfoWaves=[
    'M471 125 Q477 116 483 125 T495 125',
    'M471 144 L477 137 L483 151 L489 137 L495 144',
    'M471 162 L493 151 L493 162',
    'M471 179 L471 171 L482 171 L482 179 L495 179'
  ];
  lfoWaves.forEach((d,i)=>{
    create('circle',{cx:458,cy:126+i*17,r:3.4,fill:'#242e31',stroke:'#829193','stroke-width':.8,'data-state':'unavailable'},svg);
    create('path',{d,fill:'none',stroke:'#d5dfe0','stroke-width':1.5,'stroke-linecap':'round','stroke-linejoin':'round','data-ti2-waveform':String(i+1)},svg);
  });
  ['WAVE','CUTOFF 1','CUTOFF 2','SHAPE','FM AMT','PAN','ASSIGN']
    .forEach((label,i)=>indicator(458,233+i*17,label));
  ['OSC 1','OSC 2/3','CUTOFF','SHAPE','FM AMT','PAN'].forEach((s,i)=>indicator(347,233+i*18,s));
  txt(svg,212,132,'DEMOSONG','panel-micro',{'text-anchor':'middle'});
  txt(svg,212,144,'PRESS + HOLD','panel-micro',{'text-anchor':'middle'});
  txt(svg,212,217,'DESTINATION','panel-micro',{'text-anchor':'middle'});
  txt(svg,194,258,'MOD','panel-micro',{'text-anchor':'middle'});
  for(const [x,label] of [[310,'LFO 1'],[421,'LFO 2'],[541,'LFO 3']]){
    create('rect',{x:x-19,y:241,width:38,height:14,rx:2,fill:'#95aeb0',opacity:'.72'},svg);
    txt(svg,x,251,label,'section-tab',{'text-anchor':'middle'});
  }

  // Printed black parameter ribbons reproduce the TI2's hierarchy.
  for(const [x,w] of [[601,84],[686,109],[795,90],[886,100],[1230,87],[1327,100]]){
    create('rect',{x,y:202,width:w,height:15,rx:1,fill:'#151b1c',opacity:'.86'},svg);
  }
  txt(svg,638,213,'SHAPE','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,742,213,'WAVE SELECT / PW','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,844,213,'SEMITONE','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,947,213,'DETUNE 2/3','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,1278,213,'RESONANCE','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,1378,213,'ENV AMOUNT','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,840,327,'PANIC','panel-micro',{'text-anchor':'middle'});



  txt(svg,1057,379,'✧','mixer-emblem',{'text-anchor':'middle'});
  txt(svg,403,625,'TRANSPOSE','panel-micro',{'text-anchor':'middle'});
  txt(svg,403,637,'POWER ON/OFF','panel-secondary',{'text-anchor':'middle'});
  txt(svg,634,634,'CATEGORY','panel-micro',{'text-anchor':'middle'});
  txt(svg,734,634,'BANK','panel-micro',{'text-anchor':'middle'});
  txt(svg,830,634,'PROGRAM','panel-micro',{'text-anchor':'middle'});
  // SHIFT/secondary legends checked against the manufacturer's manual and TI2 photo.
  // Do not invent a FILTER ATTACK alternate function: it is the ordinary knob label.
  for (const [x,y,label] of [
    [531,223,'LFO CONTOUR'],[843,228,'PORTAMENTO'],[947,228,'UNISON DETUNE'],
    [947,333,'FM MODE'],[1057,222,'PANORAMA'],[1057,333,'OSC 3 VOLUME'],
    [1057,494,'SATURATION TYPE'],[1057,612,'RING MODULATOR'],
    [1281,225,'RESONANCE 2'],[1378,225,'KEY FOLLOW'],
    [185,490,'EQ GAIN'],[292,490,'EQ FREQ'],[392,490,'EQ Q-FACTOR'],
    [1177,613,'PATCH VOLUME'],[1378,472,'SUSTAIN SLOPE'],
    [1378,613,'SUSTAIN SLOPE'],[1478,613,'TEMPO'],
  ]) txt(svg,x,y,label,'panel-secondary',{'text-anchor':'middle'});
  // Physical UI references: effect SELECT / EDIT operate on two shared knob rows.
  txt(svg,124,330,'HOLD','panel-micro',{'text-anchor':'middle'});
  txt(svg,952,411,'PART','panel-micro',{'text-anchor':'middle'});
  txt(svg,952,553,'PARAMETERS','panel-micro',{'text-anchor':'middle'});
  txt(svg,952,562,'BANK','panel-secondary',{'text-anchor':'middle'});
  txt(svg,952,623,'VALUE','panel-micro',{'text-anchor':'middle'});
  txt(svg,952,634,'PROGRAM','panel-secondary',{'text-anchor':'middle'});


  // LCD is a physical screen. Readout mirrors the already working Program Change selector.
  create('rect',{x:581,y:364,width:317,height:159,rx:9,fill:'#12191d',stroke:'#707b7e','stroke-width':3},svg);
  create('rect',{x:608,y:407,width:261,height:66,rx:2,fill:'url(#display)',stroke:'#182529','stroke-width':2},svg);
  txt(svg,615,418,'SINGLE', 'lcd-line');
  const lcdPatch=txt(svg,615,443,'PROGRAM 001','lcd-title');
  txt(svg,615,460,'TI2 · OsTIrus','lcd-line');
  txt(svg,734,500,'OsTIrus / TI²','lcd-logo',{'text-anchor':'middle'});
  const lcdState=txt(svg,615,467,'','lcd-tiny');
  const selector=document.getElementById('program');
  const setPatch=()=>{const v=Number(selector.value)+1;
    lcdPatch.textContent='PROGRAM '+String(v).padStart(3,'0');
    lcdState.textContent='';
  };
  selector.addEventListener('change',setPatch);
  setPatch();
  // Important: knob controls are still output-only. They do not imply reading firmware parameter state.
  const editElement=document.getElementById('ti2-precision-edit');
  if(editElement)editElement.textContent='PANEL v0.7 REFERENCE · 32 KNOBS · 43 VISIBLE KEY CAPS · LED STATES NOT SYNCHRONIZED';
})();