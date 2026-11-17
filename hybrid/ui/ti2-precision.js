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
  const svg = create('svg', {
    viewBox: '0 0 1533 685', role: 'group',
    'aria-label': 'OsTIrus TI2 Desktop: frontal físico fiel, con controles MIDI locales',
    xmlns: ns
  }, panel);
  svg.classList.add('ti2-photo-svg');
  const defs = create('defs', {}, svg);
  const gradient = (id, stops, radial = false) => {
    const g = create(radial ? 'radialGradient' : 'linearGradient', {id, x1:'0%',y1:'0%',x2:'85%',y2:'100%'}, defs);
    stops.forEach(([position,color]) => create('stop', {offset:position,'stop-color':color},g));
  };
  gradient('chassis', [['0%','#464c4f'],['35%','#292f33'],['74%','#343b3f'],['100%','#22282c']]);
  gradient('panelInset', [['0%','#3d484c'],['100%','#2a3033']]);
  gradient('knob', [['0%','#7c8788'],['28%','#495257'],['55%','#30373c'],['90%','#11171b'],['100%','#667073']]);
  gradient('button', [['0%','#657176'],['22%','#404a50'],['72%','#242b2f'],['100%','#12181c']]);
  gradient('display', [['0%','#d7f1f0'],['43%','#a4d8df'],['100%','#6da3b4']]);
  const filter = create('filter',{id:'steelNoise',x:'0',y:'0',width:'100%',height:'100%'},defs);
  create('feTurbulence',{type:'fractalNoise',baseFrequency:'0.75 0.11',numOctaves:'2',seed:'4',result:'noise'},filter);
  create('feColorMatrix',{type:'saturate',values:'0'},filter);
  create('rect',{x:21,y:16,width:1500,height:662,rx:5,fill:'#1d2427',stroke:'#677477','stroke-width':2},svg);
  create('rect',{x:25,y:22,width:1492,height:653,rx:4,fill:'url(#chassis)',stroke:'#6b777a','stroke-width':.8},svg);
  create('rect',{x:26,y:23,width:1490,height:650,rx:3,fill:'#aeb8b9',opacity:'.035',filter:'url(#steelNoise)'},svg);
  // Top edge screws, shallow embossed panel side and engraved connectors.
  for(const [x,y] of [[31,70],[1508,70],[31,615],[1508,615]]){
    create('circle',{cx:x,cy:y,r:5,fill:'#111719',stroke:'#727e80','stroke-width':1.3},svg);
    create('line',{x1:x-2,y1:y+2,x2:x+2,y2:y-2,stroke:'#5c6469','stroke-width':1.2},svg);
  }
  txt(svg, 52,69, '✧ OsTIrus', 'panel-logo');
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
  engrave('M1008 111 V615');
  engrave('M1109 111 V615');
  // The original has no strong partition lines separating MATRIX, MODULATORS and OSCILLATORS.
  // Distinctive asymmetrical ARP and effects surround.
  engrave('M166 111 H174 V223 Q174 239 159 239 H50 Q42 239 42 249 V332 Q42 341 51 341 H1008',1.6);
  engrave('M48 353 H453 Q462 353 462 362 V485 Q462 497 450 497 H365');
  engrave('M48 353 Q40 353 40 365 V599 Q40 613 53 613 H333');
  engrave('M334 613 Q340 518 353 518 H462');
  engrave('M1109 367 H1503 Q1514 367 1514 380 V472 Q1514 482 1504 482 H1109');
  engrave('M1109 508 H1503 Q1514 508 1514 520 V603 Q1514 614 1504 614 H1109');
  // Black recessed filter-mode and effect-selection bars are added as graphics.
  create('rect',{x:172,y:356,width:245,height:16,rx:1,fill:'#111719',opacity:'.7'},svg);
  create('rect',{x:172,y:487,width:245,height:15,rx:1,fill:'#111719',opacity:'.65'},svg);
  // A subtle Mixer emblem guide replaces artificial section cards.
  const sectionTabs = [
    [167,99,'MATRIX'],[289,99,'MODULATORS'],[603,99,'OSCILLATORS'],
    [1016,99,'MIXER'],[1118,99,'FILTERS'],[43,352,'EFFECTS'],
    [1120,355,'FILTER ENVELOPE'],[1120,493,'AMPLIFIER ENVELOPE']
  ];
  for (const [x,y,label] of sectionTabs) {
    const width=label.length*6.0+16;
    create('rect',{x,y,width,height:14,rx:3,fill:'#c2cfd0',opacity:'.9'},svg);
    txt(svg,x+7,y+10,label,'section-tab');
  }

  // Original's irregular Volume/ARP plate, not a boxed card.
  create('path',{d:'M163 111 Q169 111 169 118 V225 Q168 233 154 234 H50 Q41 234 41 246 V330 Q41 340 51 340 H166',
    fill:'none',stroke:'#b4c5c6','stroke-width':1.6},svg);
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
    ['SEND',185,436,28,null],['TIME/COLOR',292,436,28,null],['FEEDBACK',392,436,28,null],
    ['TYPE/MIX',185,564,28,null],['INTENSITY',292,564,28,null],
    ['VALUE 1',634,563,28,null],['VALUE 2',734,563,28,null],['VALUE 3',831,563,28,null],
    ['ATTACK',1177,417,28,54],['DECAY',1275,417,28,55],['SUSTAIN',1377,417,28,56],['RELEASE',1478,417,28,58],
    ['ATTACK',1177,563,28,59],['DECAY',1275,563,28,60],['SUSTAIN',1377,563,28,61],['RELEASE',1478,563,28,63]
  ];
  const buttons = [
    ['ARP EDIT',82,286],['ARP ON',124,286],
    ['DEST 1',190,175],['DEST 2',234,175],['MOD SELECT',193,285],
    ['EDIT',309,177],['ENV MODE',350,177],['SHAPE',418,177],
    ['LFO 1 SELECT',309,285],['LFO 2 SELECT',421,285],['LFO 3 SELECT',543,285],
    ['OSC SELECT',621,287],['OSC EDIT',663,287],['OSC 3 ON',704,287],['MONO',821,287],['SYNC',865,287],
    ['FILTER EDIT',1242,285],['FILTER 1',1284,285],['FILTER 2',1392,285],['FILTER SELECT',1480,285],
    ['EFFECT SELECT',78,440],['EFFECT EDIT',119,440],['EFFECT SELECT',78,566],['EFFECT EDIT',119,566],
    ['EXIT',497,375],['TAP',539,375],['EDIT',497,451],['CONFIG',539,451],
    ['STORE',497,518],['UNDO',539,518],['SHIFT',497,582],['SEARCH',539,582],
    ['PART −',931,376],['PART +',973,376],['MULTI',931,451],['SINGLE',973,451],
    ['PARAM −',931,517],['PARAM +',973,517],['VALUE −',931,582],['VALUE +',973,582],
    ['TRANS −',382,565],['TRANS +',424,565],
  ];
  if(knobs.length!==32 || buttons.length!==42) throw new Error('TI2 geometry check failed: '+knobs.length+' knobs/'+buttons.length+' buttons');

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
    if (!hasRibbon) txt(svg,x,y+r+14,label,'knob-caption',{'text-anchor':'middle'});
    if(label!=='VOLUME') {
      const bipolar=['SEMITONE','FILTER BALANCE','CUTOFF 2'].includes(label);
      txt(svg,x-r+1,y+r+5,bipolar?'-48':'0','panel-scale');
      txt(svg,x+r-1,y+r+5,bipolar?'+48':'12','panel-scale',{'text-anchor':'end'});
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
    create('rect',{x:-18,y:-18,width:36,height:35,rx:3,fill:'#11181c',stroke:'#97a4a8','stroke-width':.8},group);
    create('rect',{x:-16,y:-16,width:32,height:30,rx:2,fill:'url(#button)',stroke:'#141c20','stroke-width':1},group);
    create('rect',{x:-15,y:-16,width:30,height:3,rx:1,fill:'#afbfc0',opacity:'.15'},group);
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
        !name.startsWith('PARAM ') && !name.startsWith('PART '))
      txt(svg,x,y+30,caption,'button-caption',{'text-anchor':'middle'});
  }
  knobs.forEach(drawKnob);
  buttons.forEach(drawButton);

  // Matrix / LFO / filter and effects status indicators, all physical-position references.
  const indicator=(x,y,caption,on=false,anchor='start')=>{
    create('circle',{cx:x,cy:y,r:3.4,fill:on?'#ff5261':'#1d272a',stroke:on?'#ffb0a9':'#809092','stroke-width':.8},svg);
    if(on)create('circle',{cx:x,cy:y,r:6.5,fill:'#ff3745',opacity:'.12'},svg);
    txt(svg,x+(anchor==='start'?7:-7),y+2.7,caption,'indicator-caption',{'text-anchor':anchor});
  };
  ['SLOT 1','SLOT 2','SLOT 3','SLOT 4','SLOT 5','SLOT 6'].forEach((s,i)=>indicator(226,231+i*18,s,i===0));
  [['LFO 1',310],['LFO 2',352],['LFO 3',400]].forEach(([s,x],i)=>indicator(x,125,s,i===0));
  ['OSC 1','OSC 2','OSC 3'].forEach((s,i)=>indicator(618+i*49,236,s,i===0));
  ['AF','LP','HP','BP','BS'].forEach((s,i)=>indicator(1326,240+i*15,s,i===1));
  ['FILT 1','FILT 2'].forEach((s,i)=>indicator(1420+i*51,240,s,i===0));
  ['DELAY','REVERB','LOW EQ','MID EQ','HIGH EQ'].forEach((s,i)=>indicator(67+i*85,380,s,i===1));
  ['DISTORTION','CHARACTER','CHORUS','PHASER','OTHERS'].forEach((s,i)=>indicator(67+i*85,500,s,i===0));
  ['WAVE','PW','RESONANCE','FLT GAIN','ASSIGN'].forEach((s,i)=>indicator(458,141+i*17,s,i===0));
  ['OSC 1','OSC 2/3','CUTOFF','SHAPE','FM AMT','PAN'].forEach((s,i)=>indicator(347,233+i*18,s,i===1));
  txt(svg,212,140,'DEMOSONG','panel-micro',{'text-anchor':'middle'});
  txt(svg,212,150,'PRESS + HOLD','panel-micro',{'text-anchor':'middle'});
  txt(svg,212,217,'DESTINATION','panel-micro',{'text-anchor':'middle'});
  txt(svg,194,258,'MOD','panel-micro',{'text-anchor':'middle'});
  for(const [x,label] of [[310,'LFO 1'],[421,'LFO 2'],[541,'LFO 3']]){
    create('rect',{x:x-19,y:241,width:38,height:14,rx:2,fill:'#95aeb0',opacity:'.72'},svg);
    txt(svg,x,251,label,'section-tab',{'text-anchor':'middle'});
  }

  // Printed black parameter ribbons reproduce the TI2's hierarchy.
  for(const [x,w] of [[601,84],[686,109],[795,90],[886,100],[1230,87],[1327,100]]){
    create('rect',{x,y:207,width:w,height:15,rx:1,fill:'#151b1c',opacity:'.86'},svg);
  }
  txt(svg,638,217,'SHAPE','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,742,217,'WAVE SELECT / PW','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,844,217,'SEMITONE','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,947,217,'DETUNE 2/3','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,1278,217,'RESONANCE','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,1378,217,'ENV AMOUNT','panel-ribbon',{'text-anchor':'middle'});
  txt(svg,840,333,'PANIC','panel-micro',{'text-anchor':'middle'});



  txt(svg,1057,379,'✧','mixer-emblem',{'text-anchor':'middle'});
  txt(svg,403,619,'TRANSPOSE / POWER','panel-micro',{'text-anchor':'middle'});
  txt(svg,634,616,'VALUE 1 / CATEGORY','panel-micro',{'text-anchor':'middle'});
  txt(svg,734,616,'VALUE 2 / BANK','panel-micro',{'text-anchor':'middle'});
  txt(svg,830,616,'VALUE 3 / PROGRAM','panel-micro',{'text-anchor':'middle'});
  // SHIFT layer: condensed secondary legends verified in the official TI user manual.
  for (const [x,y,label] of [
    [531,224,'LFO CONTOUR'],[843,232,'PORTAMENTO'],[947,233,'UNISON DETUNE'],
    [1057,222,'PANORAMA'],[1057,333,'OSC 3 VOLUME'],[1057,499,'SATURATION TYPE'],
    [1057,644,'RING MODULATOR'],[1281,230,'RESONANCE 2'],[1378,230,'KEY FOLLOW'],
    [1177,484,'FILTER ATTACK'],[1177,644,'PATCH VOLUME'],
    [1378,484,'SUSTAIN SLOPE'],[1478,644,'TEMPO'],
  ]) txt(svg,x,y,label,'panel-secondary',{'text-anchor':'middle'});
  // Physical UI references: effect SELECT / EDIT operate on two shared knob rows.
  txt(svg,146,330,'HOLD','panel-micro',{'text-anchor':'middle'});
  txt(svg,952,407,'PART','panel-micro',{'text-anchor':'middle'});
  txt(svg,952,548,'PARAMETERS','panel-micro',{'text-anchor':'middle'});
  txt(svg,952,629,'VALUE / PROGRAM','panel-micro',{'text-anchor':'middle'});


  // LCD is a physical screen. Readout mirrors the already working Program Change selector.
  create('rect',{x:574,y:361,width:324,height:155,rx:9,fill:'#12191d',stroke:'#707b7e','stroke-width':3},svg);
  create('rect',{x:603,y:405,width:266,height:62,rx:2,fill:'url(#display)',stroke:'#182529','stroke-width':2},svg);
  txt(svg,615,421,'SINGLE', 'lcd-line');
  const lcdPatch=txt(svg,615,442,'PROGRAM 001','lcd-title');
  txt(svg,615,458,'TI2 · OsTIrus','lcd-line');
  txt(svg,734,499,'OsTIrus / TI²','lcd-logo',{'text-anchor':'middle'});
  const lcdState=txt(svg,615,465,'','lcd-tiny');
  const selector=document.getElementById('program');
  const setPatch=()=>{const v=Number(selector.value)+1;
    lcdPatch.textContent='PROGRAM '+String(v).padStart(3,'0');
    lcdState.textContent='';
  };
  selector.addEventListener('change',setPatch);
  setPatch();
  // Important: knob controls are still output-only. They do not imply reading firmware parameter state.
  const editElement=document.getElementById('ti2-precision-edit');
  if(editElement)editElement.textContent='PANEL REFERENCE · 32 KNOBS · 42 BUTTONS';
})();