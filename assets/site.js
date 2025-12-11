(() => {
function hexToRGB(hex){hex=String(hex||'').replace('#','').trim();if(hex.length===3){hex=hex.split('').map(c=>c+c).join('');}if(!hex) return {r:0,g:0,b:0};const n=parseInt(hex,16);return {r:(n>>16)&255,g:(n>>8)&255,b:n&255};}
function lockOverlay(host, canvas, overlay){
  const sync=()=>{const r=canvas.getBoundingClientRect(), pr=host.getBoundingClientRect();
    overlay.style.left=(r.left-pr.left)+'px'; overlay.style.top=(r.top-pr.top)+'px';
    overlay.style.width=r.width+'px'; overlay.style.height=r.height+'px';};
  new ResizeObserver(sync).observe(host); window.addEventListener('resize',sync,{passive:true}); setTimeout(sync,0);
}

/* ------ STATIC ISLAND (for PFP) -------- */
function initStaticIsland(host){
  const canvas=document.createElement('canvas'); canvas.className='pfp-island'; host.appendChild(canvas);
  const ctx=canvas.getContext('2d',{alpha:false});
  const overlay=document.createElement('div'); overlay.className='pfp-overlay'; overlay.innerHTML=`<img src="assets/pfp.png" alt="pfp">`; host.appendChild(overlay);
  const COLORS={rest:'#00afff'}; let color = hexToRGB(COLORS.rest);
  let W=420,H=140,cssW=0,pixelSize=3;
  function setup(){ cssW=Math.min(host.clientWidth||600,520); pixelSize=Math.max(2,Math.min(7,Math.round(cssW/210)));
    W=Math.max(340,Math.round(cssW/pixelSize)); H=Math.max(120,Math.round(W/3.2)); canvas.width=W; canvas.height=H; }
  new ResizeObserver(setup).observe(host); setup();
  function sdf(px,py){ const PADX=W*0.12,PADY=H*0.18; const w=W*0.70-PADX, h=H*0.36-PADY*0.1;
    const cy=(H*0.52), r=Math.min(w,h)*0.15; const qx=Math.abs(px-W/2)-(w/2-r), qy=Math.abs(py-cy)-(h/2-r);
    const dx=Math.max(qx,0), dy=Math.max(qy,0); return Math.sqrt(dx*dx+dy*dy)+Math.min(Math.max(qx,qy),0)-r; }
  function draw(){ const img=ctx.getImageData(0,0,W,H),data=img.data;
    for(let y=0;y<H;y++){ for(let x=0;x<W;x++){ const di=(y*W+x)*4; const v=-sdf(x+0.5,y+0.5);
      if(v>1.8){ data[di]=color.r; data[di+1]=color.g; data[di+2]=color.b; data[di+3]=255; }
      else{ data[di]=21; data[di+1]=21; data[di+2]=34; data[di+3]=255; } } }
    ctx.putImageData(img,0,0); requestAnimationFrame(draw); } draw();
}

/* ------ INTERACTIVE ISLAND NAV -------- */
function initIslandNav(host){
  const canvas=document.createElement('canvas'); canvas.className='px-island';
  host.appendChild(canvas);
  const ctx=canvas.getContext('2d',{alpha:false});
  const overlay=document.createElement('div'); overlay.className='overlay'; host.appendChild(overlay);
  lockOverlay(host, canvas, overlay);

  const restText = host.getAttribute('data-rest') || 'sparkskye';
  const rest=document.createElement('div'); rest.className='rest-label'; rest.textContent=restText; overlay.appendChild(rest);

  const tabs=document.createElement('div'); tabs.className='tabs'; tabs.innerHTML=`
    <a class="tab" data-key="video"  href="video.html">video</a>
    <a class="tab" data-key="design" href="design.html">design</a>
    <a class="tab" data-key="art"    href="art.html">art</a>`; overlay.appendChild(tabs);
  const subs=document.createElement('div'); subs.className='subs'; overlay.appendChild(subs);

  let W=480, H=160, cssW=0, pixelSize=3;
  function setupGrid(){
    cssW = Math.min(host.clientWidth || 800, 920);
    const divisor = (cssW < 600) ? 160 : 195;
    pixelSize = Math.max(2, Math.min(8, Math.round(cssW / divisor)));
    W = Math.max(400, Math.round(cssW / pixelSize));
    H = Math.max(140, Math.round(W / 3.1));
    canvas.width = W; canvas.height = H;
  }
  new ResizeObserver(setupGrid).observe(host); setupGrid();

  const COLORS={ rest:'#00afff', video:'#f0593a', design:'#894bdd', art:'#fbbc42' };
  let targetColor = hexToRGB(COLORS.rest);
  let current = {...targetColor};

  // state machine
  let mode='rest'; 
  let collapseTimer=null;
  function toRest(){ mode='rest'; tabs.style.opacity='0'; subs.style.opacity='0'; rest.style.opacity='1'; target=0; targetColor = hexToRGB(COLORS.rest); }
  function toOpen(){ mode='open'; rest.style.opacity='0'; tabs.style.opacity='1'; }

  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

  host.addEventListener('click', (e)=>{
    if(e.target.closest('.tab, .sub')) return;
    if(mode==='rest'){
      if(isTouch){ toOpen(); } else { window.location.href='index.html'; }
    } else {
      toRest();
    }
  });

  host.addEventListener('mouseenter', ()=>{ if(collapseTimer) clearTimeout(collapseTimer); toOpen(); });
  host.addEventListener('mouseleave', ()=>{ const delay = isTouch ? 2000 : 140; collapseTimer=setTimeout(()=>toRest(), delay); });
  tabs.addEventListener('mouseenter', ()=>{ if(collapseTimer) clearTimeout(collapseTimer); toOpen(); });
  subs.addEventListener('mouseenter', ()=>{ if(collapseTimer) clearTimeout(collapseTimer); toOpen(); });
  tabs.addEventListener('mouseleave', ()=>{ collapseTimer=setTimeout(()=>{ if(!subs.matches(':hover')){ target=0; subs.style.opacity='0'; targetColor=hexToRGB(COLORS.rest); } },120); });
  subs.addEventListener('mouseleave', ()=>{ collapseTimer=setTimeout(()=>{ if(!tabs.matches(':hover')) toRest(); },120); });

  function setSection(key){
    targetColor = hexToRGB(COLORS[key]||COLORS.rest);
    let items = [];
    if(key==='video'){ items=['intro','edit','reel']; }
    if(key==='design'){ items=['thumbnails','banners','profiles']; }
    if(key==='art'){ items=['tbd1','tbd2','tbd3']; }
    subs.innerHTML = items.map(t=>`<a class="sub" href="${key}.html#${t}">${t}</a>`).join('');
  }
  tabs.querySelectorAll('.tab').forEach(el=>{
    el.addEventListener('mouseenter', ()=>{ setSection(el.dataset.key); subs.style.opacity='1'; target=1; });
    el.addEventListener('click', (e)=>{ setSection(el.dataset.key); subs.style.opacity='1'; target=1; });
  });

  // geometry + drawing
  let pos=0, vel=0, target=0; const k=0.10, damping=0.16;
  
  function sdf(px,py){
    const isSmall = (cssW < 600);
    const PADX = isSmall ? W * 0.04 : W * 0.12;
    const PADY = H * 0.16;
    
    // Width logic
    const baseW = W*0.74 - PADX;
    const w = baseW + (W * (isSmall ? 0.15 : 0.01)) * pos;
    
    // Height logic
    const baseH = H*0.30 - PADY*0.1;
    const openH = H*0.52 - PADY*0.1; 
    const h = baseH + (openH - baseH) * pos;

    // CENTER FIX: Calculate topFixed so the "rest" shape (baseH) is exactly centered vertically
    const topFixed = (H - baseH) / 2;

    const cy = topFixed + h/2;
    const r = Math.min(w,h)*0.13;
    const qx = Math.abs(px-W/2)-(w/2-r), qy = Math.abs(py-cy)-(h/2-r);
    const dx = Math.max(qx,0), dy = Math.max(qy,0);
    return Math.sqrt(dx*dx+dy*dy)+Math.min(Math.max(qx,qy),0)-r;
  }

  const droplets=[]; let last=null;
  host.addEventListener('mousemove', e=>{
    const r=canvas.getBoundingClientRect(); const x=(e.clientX-r.left)/r.width*W; const y=(e.clientY-r.top)/r.height*H;
    if(last){ const dx=x-last.x, dy=y-last.y, sp=Math.hypot(dx,dy); if(sp>0.65 && Math.abs(sdf(last.x,last.y))<1.2){ droplets.push({x:last.x,y:last.y,vx:dx*0.33,vy:dy*0.33,life:1.0,wob:Math.random()*6.28}); if(droplets.length>160) droplets.shift(); } }
    last={x,y};
  }, {passive:true});

  function step(){
    const f=-k*(pos-target)-damping*vel; vel+=f; pos+=vel; pos=Math.max(-0.03, Math.min(1.03, pos));
    current.r += (targetColor.r-current.r)*0.18;
    current.g += (targetColor.g-current.g)*0.18;
    current.b += (targetColor.b-current.b)*0.18;
    for(let d of droplets){ d.x+=d.vx; d.y+=d.vy; d.vx*=0.996; d.vy*=0.996; d.life-=0.007; d.wob+=0.08; }
    for(let i=droplets.length-1;i>=0;i--){ const d=droplets[i]; if(d.life<=0||d.x<-24||d.x>W+24||d.y<-24||d.y>H+24) droplets.splice(i,1); }
    const img=ctx.getImageData(0,0,W,H), data=img.data, cx=W/2;
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const di=(y*W+x)*4; let v=-sdf(x+0.5,y+0.5);
        for(let d of droplets){ const dx=x+0.5-d.x, dy=y+0.5-d.y; const same=(x-cx)*(d.x-cx);
          if(same>=0){ const rr=(3.2+0.35*Math.sin(d.wob)); v+=(rr*rr*2.0)/(1+dx*dx+dy*dy)*d.life; } }
        if(v>2.2){ data[di]=current.r|0; data[di+1]=current.g|0; data[di+2]=current.b|0; data[di+3]=255; }
        else{ data[di]=21; data[di+1]=21; data[di+2]=34; data[di+3]=255; }
      }
    }
    ctx.putImageData(img,0,0);
    requestAnimationFrame(step);
  }
  step();
  rest.style.color='var(--text)';
}
window.PixelUI={ initIslandNav, initStaticIsland };
document.querySelectorAll('.island-nav').forEach(initIslandNav);
document.querySelectorAll('.pfp-island-wrap').forEach(initStaticIsland);
})();
