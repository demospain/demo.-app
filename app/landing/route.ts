import { NextResponse } from 'next/server'

// Landing page completa servida como HTML estático en /landing.
// Contenido idéntico al de demospain.github.io/demo., con las secciones
// actualizadas (instalación, sin mockup interactivo, sin planes de precio
// de artista, sin testimonios, con términos/cookies en el footer).
const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>demo. — Tu música, antes de existir para el mundo</title>
<meta name="description" content="Sube todas tus canciones y demos sin límite. Crea proyectos tipo álbum. Comparte con quien quieras."/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
:root{
  --black:#0f1117;--purple:#6E62F5;--purple-dk:#5A4FD4;
  --dark:#181c27;--surface:#1f2335;
  --gray-mid:#9BA0AD;--gray-dim:#555966;--white:#F8F7F4;
  --green:#1D9E75;
  --mono:'DM Mono',monospace;--sans:'Inter',sans-serif;
  --r-sm:8px;--r-md:12px;--r-lg:16px;
}
html{scroll-behavior:smooth}
body{background:var(--black);color:var(--white);font-family:var(--sans);font-size:16px;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
a{color:inherit;text-decoration:none}
button{font-family:var(--sans)}
.container{width:100%;max-width:960px;margin:0 auto;padding:0 20px}
@media(min-width:640px){.container{padding:0 32px}}

/* NAV */
nav{position:fixed;top:0;left:0;right:0;z-index:200;display:flex;align-items:center;justify-content:space-between;padding:0 20px;height:52px;background:rgba(17,19,24,.92);backdrop-filter:blur(16px);border-bottom:1px solid rgba(255,255,255,.06)}
.nav-logo{font-family:var(--mono);font-size:18px;font-weight:500;letter-spacing:-.02em}
.nav-logo span{color:var(--purple)}
.nav-right{display:flex;align-items:center;gap:12px}
.nav-hide{display:none}
@media(min-width:640px){.nav-hide{display:block;font-size:13px;color:var(--gray-mid);transition:color .15s}.nav-hide:hover{color:var(--white)}}
.nav-cta{background:var(--purple);color:var(--white);padding:8px 18px;border-radius:var(--r-sm);font-size:14px;font-weight:500;transition:background .15s}
.nav-cta:hover{background:var(--purple-dk)}

/* BTNS */
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;border:none;cursor:pointer;font-family:var(--sans);font-weight:500;transition:all .15s;text-decoration:none}
.btn-lg{padding:15px 28px;font-size:16px;border-radius:var(--r-md)}
.btn-full{width:100%}
.btn-purple{background:var(--purple);color:var(--white)}.btn-purple:hover{background:var(--purple-dk)}
.btn-ghost{background:transparent;color:var(--gray-mid);border:1px solid rgba(255,255,255,.1)}.btn-ghost:hover{border-color:rgba(255,255,255,.25);color:var(--white)}

/* TYPE */
.eyebrow{font-family:var(--mono);font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--purple);display:block;margin-bottom:12px}
.sec-title{font-size:clamp(24px,5vw,38px);font-weight:500;line-height:1.2}
.sec-sub{font-size:15px;color:var(--gray-mid);line-height:1.65;margin-top:12px}
.hero-logo{font-family:var(--mono);font-size:clamp(72px,18vw,120px);font-weight:500;letter-spacing:-.04em;line-height:1;margin-bottom:4px}
.hero-logo span{color:var(--purple)}
.hero-tag{font-size:clamp(15px,4vw,20px);color:var(--gray-mid);max-width:400px;margin:0 auto;line-height:1.5}
.hero-tag strong{color:var(--white);font-weight:500}

/* HOW */
.steps{display:flex;flex-direction:column;gap:24px;max-width:640px;margin:40px auto 0}
@media(min-width:640px){.steps{flex-direction:row;max-width:860px;gap:16px}}
.step{flex:1;text-align:center;padding:24px}
.step-num{font-family:var(--mono);font-size:11px;letter-spacing:.1em;color:var(--purple);margin-bottom:16px}
.step-icon{width:52px;height:52px;border-radius:var(--r-md);background:var(--dark);border:1px solid rgba(124,111,255,.2);display:flex;align-items:center;justify-content:center;font-size:22px;margin:0 auto 16px}
.step-title{font-size:16px;font-weight:500;margin-bottom:6px}
.step-desc{font-size:13px;color:var(--gray-mid);line-height:1.6}

/* FEAT CARDS */
.feat-grid{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:560px){.feat-grid{grid-template-columns:1fr 1fr}}
.feat-card{background:var(--surface);border:1px solid rgba(255,255,255,.06);border-radius:var(--r-lg);padding:22px;transition:border-color .2s}
.feat-card:hover{border-color:rgba(124,111,255,.3)}
.feat-card.wide{grid-column:1/-1}
.feat-icon{width:38px;height:38px;border-radius:var(--r-sm);background:rgba(124,111,255,.12);display:flex;align-items:center;justify-content:center;font-size:17px;margin-bottom:12px}
.feat-title{font-size:14px;font-weight:500;margin-bottom:5px}
.feat-desc{font-size:13px;color:var(--gray-mid);line-height:1.65}
.feat-tag{display:inline-block;margin-top:8px;font-family:var(--mono);font-size:10px;background:rgba(124,111,255,.12);color:var(--purple);padding:2px 9px;border-radius:20px}

/* PLAN CARDS */
.plans-row{display:grid;grid-template-columns:1fr;gap:12px;margin-top:24px}
@media(min-width:560px){.plans-row{grid-template-columns:1fr 1fr}}
.plan-card{background:var(--dark);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-lg);padding:24px}
.plan-card.feat{border-color:rgba(124,111,255,.4);background:rgba(124,111,255,.04);border-top-color:var(--purple);border-top-width:3px}
.plan-name{font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-dim);margin-bottom:6px}
.plan-price{font-size:36px;font-weight:500;margin-bottom:4px}
.plan-price span{font-size:14px;color:var(--gray-mid);font-weight:400}
.plan-desc{font-size:13px;color:var(--gray-dim);padding-bottom:14px;border-bottom:1px solid rgba(255,255,255,.12);margin-bottom:14px}
.plan-list{list-style:none;display:flex;flex-direction:column;gap:7px}
.plan-list li{font-size:13px;color:var(--gray-mid);display:flex;gap:8px;align-items:flex-start}
.plan-list li::before{content:'✓';color:var(--purple);flex-shrink:0;font-weight:600}
.plan-list li.no::before{content:'—';color:var(--gray-dim)}
.plan-list li.no{color:var(--gray-dim)}
.plan-cta{display:block;text-align:center;padding:11px;border-radius:var(--r-sm);font-size:14px;font-weight:500;transition:all .15s;margin-top:20px}
.plan-cta.fill{background:var(--purple);color:var(--white)}.plan-cta.fill:hover{background:var(--purple-dk)}
.plan-cta.line{border:1px solid rgba(255,255,255,.1);color:var(--gray-mid)}.plan-cta.line:hover{border-color:rgba(255,255,255,.25);color:var(--white)}
.prod-plans{display:grid;grid-template-columns:1fr;gap:12px;margin-top:48px}
@media(min-width:480px){.prod-plans{grid-template-columns:repeat(3,1fr)}}

/* WORKFLOW */
.wf-row{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid rgba(255,255,255,.04)}
.wf-row:last-child{border-bottom:none}
.wf-ic{width:34px;height:34px;min-width:34px;border-radius:var(--r-sm);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0}
.wf-ic-p{background:rgba(124,111,255,.12)}.wf-ic-a{background:rgba(245,158,11,.12)}.wf-ic-g{background:rgba(29,158,117,.12)}
.wf-t{font-size:13px;font-weight:500}.wf-s{font-size:11px;color:var(--gray-dim)}
.wf-badge{font-family:var(--mono);font-size:10px;padding:3px 8px;border-radius:12px;flex-shrink:0;white-space:nowrap}
.wfb-p{background:rgba(124,111,255,.12);color:var(--purple)}
.wfb-a{background:rgba(245,158,11,.12);color:#F59E0B}
.wfb-g{background:rgba(29,158,117,.12);color:var(--green)}
.pfeat-grid{display:grid;grid-template-columns:1fr;gap:10px;margin-top:32px}
@media(min-width:560px){.pfeat-grid{grid-template-columns:1fr 1fr}}
.pfeat{display:flex;gap:12px;align-items:flex-start;padding:16px;background:var(--black);border:1px solid rgba(255,255,255,.06);border-radius:var(--r-md)}
.pfeat-t{font-size:14px;font-weight:500;margin-bottom:3px}
.pfeat-s{font-size:12px;color:var(--gray-mid);line-height:1.5}

/* QUOTE */
.quote-card{border:1px solid rgba(124,111,255,.25);border-radius:var(--r-lg);padding:24px;background:rgba(124,111,255,.04)}
.quote-text{font-size:clamp(14px,3vw,18px);line-height:1.65;color:var(--white);margin-bottom:20px;font-style:italic}
.quote-text::before{content:'\\201C';color:var(--purple);font-size:1.4em;line-height:0;vertical-align:-.2em;margin-right:2px}
.quote-text::after{content:'\\201D';color:var(--purple);font-size:1.4em;line-height:0;vertical-align:-.2em;margin-left:2px}
.quote-author{display:flex;align-items:center;gap:12px}
.quote-av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--purple),var(--purple-dk));display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0}

/* WAITLIST */
.wl-title{font-family:var(--mono);font-size:clamp(52px,14vw,96px);font-weight:500;letter-spacing:-.04em;line-height:1;margin-bottom:16px}
.wl-title span{color:var(--purple)}
.wl-form{display:flex;flex-direction:column;gap:10px;max-width:480px;margin:0 auto}
.wl-input{padding:14px 16px;background:var(--dark);border:1px solid rgba(255,255,255,.1);border-radius:var(--r-sm);color:var(--white);font-size:15px;font-family:var(--sans);outline:none;transition:border-color .15s;width:100%}
.wl-input:focus{border-color:rgba(124,111,255,.5)}
.wl-msg{min-height:22px;font-family:var(--mono);font-size:12px;color:var(--gray-dim);margin-top:14px}
.wl-msg.ok{color:var(--green)}.wl-msg.err{color:#EF4444}
.role-opt{background:var(--dark);border:1.5px solid rgba(255,255,255,.08);border-radius:var(--r-md);color:var(--white);cursor:pointer;font-family:var(--sans);padding:14px 12px;text-align:left;transition:all .15s;width:100%}
.role-opt:hover{border-color:rgba(124,111,255,.35);background:rgba(124,111,255,.05)}
.role-opt.selected{border-color:var(--purple);background:rgba(124,111,255,.1)}

/* REVEAL */
.reveal{opacity:0;transform:translateY(28px);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
.reveal.visible{opacity:1;transform:translateY(0)}
.reveal-l{opacity:0;transform:translateX(-28px);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
.reveal-l.visible{opacity:1;transform:translateX(0)}
.reveal-r{opacity:0;transform:translateX(28px);transition:opacity .6s cubic-bezier(.22,1,.36,1),transform .6s cubic-bezier(.22,1,.36,1)}
.reveal-r.visible{opacity:1;transform:translateX(0)}
.d1{transition-delay:.1s}.d2{transition-delay:.2s}.d3{transition-delay:.3s}.d4{transition-delay:.4s}
@keyframes sh{0%,100%{opacity:.3;transform:translateX(-50%) translateY(0)}50%{opacity:.7;transform:translateX(-50%) translateY(5px)}}
@media(prefers-reduced-motion:reduce){.reveal,.reveal-l,.reveal-r{opacity:1!important;transform:none!important}}

/* ══════════════════════════════════════════════
   MOCKUP MÓVIL — sistema proporcional
   Todo se mide relativo al ancho de .phone-screen-wrap
   usando container queries o clamp+vw sobre el padre.
   La clave: aspect-ratio 9/19.5 + overflow:hidden
   + flexbox column en la pantalla.
   ══════════════════════════════════════════════ */

.mockup-wrap{display:flex;gap:28px;align-items:flex-start;justify-content:center;flex-wrap:wrap;padding:0 20px}

/* CARCASA */
.phone-shell{
  width:280px;
  flex-shrink:0;
  position:relative;
}
.phone-body{
  background:#0d0d0d;
  border-radius:42px;
  padding:9px;
  position:relative;
  box-shadow:
    inset 0 0 0 1px rgba(255,255,255,.06),
    0 0 0 1px rgba(255,255,255,.18),
    0 0 0 2px #0d0d0d,
    0 40px 80px rgba(0,0,0,.85),
    0 8px 24px rgba(0,0,0,.5);
}
/* Botones físicos laterales */
.phone-body::before{
  content:'';position:absolute;
  right:-3.5px;top:27%;
  width:3.5px;height:13%;
  background:#1c1c1e;border-radius:0 2px 2px 0;
}
.phone-btn-l1{
  position:absolute;left:-3.5px;top:19%;
  width:3.5px;height:7%;
  background:#1c1c1e;border-radius:2px 0 0 2px;
  z-index:1;
}
.phone-btn-l2{
  position:absolute;left:-3.5px;top:29%;
  width:3.5px;height:13%;
  background:#1c1c1e;border-radius:2px 0 0 2px;
  z-index:1;
}

/* PANTALLA — ratio fijo, todo dentro */
.phone-screen{
  background:#000;
  border-radius:34px;
  overflow:hidden;
  /* Ratio iPhone 16 Pro: 393×852 ≈ 9:19.5 */
  aspect-ratio:9/19.5;
  display:flex;
  flex-direction:column;
  position:relative;
}

/* STATUS BAR — proporcional */
.phone-sb{
  display:flex;
  align-items:center;
  justify-content:space-between;
  padding:3.5% 6% 0;
  flex-shrink:0;
  background:#000;
  height:9%;
}
.phone-sb-time{
  font-family:var(--mono);
  font-size:clamp(9px,3.5%,13px);
  font-weight:600;color:#fff;
}
.phone-di{
  width:28%;height:55%;
  background:#000;
  border:1px solid rgba(255,255,255,.1);
  border-radius:20px;
  display:flex;align-items:center;justify-content:center;
}
.phone-di-dot{
  width:22%;height:50%;
  border-radius:50%;
  background:#1c1c1e;
}
.phone-sb-icons{display:flex;gap:4%;align-items:center}

/* HOME INDICATOR */
.phone-hi{
  height:4%;
  background:#000;
  display:flex;align-items:center;justify-content:center;
  flex-shrink:0;
}
.phone-hi-bar{
  width:32%;height:4px;
  background:rgba(255,255,255,.25);
  border-radius:4px;
}

/* APP dentro de la pantalla */
.phone-app{
  flex:1;
  min-height:0;
  display:flex;
  flex-direction:column;
  overflow:hidden;
  background:#000;
  position:relative;
}

/* ── TOPBAR proporcional ── */
.app-topbar{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:2%;
  padding:2% 4%;
  background:#0a0a0a;
  border-bottom:1px solid rgba(255,255,255,.07);
  flex-shrink:0;
}
.app-logo{
  font-family:var(--mono);
  font-size:clamp(9px,3.8%,15px);
  font-weight:500;color:#fff;
  flex-shrink:0;
  letter-spacing:-.01em;
}
.app-logo span{color:#6E62F5}

/* Tabs con pill blanco */
.app-tabs{
  display:flex;
  background:#1a1a1a;
  border-radius:20px;
  padding:2px;
  gap:1px;
  overflow:hidden;
  flex-shrink:0;
}
.app-tab{
  background:transparent;
  border:none;
  color:rgba(255,255,255,.45);
  font-size:clamp(8px,3.2%,12px);
  font-weight:500;
  padding:clamp(3px,1.2%,6px) clamp(6px,2.8%,12px);
  border-radius:16px;
  cursor:pointer;
  font-family:var(--sans);
  white-space:nowrap;
  transition:all .15s;
  line-height:1.2;
}
.app-tab.active{
  background:#fff;
  color:#000;
  font-weight:700;
}

/* Acciones topbar */
.app-actions{display:flex;gap:4%;align-items:center;flex-shrink:0}
.app-act{
  background:rgba(255,255,255,.07);
  border:none;
  border-radius:6px;
  padding:clamp(3px,1.1%,5px) clamp(5px,2%,9px);
  cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  position:relative;
  transition:background .15s;
}
.app-act:hover{background:rgba(255,255,255,.12)}
.app-act-dot{
  position:absolute;top:1px;right:1px;
  width:clamp(4px,1.8%,7px);height:clamp(4px,1.8%,7px);
  border-radius:50%;background:#6E62F5;
  border:1.5px solid #0a0a0a;
}
.app-av{
  width:clamp(20px,8%,28px);height:clamp(20px,8%,28px);
  border-radius:50%;
  background:linear-gradient(135deg,#6E62F5,#5A4FD4);
  display:flex;align-items:center;justify-content:center;
  font-size:clamp(8px,3.2%,11px);color:#fff;font-weight:700;
  flex-shrink:0;
  overflow:hidden;
  min-width:clamp(20px,8%,28px);
}

/* Contenido scrollable */
.app-content{
  flex:1;min-height:0;
  overflow-y:auto;overflow-x:hidden;
  -webkit-overflow-scrolling:touch;
}
.app-content::-webkit-scrollbar{width:1px}
.app-content::-webkit-scrollbar-thumb{background:rgba(255,255,255,.1)}
.app-page{
  padding:clamp(8px,3.5%,14px);
  display:none;
  flex-direction:column;
  gap:clamp(6px,2.5%,10px);
}
.app-page.active{display:flex}

/* Panel notificaciones */
.notif-panel{
  position:absolute;
  top:100%;right:0;left:0;
  background:#0f0f0f;
  border-bottom:1px solid rgba(255,255,255,.08);
  padding:clamp(10px,4%,16px);
  z-index:50;
  max-height:55%;
  overflow-y:auto;
  display:none;
}
.notif-item{
  display:flex;align-items:center;
  gap:clamp(6px,2.5%,10px);
  padding:clamp(5px,2%,8px) clamp(4px,1.5%,7px);
  border-radius:6px;
}
.notif-av{
  width:clamp(22px,9%,30px);height:clamp(22px,9%,30px);
  border-radius:50%;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  font-size:clamp(9px,3.6%,12px);color:#fff;font-weight:500;
}

/* BADGES */
.badge-rev{background:rgba(245,158,11,.1);color:#F59E0B;font-family:var(--mono);font-size:clamp(7px,2.8%,10px);padding:1px 5px;border-radius:8px;white-space:nowrap}
.badge-ok{background:rgba(29,158,117,.1);color:#1D9E75;font-family:var(--mono);font-size:clamp(7px,2.8%,10px);padding:1px 5px;border-radius:8px;white-space:nowrap}
.badge-mix{background:rgba(255,255,255,.05);color:rgba(255,255,255,.3);font-family:var(--mono);font-size:clamp(7px,2.8%,10px);padding:1px 5px;border-radius:8px;white-space:nowrap}
.badge-new{background:rgba(124,111,255,.12);color:#6E62F5;font-family:var(--mono);font-size:clamp(7px,2.8%,10px);padding:1px 5px;border-radius:8px;white-space:nowrap}
.badge-group{background:rgba(124,111,255,.8);color:#fff;font-family:var(--mono);font-size:clamp(6px,2.4%,9px);padding:1px 4px;border-radius:3px}

/* PROJ GRID — 2 columnas en móvil, 3 en web */
.proj-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(5px,2%,9px)}
#app-web .proj-grid{grid-template-columns:repeat(3,1fr)}
.proj-item{cursor:pointer}
.proj-thumb{width:100%;aspect-ratio:1;border-radius:clamp(5px,2%,8px);background:#1a1a1a;overflow:hidden;position:relative;transition:opacity .15s;box-shadow:0 4px 14px rgba(0,0,0,.35),inset 0 1px 0 rgba(255,255,255,.05)}
.proj-item:hover .proj-thumb{opacity:.75}
.proj-ttl{font-size:clamp(8px,3%,10px);font-weight:500;color:#fff;margin-top:clamp(2px,.8%,4px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.proj-sub{font-size:clamp(7px,2.6%,9px);color:rgba(255,255,255,.3);font-family:var(--mono);margin-top:1px}
.play-ov{position:absolute;bottom:4px;right:4px;width:clamp(12px,5%,18px);height:clamp(12px,5%,18px);border-radius:50%;background:rgba(0,0,0,.55);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.4)}

/* INLINE PROJECT */
.proj-inline{background:#111;border-radius:clamp(6px,2.5%,10px);padding:clamp(8px,3.2%,12px);display:none;flex-direction:column;gap:clamp(6px,2.5%,10px);margin-top:clamp(2px,.8%,4px);border:1px solid rgba(124,111,255,.2)}
.proj-inline.open{display:flex}

/* TRACK ROWS */
.tr{display:flex;align-items:center;gap:clamp(5px,2%,8px);padding:clamp(4px,1.6%,6px) 0;border-bottom:1px solid rgba(255,255,255,.04);cursor:pointer;transition:background .12s}
.tr:hover{background:rgba(255,255,255,.03);margin:0 -3px;padding:clamp(4px,1.6%,6px) 3px;border-radius:3px}
.tr:last-child{border-bottom:none}
.tr.playing .tr-n,.tr.playing .tr-name{color:#6E62F5}
.tr-n{font-family:var(--mono);font-size:clamp(7px,2.8%,10px);color:rgba(255,255,255,.25);width:clamp(10px,4%,14px);text-align:right;flex-shrink:0}
.tr-info{flex:1;min-width:0}
.tr-name{font-size:clamp(9px,3.4%,11px);font-weight:500;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr-date{font-size:clamp(7px,2.6%,9px);color:rgba(255,255,255,.25);font-family:var(--mono);margin-top:1px}
.sec-lbl{font-family:var(--mono);font-size:clamp(7px,2.6%,9px);letter-spacing:.07em;text-transform:uppercase;color:rgba(255,255,255,.25);margin-bottom:clamp(4px,1.6%,7px)}

/* WAVE BAR */
.wave-bar{display:none;background:#0d0d0d;border-radius:clamp(5px,2%,7px);padding:clamp(5px,2%,8px) clamp(6px,2.5%,10px);flex-direction:column;gap:clamp(4px,1.6%,6px)}
.wave-bar.open{display:flex}

/* INPUT */
.a-input{background:#0d0d0d;border:1px solid rgba(255,255,255,.07);border-radius:clamp(4px,1.6%,6px);color:#fff;font-size:clamp(9px,3.4%,12px);padding:clamp(5px,2%,8px) clamp(6px,2.5%,10px);font-family:var(--sans);outline:none;width:100%;transition:border-color .15s}
.a-input:focus{border-color:rgba(124,111,255,.4)}

/* CMT */
.cmt-item{display:flex;gap:clamp(4px,1.6%,6px);align-items:flex-start}
.cmt-ts{background:rgba(124,111,255,.12);color:#6E62F5;font-family:var(--mono);font-size:clamp(8px,3%,10px);padding:1px 5px;border-radius:3px;flex-shrink:0;cursor:pointer;margin-top:1px}
.cmt-text{font-size:clamp(9px,3.4%,11px);color:rgba(255,255,255,.55);line-height:1.4}

/* SPEED */
.spd{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:4px;color:rgba(255,255,255,.4);font-size:clamp(8px,3%,10px);font-family:var(--mono);padding:2px 5px;cursor:pointer;transition:all .15s}
.spd.active,.spd:hover{background:rgba(124,111,255,.15);border-color:rgba(124,111,255,.4);color:#6E62F5}

/* CARD */
.acard{background:#111;border:1px solid rgba(255,255,255,.06);border-radius:clamp(7px,2.8%,10px);padding:clamp(9px,3.5%,13px) clamp(10px,4%,14px)}
.acard.alert{border-color:rgba(245,158,11,.2)}
.back-btn{background:none;border:none;color:rgba(255,255,255,.35);cursor:pointer;font-size:clamp(9px,3.4%,11px);font-family:var(--sans);padding:0;display:flex;align-items:center;gap:3px;transition:color .15s}
.back-btn:hover{color:rgba(255,255,255,.7)}

/* ROLE SELECTOR (demo) */
.role-sel{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:24px}
.rs-btn{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px;color:rgba(255,255,255,.5);font-size:13px;font-weight:500;padding:8px 20px;cursor:pointer;font-family:var(--sans);transition:all .15s}
.rs-btn.active{background:rgba(124,111,255,.12);border-color:#6E62F5;color:#fff}

/* BROWSER SHELL */
.browser-shell{flex:1;min-width:320px;background:#191919;border-radius:12px;overflow:hidden;box-shadow:0 0 0 1px rgba(255,255,255,.08),0 24px 48px rgba(0,0,0,.5)}
.browser-bar{background:#191919;padding:10px 14px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(255,255,255,.06)}
.browser-url{flex:1;background:#111;border-radius:6px;padding:5px 10px;display:flex;align-items:center;gap:6px}

/* App dentro del browser — mismos estilos base pero font-size más grande */
#app-web .app-tab{font-size:12px;padding:5px 13px}
#app-web .app-logo{font-size:15px}
#app-web .app-av{width:28px;height:28px;font-size:11px}
#app-web .proj-ttl{font-size:10px}
#app-web .proj-sub{font-size:9px}
#app-web .tr-name{font-size:11px}
#app-web .sec-lbl{font-size:9px}
#app-web .badge-rev,#app-web .badge-ok,#app-web .badge-mix,#app-web .badge-new{font-size:10px}
#app-web .app-page{padding:14px;gap:10px}

@media(max-width:760px){
  .phone-shell{width:240px}
  .browser-shell{min-width:260px}
}
@media(max-width:560px){
  .mockup-wrap{gap:20px}
  .phone-shell{width:210px}
  .browser-shell{min-width:unset;width:100%}
}
</style>
</head>
<body>

<!-- NAV -->
<nav>
  <div class="nav-logo">demo<span>.</span></div>
  <div class="nav-right">
    <a href="#instalar" class="nav-hide">Instalar</a>
    <a href="#artista" class="nav-hide">Artistas</a>
    <a href="#productor" class="nav-hide">Productores</a>
    <a href="#waitlist" class="nav-cta">Gratis</a>
  </div>
</nav>

<!-- HERO -->
<section style="height:100svh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 20px 40px;text-align:center;overflow:hidden;position:relative">
  <span class="eyebrow">Tu música, antes de publicarla</span>
  <h1 class="hero-logo">demo<span>.</span></h1>
  <p class="hero-tag">El espacio donde vive tu música<br><strong>antes de existir para el mundo.</strong></p>
  <div style="width:100%;max-width:560px;margin:32px auto 0;overflow:hidden">
    <svg id="hero-svg" viewBox="0 0 640 72" fill="none" style="width:100%;height:auto;display:block"></svg>
  </div>
  <div style="position:absolute;bottom:28px;left:50%;transform:translateX(-50%);display:flex;flex-direction:column;align-items:center;gap:6px;animation:sh 2s ease-in-out infinite">
    <span style="font-family:var(--mono);font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:rgba(255,255,255,.2)">scroll</span>
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 6l4 4 4-4" stroke="rgba(255,255,255,.2)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>
</section>

<!-- INSTALAR -->
<section id="instalar" style="padding:90px 20px 100px">
  <div class="container" style="max-width:640px">
    <div class="reveal" style="position:relative;border-radius:24px;padding:56px 32px;text-align:center;background:radial-gradient(120% 140% at 50% 0%,rgba(110,98,245,.16),rgba(110,98,245,0) 60%),var(--dark);border:1px solid rgba(110,98,245,.25);overflow:hidden">
      <div style="font-size:34px;margin-bottom:16px">📲</div>
      <span class="eyebrow" style="display:block">Ya está disponible</span>
      <h2 class="sec-title" style="margin-bottom:14px">Tenla siempre a un toque.</h2>
      <p class="sec-sub" style="max-width:420px;margin:0 auto 32px">Se instala como cualquier app, directa desde tu navegador. Sin tiendas, sin esperas, sin ocupar de más.</p>
      <a href="https://demospain.app/instalar" class="btn btn-lg btn-purple" style="padding:17px 36px;font-size:17px;box-shadow:0 8px 24px rgba(110,98,245,.35)">Instalar app ahora →</a>
      <p style="font-family:var(--mono);font-size:11px;color:var(--gray-dim);margin-top:16px;letter-spacing:.04em">Gratis · 10 segundos · Sin tarjeta</p>
    </div>
  </div>
</section>

<!-- PLAN GRATUITO -->
<section style="background:var(--dark);padding:80px 20px">
  <div style="max-width:700px;margin:0 auto;text-align:center">
    <div class="reveal" style="display:inline-block;background:rgba(124,111,255,.1);border:1px solid rgba(124,111,255,.2);border-radius:20px;padding:5px 16px;font-family:var(--mono);font-size:11px;color:var(--purple);letter-spacing:.06em;text-transform:uppercase;margin-bottom:20px">Plan gratuito para siempre</div>
    <div class="reveal d1" style="font-family:var(--mono);font-size:clamp(72px,16vw,112px);font-weight:500;line-height:1;letter-spacing:-.04em;color:var(--white);margin-bottom:8px">0<span style="font-size:.26em;color:var(--gray-mid);vertical-align:baseline;font-weight:400"> EUR/mes</span></div>
    <p class="reveal d2" style="font-size:15px;color:var(--gray-mid);margin-bottom:28px">Sin tarjeta · Sin límite de tiempo · Sin letra pequeña</p>
    <div class="reveal d3" style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:32px">
      <div style="background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:7px 16px;font-size:13px;color:var(--gray-mid);display:flex;align-items:center;gap:7px"><span style="color:var(--purple);font-weight:600">✓</span>50 canciones</div>
      <div style="background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:7px 16px;font-size:13px;color:var(--gray-mid);display:flex;align-items:center;gap:7px"><span style="color:var(--purple);font-weight:600">✓</span>Proyectos ilimitados</div>
      <div style="background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:7px 16px;font-size:13px;color:var(--gray-mid);display:flex;align-items:center;gap:7px"><span style="color:var(--purple);font-weight:600">✓</span>Waveform player</div>
      <div style="background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:7px 16px;font-size:13px;color:var(--gray-mid);display:flex;align-items:center;gap:7px"><span style="color:var(--purple);font-weight:600">✓</span>Sin descargas al móvil</div>
      <div style="background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:7px 16px;font-size:13px;color:var(--gray-mid);display:flex;align-items:center;gap:7px"><span style="color:var(--purple);font-weight:600">✓</span>Notificaciones</div>
      <div style="background:var(--surface);border:1px solid rgba(255,255,255,.07);border-radius:24px;padding:7px 16px;font-size:13px;color:var(--gray-mid);display:flex;align-items:center;gap:7px"><span style="color:var(--purple);font-weight:600">✓</span>Proyectos grupales</div>
    </div>
    <div class="reveal d4" style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="#waitlist" class="btn btn-lg btn-purple">Crear mi cuenta gratis</a>
      <a href="#artista" class="btn btn-lg btn-ghost">Ver planes</a>
    </div>
  </div>
</section>

<!-- HOW -->
<section style="padding:96px 20px">
  <div class="container">
    <span class="eyebrow reveal" style="text-align:center;display:block">Cómo funciona</span>
    <h2 class="sec-title reveal d1" style="text-align:center">Tres pasos, sin complicaciones.</h2>
    <div class="steps">
      <div class="step reveal d2"><p class="step-num">01</p><div class="step-icon">⬆️</div><h3 class="step-title">Sube tu música</h3><p class="step-desc">WAV, MP3, FLAC o AIFF. Los archivos viven en la nube, no en tu móvil.</p></div>
      <div class="step reveal d3"><p class="step-num">02</p><div class="step-icon">💿</div><h3 class="step-title">Crea un proyecto</h3><p class="step-desc">Organiza con portada y tracklist. Previsualiza tu álbum antes de publicarlo.</p></div>
      <div class="step reveal d4"><p class="step-num">03</p><div class="step-icon">🔗</div><h3 class="step-title">Comparte con un link</h3><p class="step-desc">Privado, con link o público. El receptor escucha en el navegador, sin descargar nada.</p></div>
    </div>
  </div>
</section>

<!-- ARTISTA -->
<section style="padding:96px 20px" id="artista">
  <div class="container">
    <span class="eyebrow reveal" style="display:block">Para artistas independientes</span>
    <h2 class="sec-title reveal d1">Tu espacio antes de publicar.</h2>
    <p class="sec-sub reveal d2">Todo lo que necesitas para guardar, organizar y compartir tu música. Gratis.</p>
    <div class="feat-grid reveal d3" style="margin-top:40px">
      <div class="feat-card"><div class="feat-icon">📁</div><div class="feat-title">50 canciones gratis</div><div class="feat-desc">Sube hasta 50 canciones sin que ocupen espacio en tu móvil. Tus archivos viven en la nube.</div></div>
      <div class="feat-card"><div class="feat-icon">💿</div><div class="feat-title">Proyectos tipo álbum</div><div class="feat-desc">Crea proyectos con portada y tracklist. Previsualiza tu EP o álbum antes de subirlo a Spotify.</div><span class="feat-tag">diferencial</span></div>
      <div class="feat-card"><div class="feat-icon">🔔</div><div class="feat-title">Notificaciones de escuchas</div><div class="feat-desc">Sabes quién escuchó tu música, qué canción y cuándo. No hay que adivinar.</div><span class="feat-tag">diferencial</span></div>
      <div class="feat-card"><div class="feat-icon">👥</div><div class="feat-title">Proyectos grupales</div><div class="feat-desc">Varios artistas administran el mismo proyecto. Perfecto para grupos y colectivos.</div></div>
      <div class="feat-card"><div class="feat-icon">📂</div><div class="feat-title">Compartido conmigo</div><div class="feat-desc">Lo que otros te comparten aparece en tu página principal, organizado y con notificaciones.</div></div>
      <div class="feat-card"><div class="feat-icon">🔒</div><div class="feat-title">Control total del acceso</div><div class="feat-desc">Privado, solo con link o público. Cambia la visibilidad cuando quieras.</div></div>
      <div class="feat-card wide"><div class="feat-icon">💬</div><div class="feat-title">Comentarios en el segundo exacto</div><div class="feat-desc">Tu colaborador comenta exactamente en el 1:32. Sin "en el minuto uno y algo". Feedback preciso, directo al punto.</div></div>
    </div>
  </div>
</section>

<!-- PRODUCTOR -->
<section style="background:var(--dark);padding:96px 20px" id="productor">
  <div class="container" style="max-width:600px;text-align:center">
    <span class="eyebrow reveal" style="display:block">Para productores e ingenieros</span>
    <h2 class="sec-title reveal d1">El flujo con tus clientes, ordenado.</h2>
    <p class="sec-sub reveal d2" style="margin:12px auto 40px">Gestiona revisiones, versiones y aprobaciones sin perder el hilo. Tu cliente accede siempre gratis.</p>
    <div class="reveal d3" style="display:inline-flex;flex-direction:column;align-items:center;gap:12px;background:var(--black);border:1px solid rgba(110,98,245,.25);border-radius:var(--r-lg);padding:40px 32px;max-width:420px">
      <div style="font-size:32px">🎛️</div>
      <div style="font-family:var(--mono);font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--purple)">Próximamente</div>
      <p style="font-size:14px;color:var(--gray-mid);line-height:1.6">Estamos terminando esta parte. Si gestionas clientes como productor o ingeniero, apúntate y te avisamos en cuanto esté lista.</p>
      <a href="#waitlist" class="btn btn-lg btn-purple" style="margin-top:8px">Avísame</a>
    </div>
  </div>
</section>

<!-- WAITLIST -->
<section style="padding:96px 20px;text-align:center" id="waitlist">
  <h2 class="wl-title reveal">demo<span>.</span></h2>
  <p class="reveal d1" style="font-size:16px;color:var(--gray-mid);max-width:380px;margin:0 auto 40px;line-height:1.6">Estamos construyendo la plataforma. Sé de los primeros — gratis.</p>
  <form class="wl-form reveal d2" id="wlform" onsubmit="handleSubmit(event)">
    <input class="wl-input" id="wname" type="text" required placeholder="Tu nombre o artista" autocomplete="name"/>
    <input class="wl-input" id="wemail" type="email" required placeholder="tu@email.com" autocomplete="email"/>
    <div style="display:flex;flex-direction:column;gap:8px">
      <label style="font-family:var(--mono);font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:var(--gray-mid);text-align:left">¿Cómo usarás demo.?</label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button type="button" class="role-opt" onclick="selRole(this,'Artista independiente')"><span style="font-size:18px;display:block;margin-bottom:4px">🎤</span><span style="font-size:13px;font-weight:500;display:block">Artista</span><span style="font-size:11px;color:var(--gray-mid)">Subo y comparto mi música</span></button>
        <button type="button" class="role-opt" onclick="selRole(this,'Productor')"><span style="font-size:18px;display:block;margin-bottom:4px">🎛️</span><span style="font-size:13px;font-weight:500;display:block">Productor</span><span style="font-size:11px;color:var(--gray-mid)">Gestiono proyectos de clientes</span></button>
        <button type="button" class="role-opt" onclick="selRole(this,'Ingeniero de sonido')"><span style="font-size:18px;display:block;margin-bottom:4px">🎚️</span><span style="font-size:13px;font-weight:500;display:block">Ingeniero de sonido</span><span style="font-size:11px;color:var(--gray-mid)">Mezcla, máster y entrega</span></button>
        <button type="button" class="role-opt" onclick="selRole(this,'Estudio')"><span style="font-size:18px;display:block;margin-bottom:4px">🏢</span><span style="font-size:13px;font-weight:500;display:block">Estudio</span><span style="font-size:11px;color:var(--gray-mid)">Gestiono varios artistas</span></button>
      </div>
      <button type="button" class="role-opt" onclick="selRole(this,'Oyente')" style="display:flex;align-items:center;justify-content:center;gap:12px;text-align:left">
        <span style="font-size:20px;flex-shrink:0">🎧</span>
        <div><div style="font-size:13px;font-weight:500">Oyente de compartidos</div><div style="font-size:11px;color:var(--gray-mid)">Me comparten música, no subo</div></div>
      </button>
      <input type="hidden" id="wrole" value=""/>
      <p id="role-err" style="font-family:var(--mono);font-size:11px;color:#EF4444;display:none;text-align:left">Selecciona cómo usarás demo. antes de continuar</p>
    </div>
    <button type="submit" id="wbtn" class="btn btn-lg btn-purple btn-full">Apuntarme gratis</button>
    <input type="text" name="website" id="hp" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;width:1px;height:1px;opacity:0;" aria-hidden="true"/>
  </form>
  <div class="wl-msg" id="wmsg"></div>
  <p class="reveal" style="font-family:var(--mono);font-size:11px;color:var(--gray-dim);margin-top:12px">Sin spam · Te avisamos cuando esté lista · <a href="#privacidad" style="color:var(--gray-mid);text-decoration:underline;text-underline-offset:3px">Política de privacidad</a></p>
</section>

<!-- PRIVACIDAD -->
<section style="padding:64px 20px;background:var(--dark)" id="privacidad">
  <div class="container" style="max-width:680px">
    <span class="eyebrow reveal" style="display:block">Protección de datos</span>
    <h2 class="sec-title reveal d1" style="font-size:clamp(22px,4vw,30px);margin-bottom:24px">Tu información, protegida.</h2>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="background:var(--black);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">¿Qué datos recogemos?</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Tu nombre, email y rol cuando te apuntas a la lista de espera.</p></div>
      <div style="background:var(--black);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">¿Para qué los usamos?</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Exclusivamente para avisarte del lanzamiento y comunicaciones relacionadas con demo. Nunca cederemos tus datos a terceros.</p></div>
      <div style="background:var(--black);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">Tus derechos (RGPD)</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Acceso, rectificación, supresión y oposición. Canal: <span style="color:var(--purple);font-family:var(--mono)">hola@demo.fm</span>. Plazo: 30 días.</p></div>
      <div style="background:var(--black);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">Base legal</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Consentimiento expreso al rellenar el formulario. Conforme al RGPD y LOPDGDD.</p></div>
    </div>
    <p style="font-size:11px;color:var(--gray-dim);margin-top:20px;font-family:var(--mono)">Última actualización: junio 2026 · demo. — Madrid, España</p>
  </div>
</section>

<!-- TÉRMINOS -->
<section style="padding:64px 20px;background:var(--black)" id="terminos">
  <div class="container" style="max-width:680px">
    <span class="eyebrow reveal" style="display:block">Condiciones</span>
    <h2 class="sec-title reveal d1" style="font-size:clamp(22px,4vw,30px);margin-bottom:24px">Términos de uso.</h2>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="background:var(--dark);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">¿Qué es demo.?</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Una plataforma para subir, organizar y compartir tu música antes de publicarla. El servicio está en fase beta y puede cambiar mientras lo seguimos construyendo.</p></div>
      <div style="background:var(--dark);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">Tu contenido sigue siendo tuyo</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">No reclamamos ningún derecho sobre la música que subes. Nosotros solo la almacenamos y la mostramos a quien tú decidas compartirla.</p></div>
      <div style="background:var(--dark);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">Uso aceptable</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">No subas contenido que no sea tuyo o sobre el que no tengas derechos. Nos reservamos el derecho de retirar contenido que incumpla esto.</p></div>
      <div style="background:var(--dark);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">Disponibilidad</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Al estar en beta, el servicio puede sufrir cambios, interrupciones o ajustes de funcionalidad sin previo aviso.</p></div>
    </div>
    <p style="font-size:11px;color:var(--gray-dim);margin-top:20px;font-family:var(--mono)">Dudas: <span style="color:var(--purple)">hola@demo.fm</span> · Última actualización: junio 2026</p>
  </div>
</section>

<!-- COOKIES -->
<section style="padding:64px 20px;background:var(--dark)" id="cookies">
  <div class="container" style="max-width:680px">
    <span class="eyebrow reveal" style="display:block">Cookies</span>
    <h2 class="sec-title reveal d1" style="font-size:clamp(22px,4vw,30px);margin-bottom:24px">Política de cookies.</h2>
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="background:var(--black);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">¿Qué usamos?</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Solo lo estrictamente necesario para que la sesión funcione al iniciar sesión. Nada de cookies publicitarias ni de rastreo de terceros.</p></div>
      <div style="background:var(--black);border:1px solid rgba(255,255,255,.07);border-radius:var(--r-md);padding:18px 22px"><p style="font-size:13px;font-weight:500;margin-bottom:5px">¿Puedes desactivarlas?</p><p style="font-size:13px;color:var(--gray-mid);line-height:1.65">Si las bloqueas desde tu navegador, no podrás iniciar sesión ni usar la app correctamente.</p></div>
    </div>
    <p style="font-size:11px;color:var(--gray-dim);margin-top:20px;font-family:var(--mono)">Última actualización: junio 2026</p>
  </div>
</section>

<footer style="border-top:1px solid rgba(255,255,255,.06);padding:28px 20px;display:flex;flex-wrap:wrap;gap:12px 20px;align-items:center;justify-content:space-between">
  <div class="nav-logo">demo<span>.</span></div>
  <span style="font-size:12px;color:var(--gray-dim)">DROKO & YEB · Madrid, 2026</span>
  <div style="display:flex;gap:16px;flex-wrap:wrap">
    <a href="#privacidad" style="font-size:12px;color:var(--gray-dim);text-decoration:underline;text-underline-offset:3px">Privacidad</a>
    <a href="#terminos" style="font-size:12px;color:var(--gray-dim);text-decoration:underline;text-underline-offset:3px">Términos de uso</a>
    <a href="#cookies" style="font-size:12px;color:var(--gray-dim);text-decoration:underline;text-underline-offset:3px">Cookies</a>
  </div>
</footer>


<script>
// ═══ WAITLIST ════════════════════════════════════════════════
function selRole(btn,role){
  document.querySelectorAll('.role-opt').forEach(b=>b.classList.remove('selected'));
  btn.classList.add('selected');
  document.getElementById('wrole').value=role;
  const err=document.getElementById('role-err');if(err)err.style.display='none';
}
// ── SUPABASE CONFIG ──────────────────────────────────────────
const SUPABASE_URL  = 'https://lgujsninpjeefmrykudu.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxndWpzbmlucGplZWZtcnlrdWR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExNjM2ODcsImV4cCI6MjA5NjczOTY4N30.eF_4jn12aDANf9dBhcZGvl88B9ijp86hp3DSt1x2QmI';

let submitCount=0;
const formLoadTime=Date.now();

async function handleSubmit(e){
  e.preventDefault();
  const msg=document.getElementById('wmsg'),btn=document.getElementById('wbtn');
  if(document.getElementById('hp').value)return;
  if(submitCount>=2){msg.textContent='Ya estás en la lista.';msg.className='wl-msg ok';return;}
  if(Date.now()-formLoadTime<2000){msg.textContent='Demasiado rápido. Inténtalo de nuevo.';msg.className='wl-msg err';return;}
  const nombre=document.getElementById('wname').value.trim();
  const email=document.getElementById('wemail').value.trim();
  const rol=document.getElementById('wrole').value;
  if(!rol){const err=document.getElementById('role-err');if(err){err.style.display='block';err.scrollIntoView({behavior:'smooth',block:'nearest'});}return;}
  if(!nombre||!email)return;
  btn.textContent='Enviando…';btn.disabled=true;
  try{
    const res = await fetch(\`\${SUPABASE_URL}/rest/v1/waitlist\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON,
        'Authorization': \`Bearer \${SUPABASE_ANON}\`,
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({ name: nombre, email: email, role: rol, source: 'landing' })
    });
    if(res.status === 409){
      // Email duplicado — ya está en la lista
      msg.textContent='¡Ya estás en la lista, '+nombre+'! Te avisamos cuando demo. esté lista.';
      msg.className='wl-msg ok';btn.textContent='✓ Ya apuntado';btn.style.background='var(--green)';
      return;
    }
    if(!res.ok) throw new Error('Error '+res.status);
    submitCount++;
    msg.textContent='¡Apuntado, '+nombre+'! Te avisamos cuando demo. esté lista.';
    msg.className='wl-msg ok';btn.textContent='✓ Apuntado';btn.style.background='var(--green)';
    document.getElementById('wname').value='';document.getElementById('wemail').value='';
  }catch{
    msg.textContent='Algo salió mal. Inténtalo de nuevo.';msg.className='wl-msg err';
    btn.textContent='Apuntarme gratis';btn.disabled=false;
  }
}

// ═══ WAVEFORM HERO ═══════════════════════════════════════════
(function(){
  const svg=document.getElementById('hero-svg');if(!svg)return;
  const H=[36,54,28,60,44,68,36,56,40,64,32,48,72,40,56,24,60,44,68,36,52,28,64,40,56,32,68,48,60,36,52,72,40,56,28,60,44,64,36,48];
  svg.setAttribute('viewBox',\`0 0 \${H.length*16} 72\`);
  const bars=H.map((h,i)=>{const r=document.createElementNS('http://www.w3.org/2000/svg','rect');r.setAttribute('x',i*16);r.setAttribute('width','8');r.setAttribute('rx','4');r.setAttribute('fill','#6E62F5');svg.appendChild(r);return r;});
  const ph=H.map((_,i)=>i*0.38),sp=H.map((_,i)=>0.8+(i%7)*0.12),mn=H.map(h=>h*0.18);
  let t=0;
  function tick(){
    t+=0.016;
    bars.forEach((r,i)=>{const w=Math.sin(t*sp[i]+ph[i])*0.45+Math.sin(t*sp[i]*1.7+ph[i]*0.5)*0.2;const h=Math.max(mn[i],H[i]*(0.35+0.65*(0.5+w*0.5)));r.setAttribute('height',h.toFixed(1));r.setAttribute('y',((72-h)/2).toFixed(1));r.setAttribute('opacity',(0.5+Math.abs(w)*0.5).toFixed(2));});
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();

// ═══ SCROLL REVEAL ═══════════════════════════════════════════
(function(){
  if(!('IntersectionObserver' in window)){document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el=>el.classList.add('visible'));return;}
  const io=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');io.unobserve(e.target);}});},{threshold:0.12});
  document.querySelectorAll('.reveal,.reveal-l,.reveal-r').forEach(el=>io.observe(el));
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
