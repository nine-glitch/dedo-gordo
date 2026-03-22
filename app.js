const PROXY = 'https://dedo-gordo.vercel.app/api/claude-proxy';

const SYSTEM_TEASER = `Sos una pitonisa paraguaya, cínica y mística. Observá la imagen del dedo gordo: cutícula, vello, uña, callos, color, hidratación. Elegí EL detalle más llamativo. EXACTAMENTE dos oraciones, no más. Primera: dato clínico concreto sobre ese detalle, seco e irónico. Segunda: remate místico cómico que se desprenda de ese dato. Directo, sin introducción, sin "noto que". Rioplatense. Si escribís más de dos oraciones, fallaste.El remate tiene que sorprender — que la persona piense "no me lo esperaba". Evitá metáforas obvias. Cuanto más específico y absurdo el remate, mejor.`;

const SYSTEM_ANALISIS = `Sos una pitonisa paraguaya, cínica y mística. Observá el dedo gordo en detalle: cutícula, vello, uña, callos, hidratación. Basándote en lo que ves, escribí tres predicciones con jerga esotérica y humor negro:
💰 DINERO: una predicción económica basada en algún detalle del pie. 2-3 oraciones, cómica, con remate, rioplatense.
❤️ AMOR: una predicción amorosa. 2-3 oraciones, cómica, con remate, rioplatense.
⚠️ ADVERTENCIA DE MIERDA: algo que va a salir mal si no presta atención. 2-3 oraciones, cómica, con remate, rioplatense.
Terminá con una frase corta y sentenciosa de cierre, como sello de la pitonisa. Sin introducción. Directo a las predicciones.`;

function toggleMail(){
  var m=document.getElementById('mail-reveal');
  m.style.display=m.style.display==='none'?'inline':'none';
}

function handleOverlayClick(e){
  if(e.target===document.getElementById('modal')) cerrarModal();
}

function cerrarModal(){
  document.getElementById('modal').classList.remove('open');
  document.body.style.overflow='';
  document.getElementById('foto').value='';
  clearInterval(window._progInterval);
}

function abrirModal(){
  document.getElementById('modal').classList.add('open');
  document.body.style.overflow='hidden';
}

function resetModal(){
  document.getElementById('fase-loading').style.display='none';
  document.getElementById('fase-paywall').style.display='none';
  document.getElementById('fase-completo').style.display='none';
  document.getElementById('teaser-scanning').style.display='flex';
  document.getElementById('teaser-contenido').style.display='none';
  document.getElementById('teaser-text').style.display='none';
  document.getElementById('progress-fill').style.width='0%';
  document.getElementById('pct').textContent='0%';
}

function mostrarFase(f){
  document.getElementById('fase-loading').style.display='none';
  document.getElementById('fase-paywall').style.display='none';
  document.getElementById('fase-completo').style.display='none';
  if(f) document.getElementById(f).style.display='flex';
}

function iniciarBarra(onComplete){
  const fill=document.getElementById('progress-fill');
  const pct=document.getElementById('pct');
  let p=0;
  const step=100/(10000/80);
  clearInterval(window._progInterval);
  window._progInterval=setInterval(()=>{
    p=Math.min(p+step,100);
    fill.style.width=p+'%';
    pct.textContent=Math.round(p)+'%';
    if(p>=100){clearInterval(window._progInterval);onComplete();}
  },80);
}

async function procesarFoto(event){
  const file=event.target.files[0];
  if(!file) return;
  const reader=new FileReader();
  reader.onload=async(e)=>{
    const b64=e.target.result.split(',')[1];
    const mime=file.type;

    abrirModal();
    resetModal();
    document.getElementById('modal-img').src=e.target.result;
    document.getElementById('modal-thumb').style.display='flex';
    mostrarFase('fase-loading');

    const makeBody=(system,maxTokens)=>JSON.stringify({
      model:'claude-sonnet-4-20250514',
      max_tokens:maxTokens,
      system,
      messages:[{role:'user',content:[
        {type:'image',source:{type:'base64',media_type:mime,data:b64}},
        {type:'text',text:'Analizá este dedo gordo.'}
      ]}]
    });

    const [teaserRes,analisisRes]=await Promise.allSettled([
      fetch(PROXY,{method:'POST',headers:{'Content-Type':'application/json'},body:makeBody(SYSTEM_TEASER,300)}).then(r=>r.json()),
      fetch(PROXY,{method:'POST',headers:{'Content-Type':'application/json'},body:makeBody(SYSTEM_ANALISIS,600)}).then(r=>r.json())
    ]);

    const teaserTexto=teaserRes.status==='fulfilled'
      ? teaserRes.value.content?.map(b=>b.text||'').join('')||'el pie guarda silencio.'
      : 'la pitonisa percibe algo que no puede ignorar.';

    const analisisTexto=analisisRes.status==='fulfilled'
      ? analisisRes.value.content?.map(b=>b.text||'').join('')||'la lectura completa está lista.'
      : 'el cosmos podal ha hablado. contactá a la pitonisa para más detalles.';

    document.getElementById('teaser-scanning').style.display='none';
    document.getElementById('teaser-contenido').style.display='flex';
    document.getElementById('teaser-text').textContent=teaserTexto;
    document.getElementById('teaser-text').style.display='block';

    iniciarBarra(()=>{
      document.getElementById('paywall-teaser').textContent=teaserTexto;
      document.getElementById('analisis-texto').textContent=analisisTexto;
      mostrarFase('fase-paywall');
    });
  };
  reader.readAsDataURL(file);
}
