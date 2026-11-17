"use strict";
/* Browser-only SVG collision audit for the original Virus TI2 panel. Never shipped with the UI. */
(() => {
  const svg=document.querySelector('.ti2-photo-svg');
  if(!svg) return;
  const texts=[...svg.querySelectorAll('text')];
  const textRect=(node)=>{
    const b=node.getBBox();
    return {x:b.x,y:b.y,w:b.width,h:b.height};
  };
  const overlaps=(a,b,slack=0)=>Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x))>
    slack && Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y))>slack;
  const caps=[...svg.querySelectorAll('.ti2-button-group')].map(group=>{
    const tr=group.getAttribute('transform').match(/translate\(([-\d.]+) ([-\d.]+)\)/);
    const x=Number(tr[1]),y=Number(tr[2]);
    return {x:x-20.5,y:y-21,w:41,h:42};
  });
  const collisions=[];
  for(const t of texts){
    const b=textRect(t);
    for(const cap of caps){
      if(overlaps(b,cap,0.5)){
        collisions.push({kind:'text-on-keycap',text:t.textContent,x:+b.x.toFixed(1),y:+b.y.toFixed(1)});
        break;
      }
    }
  }
  const uniquePairs=[];
  for(let i=0;i<texts.length;i++){
    const a=textRect(texts[i]);
    for(let j=i+1;j<texts.length;j++){
      const b=textRect(texts[j]);
      const dx=Math.max(0,Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x));
      const dy=Math.max(0,Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y));
      if(dx*dy>8) uniquePairs.push([texts[i].textContent,texts[j].textContent,+(dx*dy).toFixed(1)]);
    }
  }
  const byText=(t)=>texts.filter(x=>x.textContent===t).map(textRect);
  const allInside=(t,limit)=>byText(t).every(b=>b.y+b.h<limit);
  const filterBalance=byText('FILTER BALANCE');
  const rate={x:504,y:135,w:54,h:54};
  const reso=byText('RESO');
  const lowerBand=svg.querySelector('[data-ti2-effects-lower-strip]');
  const lowerLEDs=[...svg.querySelectorAll('[data-ti2-effects-lower-led]')];
  const lowerLabels=[...svg.querySelectorAll('[data-ti2-effects-lower-label]')];
  const lowerBandBounds=lowerBand?.getBBox();
  const lowerBandClear=!!lowerBandBounds && lowerLEDs.length===5 && lowerLabels.length===5 &&
    lowerLEDs.every(c=>{
      const x=Number(c.getAttribute('cx')),y=Number(c.getAttribute('cy'));
      return x-3.4>lowerBandBounds.x+2 && x+3.4<lowerBandBounds.x+lowerBandBounds.width-2 &&
        y-3.4>lowerBandBounds.y+2 && y+3.4<lowerBandBounds.y+lowerBandBounds.height-2;
    }) &&
    lowerLabels.every(t=>{
      const b=t.getBBox();
      return b.x>lowerBandBounds.x+2 && b.x+b.width<lowerBandBounds.x+lowerBandBounds.width-2 &&
        b.y>lowerBandBounds.y+2 && b.y+b.height<lowerBandBounds.y+lowerBandBounds.height-2;
    });
  const divider=svg.querySelector('[data-ti2-lfo-osc-divider]');
  const rateKnob=svg.querySelector('.ti2-knob[data-label="RATE"]');
  const oscWaveKnob=svg.querySelector('.ti2-knob[data-label="WAVE"]');
  const parseCenter=node=>{
    const m=node?.getAttribute('transform')?.match(/translate\\(([-\\d.]+) ([-\\d.]+)\\)/);
    return m?{x:Number(m[1]),y:Number(m[2])}:null;
  };
  const rateCenter=parseCenter(rateKnob),oscCenter=parseCenter(oscWaveKnob);
  const lfo3Cap=[...svg.querySelectorAll('.ti2-button-group')]
    .find(node=>node.getAttribute('transform')==='translate(545 288)');
  const dividerX=divider?.getAttribute('d')?.match(/^M([\\d.]+) /);
  const lfoOscClear=!!(rateCenter && oscCenter && lfo3Cap && dividerX &&
    rateCenter.x===545 && rateCenter.y===162 &&
    rateCenter.x===parseCenter(lfo3Cap).x &&
    Number(dividerX[1])>rateCenter.x+27+7.6+7 &&
    Number(dividerX[1])<oscCenter.x-28-7.6-7);
  const manualChecks={
    lfo_rate_aligned_with_lfo3_and_divider_clear:lfoOscClear,
    lower_effects_strip_contains_all_leds_and_legends:lowerBandClear,
    physical_caps_clear:collisions.length===0,
    mod_reso_clear:reso.length===1 && !overlaps(reso[0],rate),
    lfo_waveform_symbols:svg.querySelectorAll('[data-ti2-waveform]').length===4,
    two_filter_mode_columns:svg.querySelectorAll('[data-ti2-filter-mode-right]').length===5,
    oscillator_wave_label:byText('WAVE').length>=2,
    no_text_to_text_overlap:uniquePairs.length===0,
    filter_balance_inside_chassis:filterBalance.length===1 && filterBalance[0].x+filterBalance[0].w<1513,
    fx_eq_above_lower_ribbon:['EQ GAIN','EQ FREQ','EQ Q-FACTOR'].every(t=>allInside(t,499)),
    amp_secondary_above_bottom_line:['PATCH VOLUME','TEMPO'].every(t=>allInside(t,623)) &&
      byText('SUSTAIN SLOPE').some(b=>b.y+b.h<623),
    arp_tab_clear:byText('ARP').length===1 && allInside('ARP',239),
    master_labels_clear:['PART','PARAMETERS','BANK','VALUE','PROGRAM'].every(t=>byText(t).length>=1)
  };
  const report={manualChecks,collisions,textOverlaps:uniquePairs.slice(0,50),totalTextOverlaps:uniquePairs.length,
    textNodes:texts.length,keyCaps:caps.length};
  const pre=document.createElement('pre');
  pre.id='ti2-collision-audit';
  pre.hidden=true;
  pre.textContent=JSON.stringify(report);
  document.body.appendChild(pre);
})();
