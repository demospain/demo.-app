import { NextResponse } from 'next/server'

const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>demo. — Tu música, antes de existir para el mundo</title>
<meta name="description" content="Sube, organiza y comparte tu música antes de publicarla."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}

/* ── BRANDBOOK TOKENS ────────────────────────────── */
:root{
  --bg:#0f1117;
  --surface:#181c27;
  --elevated:#1f2335;
  --border:rgba(255,255,255,.07);
  --purple:#6E62F5;
  --purple-dk:#5A4FD4;
  --text:#EAE9E6;
  --muted:#9BA0AD;
  --dim:#555966;
  --vdim:#383C47;
  --green:#1D9E75;
  --mono:'DM Mono',monospace;
  --sans:'Inter',sans-serif;
}

html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--text);font-family:var(--sans);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
button{font-family:var(--sans)}
img{display:block;max-width:100%}

/* ── LAYOUT ─────────────────────────────────────── */
.wrap{width:100%;max-width:960px;margin:0 auto;padding:0 20px}
@media(min-width:640px){.wrap{padding:0 32px}}

/* ── NAV ─────────────────────────────────────────── */
nav{
  position:fixed;top:0;left:0;right:0;z-index:200;
  display:flex;align-items:center;justify-content:space-between;
  padding:0 20px;height:56px;
  background:rgba(15,17,23,.88);
  backdrop-filter:blur(20px);
  -webkit-backdrop-filter:blur(20px);
  border-bottom:1px solid var(--border);
}
.nav-logo{font-family:var(--mono);font-size:20px;font-weight:500;letter-spacing:-.02em}
.nav-logo span{color:var(--purple)}
.nav-links{display:none;align-items:center;gap:28px}
@media(min-width:640px){.nav-links{display:flex}}
.nav-links a{font-size:13px;color:var(--dim);transition:color .15s}
.nav-links a:hover{color:var(--text)}
.nav-cta{
  font-family:var(--mono);font-size:12px;font-weight:500;
  background:var(--purple);color:var(--text);
  padding:8px 18px;border-radius:8px;letter-spacing:.02em;
  transition:background .15s,transform .2s cubic-bezier(.34,1.4,.64,1);
}
.nav-cta:hover{background:var(--purple-dk);transform:scale(1.04)}

/* ── BTNS ─────────────────────────────────────────── */
.btn{
  display:inline-flex;align-items:center;justify-content:center;gap:8px;
  border:none;cursor:pointer;font-family:var(--sans);font-weight:500;
  transition:background .15s,transform .22s cubic-bezier(.34,1.4,.64,1),box-shadow .15s;
  text-decoration:none;border-radius:10px;
}
.btn:hover{transform:scale(1.03)}
.btn:active{transform:scale(.97)}
.btn-primary{
  background:var(--purple);color:var(--text);
  padding:14px 28px;font-size:15px;
  box-shadow:0 4px 20px rgba(110,98,245,.3);
}
.btn-primary:hover{background:var(--purple-dk);box-shadow:0 6px 28px rgba(110,98,245,.45)}
.btn-ghost{
  background:transparent;color:var(--muted);
  border:1px solid var(--border);padding:14px 24px;font-size:15px;
}
.btn-ghost:hover{border-color:rgba(255,255,255,.18);color:var(--text)}
.btn-full{width:100%}

/* ── TIPO ─────────────────────────────────────────── */
.label{
  font-family:var(--mono);font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--purple);display:block;margin-bottom:14px;
}
h1,h2,h3{font-family:var(--sans);font-weight:500;line-height:1.2;color:var(--text)}
.hero-wordmark{
  font-family:var(--mono);font-weight:500;letter-spacing:-.04em;
  font-size:clamp(72px,20vw,128px);line-height:1;
}
.hero-wordmark span{color:var(--purple)}
.hero-sub{font-size:clamp(16px,4vw,20px);color:var(--muted);max-width:420px;margin:0 auto;line-height:1.55}
.hero-sub strong{color:var(--text);font-weight:500}

/* ── CARD ─────────────────────────────────────────── */
.card{
  background:linear-gradient(180deg,rgba(255,255,255,.035) 0%,rgba(255,255,255,0) 60%),var(--surface);
  border:1px solid var(--border);
  border-radius:16px;
  transition:border-color .25s,box-shadow .25s,transform .25s cubic-bezier(.34,1.2,.64,1);
}
.card:hover{
  border-color:rgba(110,98,245,.28);
  box-shadow:0 8px 32px rgba(0,0,0,.28),0 0 0 1px rgba(110,98,245,.1);
  transform:translateY(-2px);
}

/* ── GLOW CARD (secciones principales) ─────────── */
.glow-card{
  background:
    radial-gradient(110% 120% at 50% 0%,rgba(110,98,245,.13) 0%,rgba(110,98,245,0) 65%),
    var(--surface);
  border:1px solid rgba(110,98,245,.22);
  border-radius:20px;
  padding:40px 24px;
  transition:border-color .3s,box-shadow .3s;
}
@media(min-width:640px){.glow-card{padding:56px 48px}}
.glow-card:hover{
  border-color:rgba(110,98,245,.4);
  box-shadow:0 0 60px rgba(110,98,245,.08);
}

/* ── FEAT GRID ─────────────────────────────────── */
.feat-grid{
  display:grid;
  grid-template-columns:1fr;
  gap:10px;
  margin-top:36px;
}
@media(min-width:480px){.feat-grid{grid-template-columns:1fr 1fr}}
@media(min-width:768px){.feat-grid{grid-template-columns:1fr 1fr 1fr}}
.feat-card{
  background:var(--bg);
  border:1px solid var(--border);
  border-radius:14px;
  padding:20px;
  transition:border-color .2s,transform .25s cubic-bezier(.34,1.3,.64,1),box-shadow .2s;
  position:relative;overflow:hidden;
}
.feat-card::before{
  content:'';position:absolute;inset:0;
  background:radial-gradient(circle at var(--mx,50%) var(--my,50%),rgba(110,98,245,.08) 0%,transparent 65%);
  opacity:0;transition:opacity .3s;pointer-events:none;
}
.feat-card:hover::before{opacity:1}
.feat-card:hover{
  border-color:rgba(110,98,245,.3);
  transform:translateY(-3px);
  box-shadow:0 8px 24px rgba(0,0,0,.25);
}
.feat-card.span2{grid-column:1/-1}
@media(min-width:768px){.feat-card.span2{grid-column:span 2}}
.feat-icon{
  width:36px;height:36px;border-radius:8px;
  background:rgba(110,98,245,.12);
  display:flex;align-items:center;justify-content:center;
  font-size:16px;margin-bottom:12px;
  transition:transform .25s cubic-bezier(.34,1.5,.64,1);
}
.feat-card:hover .feat-icon{transform:scale(1.15)}
.feat-title{font-size:14px;font-weight:500;margin-bottom:5px;color:var(--text)}
.feat-desc{font-size:13px;color:var(--muted);line-height:1.6}
.feat-tag{
  display:inline-block;margin-top:8px;
  font-family:var(--mono);font-size:10px;letter-spacing:.06em;
  background:rgba(110,98,245,.12);color:var(--purple);
  padding:2px 10px;border-radius:20px;
}

/* ── PILL TAGS ──────────────────────────────────── */
.pills{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:28px}
.pill{
  background:var(--elevated);
  border:1px solid var(--border);
  border-radius:99px;padding:7px 16px;
  font-size:13px;color:var(--muted);
  display:flex;align-items:center;gap:7px;
  transition:border-color .2s,color .2s,transform .2s cubic-bezier(.34,1.4,.64,1);
}
.pill:hover{border-color:rgba(110,98,245,.35);color:var(--text);transform:scale(1.04)}
.pill span{color:var(--purple);font-weight:600}

/* ── STEPS ──────────────────────────────────────── */
.steps{display:flex;flex-direction:column;gap:2px;margin-top:32px}
@media(min-width:600px){.steps{flex-direction:row}}
.step{
  flex:1;padding:24px 20px;text-align:center;
  border:1px solid var(--border);background:var(--bg);
  transition:background .2s,border-color .2s,transform .22s cubic-bezier(.34,1.3,.64,1);
}
.step:first-child{border-radius:14px 14px 0 0}
.step:last-child{border-radius:0 0 14px 14px}
@media(min-width:600px){
  .step:first-child{border-radius:14px 0 0 14px}
  .step:last-child{border-radius:0 14px 14px 0}
  .step:not(:first-child){border-left:none}
}
.step:hover{background:var(--surface);border-color:rgba(110,98,245,.25);transform:translateY(-2px)}
.step-num{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--purple);margin-bottom:14px}
.step-icon{
  width:48px;height:48px;border-radius:12px;
  background:var(--surface);border:1px solid var(--border);
  display:flex;align-items:center;justify-content:center;
  font-size:20px;margin:0 auto 14px;
  transition:transform .25s cubic-bezier(.34,1.5,.64,1),background .2s;
}
.step:hover .step-icon{transform:scale(1.12) rotate(-3deg);background:rgba(110,98,245,.12)}
.step-title{font-size:15px;font-weight:500;margin-bottom:5px}
.step-desc{font-size:13px;color:var(--muted);line-height:1.6}

/* ── NUMERO GRANDE ──────────────────────────────── */
.big-zero{
  font-family:var(--mono);
  font-size:clamp(72px,18vw,108px);
  font-weight:500;line-height:1;letter-spacing:-.04em;
  color:var(--text);margin-bottom:8px;
}

/* ── WAITLIST ───────────────────────────────────── */
.wl-input{
  padding:14px 16px;background:var(--bg);
  border:1px solid rgba(255,255,255,.1);border-radius:10px;
  color:var(--text);font-size:15px;font-family:var(--sans);
  outline:none;width:100%;transition:border-color .2s;
}
.wl-input:focus{border-color:rgba(110,98,245,.5)}
.wl-input::placeholder{color:var(--vdim)}
.wl-msg{min-height:20px;font-family:var(--mono);font-size:12px;color:var(--dim);margin-top:12px;text-align:center}
.wl-msg.ok{color:var(--green)}.wl-msg.err{color:#EF4444}
.role-opt{
  background:var(--bg);border:1.5px solid var(--border);
  border-radius:12px;color:var(--text);cursor:pointer;
  font-family:var(--sans);padding:14px 12px;
  text-align:left;transition:border-color .15s,background .15s,transform .2s cubic-bezier(.34,1.4,.64,1);width:100%;
}
.role-opt:hover{border-color:rgba(110,98,245,.35);background:rgba(110,98,245,.05);transform:scale(1.02)}
.role-opt.selected{border-color:var(--purple);background:rgba(110,98,245,.1)}

/* ── REVEAL ─────────────────────────────────────── */
.reveal,.reveal-l,.reveal-r{opacity:0;will-change:opacity,transform}
.reveal{transform:translateY(28px) scale(.99)}
.reveal-l{transform:translateX(-28px)}
.reveal-r{transform:translateX(28px)}
.reveal,.reveal-l,.reveal-r{transition:opacity .7s cubic-bezier(.22,1,.36,1),transform .7s cubic-bezier(.22,1,.36,1)}
.reveal.on,.reveal-l.on,.reveal-r.on{opacity:1;transform:none}
.d1{transition-delay:.08s}.d2{transition-delay:.16s}.d3{transition-delay:.24s}.d4{transition-delay:.32s}
@media(prefers-reduced-motion:reduce){.reveal,.reveal-l,.reveal-r{opacity:1!important;transform:none!important}}

/* ── SCROLL INDICATOR ────────────────────────────── */
@keyframes sh{0%,100%{opacity:.25;transform:translateX(-50%) translateY(0)}50%{opacity:.6;transform:translateX(-50%) translateY(6px)}}
@keyframes waveBar{from{transform:scaleY(.35)}to{transform:scaleY(1)}}

/* ── SCROLL PROGRESS ─────────────────────────────── */
#sprogress{position:fixed;top:0;left:0;height:2px;background:var(--purple);z-index:999;width:0%;transition:width .1s linear}
</style>
</head>
<body>

<div id="sprogress"></div>

<!-- NAV -->
<nav>
  <div class="nav-logo">demo<span>.</span></div>
  <div class="nav-links">
    <a href="#instalar">Instalar</a>
    <a href="#artista">Artistas</a>
    <a href="#productor">Productores</a>
  </div>
  <a href="#instalar" class="nav-cta">Instalar</a>
</nav>

<!-- HERO -->
<section style="min-height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px 20px 60px;text-align:center;position:relative;overflow:hidden">
  <div style="position:absolute;inset:0;pointer-events:none">
    <div style="position:absolute;width:600px;height:600px;border-radius:50%;background:radial-gradient(circle,rgba(110,98,245,.09) 0%,transparent 70%);top:-200px;left:-200px;animation:orbF 11s ease-in-out infinite"></div>
    <div style="position:absolute;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(110,98,245,.07) 0%,transparent 70%);bottom:-100px;right:-100px;animation:orbF 9s ease-in-out infinite;animation-delay:-5s"></div>
  </div>
  <style>@keyframes orbF{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-20px) scale(1.03)}}</style>
  <span class="label" style="margin-bottom:20px">Tu música, antes de publicarla</span>
  <h1 class="hero-wordmark">demo<span>.</span></h1>
  <p class="hero-sub" style="margin-top:20px">El espacio donde vive tu música<br><strong>antes de existir para el mundo.</strong></p>
  <div style="margin-top:32px;display:flex;gap:12px;flex-wrap:wrap;justify-content:center">
    <a href="#instalar" class="btn btn-primary">Instalar app →</a>
    <a href="#waitlist" class="btn btn-ghost">Unirme gratis</a>
  </div>
  <div style="width:100%;max-width:480px;margin:40px auto 0;overflow:hidden">
    <svg id="hero-svg" viewBox="0 0 640 56" fill="none" style="width:100%;height:auto;display:block;opacity:.6"></svg>
  </div>
  <div style="position:absolute;bottom:28px;left:50%;animation:sh 2.2s ease-in-out infinite">
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M5 7l5 5 5-5" stroke="rgba(255,255,255,.25)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
</section>

<!-- INSTALAR -->
<section id="instalar" style="padding:80px 0">
  <div class="wrap">
    <div class="glow-card reveal" style="text-align:center;padding:60px 24px">
      <span class="label">Ya disponible</span>
      <h2 style="font-size:clamp(32px,8vw,56px);line-height:1.15;margin-bottom:16px">Tenla siempre<br>a un toque.</h2>
      <p style="font-size:clamp(14px,3vw,17px);color:var(--muted);max-width:420px;margin:0 auto 40px;line-height:1.65">Se instala directo desde tu navegador.<br>Sin tiendas, sin esperas, sin ocupar espacio.</p>

      <!-- Botones plataforma -->
      <div style="display:flex;flex-direction:column;gap:14px;max-width:340px;margin:0 auto">

        <!-- iOS -->
        <a href="https://demospain.app/instalar" style="display:flex;align-items:center;gap:16px;background:var(--text);color:var(--bg);padding:16px 24px;border-radius:14px;text-decoration:none;transition:transform .2s cubic-bezier(.34,1.4,.64,1),box-shadow .2s;box-shadow:0 4px 20px rgba(234,233,230,.1)" onmouseenter="this.style.transform='scale(1.03)';this.style.boxShadow='0 8px 32px rgba(234,233,230,.18)'" onmouseleave="this.style.transform='';this.style.boxShadow='0 4px 20px rgba(234,233,230,.1)'">
          <svg width="28" height="34" viewBox="0 0 28 34" fill="currentColor"><path d="M23.2 18.1c0-3.7 3-5.5 3.1-5.6-1.7-2.5-4.3-2.8-5.2-2.9-2.2-.2-4.3 1.3-5.5 1.3-1.1 0-2.9-1.3-4.7-1.2-2.4 0-4.6 1.4-5.8 3.5-2.5 4.3-.6 10.7 1.8 14.2 1.2 1.7 2.6 3.6 4.5 3.6 1.8-.1 2.5-1.2 4.6-1.2 2.1 0 2.7 1.2 4.6 1.1 1.9 0 3.2-1.7 4.4-3.5 1.4-2 1.9-3.9 2-4-.1-.1-3.8-1.5-3.8-5.3zm-3.6-9.7c1-1.2 1.6-2.9 1.4-4.6-1.4.1-3 .9-4 2.1-.9 1-1.7 2.7-1.4 4.3 1.5.1 3-.8 4-1.8z"/></svg>
          <div style="text-align:left">
            <div style="font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin-bottom:2px">iPhone · iPad</div>
            <div style="font-size:16px;font-weight:500">Instalar en iOS</div>
          </div>
        </a>

        <!-- Android -->
        <a href="https://demospain.app/instalar" style="display:flex;align-items:center;gap:16px;background:var(--text);color:var(--bg);padding:16px 24px;border-radius:14px;text-decoration:none;transition:transform .2s cubic-bezier(.34,1.4,.64,1),box-shadow .2s;box-shadow:0 4px 20px rgba(234,233,230,.1)" onmouseenter="this.style.transform='scale(1.03)';this.style.boxShadow='0 8px 32px rgba(234,233,230,.18)'" onmouseleave="this.style.transform='';this.style.boxShadow='0 4px 20px rgba(234,233,230,.1)'">
          <svg width="30" height="34" viewBox="0 0 30 34" fill="none"><path d="M1.5 12.2C1.5 11 2.5 10 3.7 10h22.6c1.2 0 2.2 1 2.2 2.2v13.6c0 1.2-1 2.2-2.2 2.2H3.7c-1.2 0-2.2-1-2.2-2.2V12.2z" fill="#34A853"/><path d="M15 10l-8-8M15 10l8-8" stroke="#34A853" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="18" r="1.5" fill="white"/><circle cx="20" cy="18" r="1.5" fill="white"/><path d="M10 24h10" stroke="white" stroke-width="1.5" stroke-linecap="round"/><path d="M1.5 16h27M1.5 22h27" stroke="white" stroke-width=".5" opacity=".3"/><path d="M0 14h1.5M28.5 14H30M0 20h1.5M28.5 20H30" stroke="#34A853" stroke-width="2" stroke-linecap="round"/></svg>
          <div style="text-align:left">
            <div style="font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin-bottom:2px">Android · Chrome</div>
            <div style="font-size:16px;font-weight:500">Instalar en Android</div>
          </div>
        </a>

        <!-- Desktop -->
        <a href="https://demospain.app/instalar" style="display:flex;align-items:center;gap:16px;background:var(--elevated);border:1px solid var(--border);color:var(--muted);padding:14px 24px;border-radius:14px;text-decoration:none;transition:transform .2s cubic-bezier(.34,1.4,.64,1),border-color .2s,color .2s" onmouseenter="this.style.transform='scale(1.02)';this.style.borderColor='rgba(110,98,245,.35)';this.style.color='#EAE9E6'" onmouseleave="this.style.transform='';this.style.borderColor='';this.style.color=''">
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect x="2" y="3" width="24" height="16" rx="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M9 25h10M14 19v6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          <div style="text-align:left">
            <div style="font-family:var(--mono);font-size:10px;letter-spacing:.06em;text-transform:uppercase;opacity:.6;margin-bottom:2px">Windows · Mac · Linux</div>
            <div style="font-size:15px;font-weight:500">Instalar en escritorio</div>
          </div>
        </a>
      </div>

      <div style="margin-top:28px;display:flex;flex-direction:column;gap:8px;align-items:center">
        <p style="font-family:var(--mono);font-size:11px;color:var(--dim);letter-spacing:.04em">Gratis · 10 segundos · Sin tarjeta</p>
        <a href="https://www.demospain.app/profile" style="font-family:var(--mono);font-size:11px;color:var(--dim);text-decoration:underline;text-underline-offset:3px">o continuar en el navegador</a>
      </div>
    </div>
  </div>
</section>

<!-- CÓMO FUNCIONA -->
<section style="padding:80px 0">
  <div class="wrap">
    <div class="reveal" style="text-align:center;margin-bottom:8px">
      <span class="label">Cómo funciona</span>
      <h2 style="font-size:clamp(24px,5vw,36px)">Tres pasos.<br>Sin complicaciones.</h2>
    </div>
    <div class="steps reveal d1" style="margin-top:32px">
      <div class="step">
        <div class="step-num">01</div>
        <div class="step-icon">⬆️</div>
        <div class="step-title">Sube tu música</div>
        <p class="step-desc">WAV, MP3, FLAC o AIFF. En la nube, no en tu móvil.</p>
      </div>
      <div class="step">
        <div class="step-num">02</div>
        <div class="step-icon">💿</div>
        <div class="step-title">Crea un proyecto</div>
        <p class="step-desc">Portada y tracklist. Tu EP antes de existir.</p>
      </div>
      <div class="step">
        <div class="step-num">03</div>
        <div class="step-icon">🔗</div>
        <div class="step-title">Comparte un link</div>
        <p class="step-desc">El receptor escucha directo. Sin registrarse.</p>
      </div>
    </div>
  </div>
</section>

<!-- PLAN GRATUITO -->
<section style="padding:80px 0">
  <div class="wrap" style="max-width:640px">
    <div class="glow-card reveal" style="text-align:center">
      <span style="display:inline-block;background:rgba(110,98,245,.1);border:1px solid rgba(110,98,245,.2);border-radius:20px;padding:5px 16px;font-family:var(--mono);font-size:11px;color:var(--purple);letter-spacing:.06em;text-transform:uppercase;margin-bottom:20px">Para siempre gratis</span>
      <div class="big-zero">0 <span style="font-size:.28em;color:var(--muted);font-weight:400">EUR/mes</span></div>
      <p style="font-size:15px;color:var(--muted);margin-bottom:28px">Sin tarjeta · Sin límite de tiempo · Sin trampa</p>
      <div class="pills reveal d1">
        <div class="pill"><span>✓</span>50 canciones</div>
        <div class="pill"><span>✓</span>Proyectos ilimitados</div>
        <div class="pill"><span>✓</span>Waveform player</div>
        <div class="pill"><span>✓</span>Sin descargas al móvil</div>
        <div class="pill"><span>✓</span>Notificaciones</div>
        <div class="pill"><span>✓</span>Proyectos grupales</div>
      </div>
      <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap" class="reveal d2">
        <a href="#waitlist" class="btn btn-primary">Crear cuenta gratis</a>
        <a href="#artista" class="btn btn-ghost">Ver funcionalidades</a>
      </div>
    </div>
  </div>
</section>

<!-- ARTISTAS -->
<section id="artista" style="padding:80px 0">
  <div class="wrap">
    <div class="glow-card reveal">
      <span class="label">Para artistas independientes</span>
      <h2 style="font-size:clamp(24px,5vw,36px);margin-bottom:10px">Tu espacio antes<br>de publicar.</h2>
      <p style="font-size:15px;color:var(--muted);max-width:480px;line-height:1.65">Todo lo que necesitas para guardar, organizar y compartir tu música. Gratis.</p>
      <div class="feat-grid">
        <div class="feat-card">
          <div class="feat-icon">☁️</div>
          <div class="feat-title">Tu música en la nube</div>
          <p class="feat-desc">WAV, MP3, FLAC, AIFF. Los archivos viven en la nube, no en tu móvil.</p>
        </div>
        <div class="feat-card">
          <div class="feat-icon">💿</div>
          <div class="feat-title">Proyectos tipo álbum</div>
          <p class="feat-desc">Portada y tracklist. Previsualiza tu EP antes de publicarlo.</p>
          <span class="feat-tag">diferencial</span>
        </div>
        <div class="feat-card">
          <div class="feat-icon">🔔</div>
          <div class="feat-title">Notificaciones de escuchas</div>
          <p class="feat-desc">Quién escuchó, qué canción y cuándo. Sin adivinar.</p>
          <span class="feat-tag">diferencial</span>
        </div>
        <div class="feat-card">
          <div class="feat-icon">🎵</div>
          <div class="feat-title">Reproductor waveform</div>
          <p class="feat-desc">Shuffle, repetición y controles. También desde la pantalla de bloqueo.</p>
        </div>
        <div class="feat-card">
          <div class="feat-icon">👥</div>
          <div class="feat-title">Proyectos grupales</div>
          <p class="feat-desc">Varios artistas, mismo proyecto. Perfecto para colectivos.</p>
        </div>
        <div class="feat-card">
          <div class="feat-icon">📂</div>
          <div class="feat-title">Guardado automático</div>
          <p class="feat-desc">Los proyectos compartidos aparecen directo en tu biblioteca.</p>
        </div>
        <div class="feat-card span2">
          <div style="display:flex;align-items:flex-start;gap:16px;flex-wrap:wrap">
            <div class="feat-icon" style="flex-shrink:0">🔒</div>
            <div>
              <div class="feat-title">Control total del acceso</div>
              <p class="feat-desc">Privado, solo con link o público. Cambia cuando quieras — tú decides quién escucha qué y cuándo.</p>
              <div style="display:flex;gap:8px;margin-top:12px;flex-wrap:wrap">
                <span style="font-family:var(--mono);font-size:11px;background:rgba(255,255,255,.05);border:1px solid var(--border);padding:3px 10px;border-radius:6px;color:var(--dim)">🔒 Privado</span>
                <span style="font-family:var(--mono);font-size:11px;background:rgba(245,158,11,.08);border:1px solid rgba(245,158,11,.2);padding:3px 10px;border-radius:6px;color:#F59E0B">🔗 Solo link</span>
                <span style="font-family:var(--mono);font-size:11px;background:rgba(29,158,117,.08);border:1px solid rgba(29,158,117,.2);padding:3px 10px;border-radius:6px;color:var(--green)">🌍 Público</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<!-- PRODUCTOR -->
<section id="productor" style="padding:80px 0">
  <div class="wrap" style="max-width:560px">
    <div class="glow-card reveal" style="text-align:center">
      <span class="label">Para productores e ingenieros</span>
      <h2 style="font-size:clamp(24px,5vw,36px);margin-bottom:14px">El flujo con<br>tus clientes, ordenado.</h2>
      <p style="font-size:15px;color:var(--muted);max-width:380px;margin:0 auto 28px;line-height:1.65">Revisiones, versiones y aprobaciones sin perder el hilo. Tu cliente accede siempre gratis.</p>
      <div style="display:inline-block;font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--purple);background:rgba(110,98,245,.08);border:1px solid rgba(110,98,245,.2);padding:6px 18px;border-radius:6px;margin-bottom:14px">Próximamente</div>
      <p style="font-size:13px;color:var(--dim);max-width:340px;margin:0 auto 28px;line-height:1.65">Apúntate y te avisamos en cuanto esté lista.</p>
      <a href="#instalar" class="btn btn-primary">Instalar gratis</a>
    </div>
  </div>
</section>

<!-- CTA FINAL -->
<section style="padding:80px 0 100px">
  <div class="wrap" style="max-width:560px;text-align:center">
    <div class="reveal">
      <div style="font-family:var(--mono);font-size:clamp(56px,14vw,96px);font-weight:500;letter-spacing:-.04em;line-height:1;margin-bottom:16px">demo<span style="color:var(--purple)">.</span></div>
      <p style="font-size:16px;color:var(--muted);max-width:320px;margin:0 auto 32px;line-height:1.6">Tu música, antes de existir para el mundo.</p>
      <a href="#instalar" class="btn btn-primary" style="font-size:16px;padding:16px 36px">Instalar gratis →</a>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer style="border-top:1px solid var(--border);padding:28px 20px;display:flex;flex-wrap:wrap;gap:14px 20px;align-items:center;justify-content:space-between">
  <div style="font-family:var(--mono);font-size:18px;font-weight:500;letter-spacing:-.02em">demo<span style="color:var(--purple)">.</span></div>
  <span style="font-family:var(--mono);font-size:11px;color:var(--dim)">DROKO & YEB · Madrid, 2026</span>
  <div style="display:flex;gap:8px;flex-wrap:wrap">
    <a href="https://www.demospain.app/privacy" style="font-family:var(--mono);font-size:11px;color:var(--dim);border:1px solid var(--border);padding:5px 12px;border-radius:6px;transition:color .15s,border-color .15s" onmouseenter="this.style.color='#EAE9E6';this.style.borderColor='rgba(255,255,255,.18)'" onmouseleave="this.style.color='';this.style.borderColor=''">Privacidad</a>
    <a href="https://www.demospain.app/terms" style="font-family:var(--mono);font-size:11px;color:var(--dim);border:1px solid var(--border);padding:5px 12px;border-radius:6px;transition:color .15s,border-color .15s" onmouseenter="this.style.color='#EAE9E6';this.style.borderColor='rgba(255,255,255,.18)'" onmouseleave="this.style.color='';this.style.borderColor=''">Términos</a>
    <a href="https://www.demospain.app/cookies" style="font-family:var(--mono);font-size:11px;color:var(--dim);border:1px solid var(--border);padding:5px 12px;border-radius:6px;transition:color .15s,border-color .15s" onmouseenter="this.style.color='#EAE9E6';this.style.borderColor='rgba(255,255,255,.18)'" onmouseleave="this.style.color='';this.style.borderColor=''">Cookies</a>
  </div>
</footer>

<script>
// ══ SCROLL PROGRESS ═══════════════════════════════════════════
const sbar=document.getElementById('sprogress');
window.addEventListener('scroll',()=>{
  const pct=window.scrollY/(document.documentElement.scrollHeight-window.innerHeight)*100;
  sbar.style.width=Math.min(100,pct)+'%';
},{passive:true});

// ══ SCROLL REVEAL ═════════════════════════════════════════════
(function(){
  if(!('IntersectionObserver' in window)){
    document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el=>el.classList.add('on'));return;
  }
  const io=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('on');io.unobserve(e.target);}});
  },{threshold:0.1});
  document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el=>io.observe(el));
})();

// ══ WAVEFORM HERO ═════════════════════════════════════════════
(function(){
  const svg=document.getElementById('hero-svg');if(!svg)return;
  const H=[28,44,22,52,36,60,28,48,34,56,24,40,64,32,48,18,52,36,60,28,44,22,56,32,48,24,60,40,52,28,44,64,32,48,20,52,36,56,28,40];
  svg.setAttribute('viewBox',\`0 0 \${H.length*16} 56\`);
  const bars=H.map((h,i)=>{
    const r=document.createElementNS('http://www.w3.org/2000/svg','rect');
    r.setAttribute('x',i*16);r.setAttribute('width','8');r.setAttribute('rx','4');
    r.setAttribute('fill','#6E62F5');svg.appendChild(r);return r;
  });
  const ph=H.map((_,i)=>i*0.35),sp=H.map((_,i)=>0.7+(i%7)*0.11),mn=H.map(h=>h*.2);
  let t=0;
  function tick(){
    t+=0.014;
    bars.forEach((r,i)=>{
      const w=Math.sin(t*sp[i]+ph[i])*.45+Math.sin(t*sp[i]*1.6+ph[i]*.5)*.2;
      const h=Math.max(mn[i],H[i]*(.3+.7*(.5+w*.5)));
      r.setAttribute('height',h.toFixed(1));r.setAttribute('y',((56-h)/2).toFixed(1));
      r.setAttribute('opacity',(0.45+Math.abs(w)*.55).toFixed(2));
    });
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ══ FEAT CARD CURSOR GLOW ═════════════════════════════════════
// Efecto de luz que sigue al cursor dentro de cada feat-card
(function(){
  if(window.matchMedia('(pointer:coarse)').matches)return;
  document.querySelectorAll('.feat-card').forEach(card=>{
    card.addEventListener('mousemove',e=>{
      const r=card.getBoundingClientRect();
      card.style.setProperty('--mx',((e.clientX-r.left)/r.width*100)+'%');
      card.style.setProperty('--my',((e.clientY-r.top)/r.height*100)+'%');
    });
  });
})();

// ══ STEP CARD: EFECTO CURSOR ══════════════════════════════════
(function(){
  if(window.matchMedia('(pointer:coarse)').matches)return;
  document.querySelectorAll('.step').forEach(step=>{
    step.addEventListener('mouseenter',()=>{
      const icon=step.querySelector('.step-icon');
      if(icon)icon.style.transform='scale(1.14) rotate(-4deg)';
    });
    step.addEventListener('mouseleave',()=>{
      const icon=step.querySelector('.step-icon');
      if(icon)icon.style.transform='';
    });
  });
})();

// ══ PILL HOVER ════════════════════════════════════════════════
(function(){
  if(window.matchMedia('(pointer:coarse)').matches)return;
  document.querySelectorAll('.pill').forEach(pill=>{
    pill.addEventListener('mouseenter',()=>pill.style.transform='scale(1.06)');
    pill.addEventListener('mouseleave',()=>pill.style.transform='');
  });
})();
</script>
</body>
</html>
`

export async function GET() {
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}
