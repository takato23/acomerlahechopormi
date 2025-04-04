import{r as s,j as e}from"./framer-motion-DexFYn3r.js";import{u as na,g as la,a as H}from"./userService-CZh88SKG.js";import{C as T,a as G,c as U,b as O,e as Y}from"./card-CGU5HWmE.js";import{L as R}from"./label-Ctjrl553.js";import{S as ia,a as oa,b as ca,c as da,d as ua}from"./select-DBfGXf_6.js";import{c as W,B as M,S as K,e as re,P as z,f as he,g as ge,h as q,U as ma,i as fa,j as L,k as oe,l as ve,m as pa,X as xa,n as je,u as ha}from"./index-o6bm3qdW.js";import{I as V}from"./input-DTFkI6V9.js";import{c as ga,u as ye}from"./index-zM9kQwqA.js";import{u as va,a as ja}from"./index-B3hHUwxe.js";import{C as ya}from"./clock-BTl63eEv.js";import{T as ba}from"./textarea-fVM2PcUd.js";import{B as Na}from"./badge-BYsIcOJf.js";import{C as fe}from"./checkbox-CElA_Qfn.js";import{A as Z,a as ee,b as ae}from"./alert-BZO_YP9D.js";import{T as se}from"./terminal-RUzjgFnx.js";import{T as Sa}from"./trash-2-CpjvPaTx.js";import"./index-BMd2TyCU.js";import"./chevron-down-D8MEcRXF.js";import"./check-BwO51OGf.js";import"./chevron-up-DGjrEF3Z.js";/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const wa=W("Circle",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ia=W("EyeOff",[["path",{d:"M9.88 9.88a3 3 0 1 0 4.24 4.24",key:"1jxqfv"}],["path",{d:"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68",key:"9wicm4"}],["path",{d:"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61",key:"1jreej"}],["line",{x1:"2",x2:"22",y1:"2",y2:"22",key:"a6p6uj"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ca=W("Eye",[["path",{d:"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z",key:"rwhkz3"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const pe=W("Save",[["path",{d:"M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z",key:"1owoqh"}],["polyline",{points:"17 21 17 13 7 13 7 21",key:"1md35c"}],["polyline",{points:"7 3 7 8 15 8",key:"8nz8an"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Ea=W("ShieldAlert",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Aa=W("UploadCloud",[["path",{d:"M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242",key:"1pljnt"}],["path",{d:"M12 12v9",key:"192myk"}],["path",{d:"m16 16-4-4-4 4",key:"119tzi"}]]),Ra=[{value:"none",label:"Sin especificar"},{value:"omnivore",label:"Omnívoro"},{value:"vegetarian",label:"Vegetariano"},{value:"vegan",label:"Vegano"}];function Pa({currentPreference:a,onUpdatePreference:r}){const[t,l]=s.useState(a||"none"),[i,o]=s.useState(!1),[n,u]=s.useState(null),[p,d]=s.useState(!1),j=c=>{l(c),u(null),d(!1)},x=async()=>{o(!0),u(null),d(!1);const f=await r(t==="none"?null:t);o(!1),f?(d(!0),setTimeout(()=>d(!1),3e3)):u("No se pudo guardar la preferencia.")},g=t!==(a||"none");return e.jsxs(T,{children:[e.jsx(G,{children:e.jsx(U,{children:"Preferencias Alimenticias"})}),e.jsx(O,{children:e.jsxs("div",{className:"space-y-2",children:[e.jsx(R,{htmlFor:"dietary-preference",children:"Tu dieta"}),e.jsxs(ia,{value:t,onValueChange:j,disabled:i,children:[e.jsx(oa,{id:"dietary-preference",children:e.jsx(ca,{placeholder:"Selecciona tu preferencia"})}),e.jsx(da,{children:Ra.map(c=>e.jsx(ua,{value:c.value,children:c.label},c.value))})]})]})}),e.jsxs(Y,{className:"flex justify-between items-center",children:[e.jsxs("div",{children:[n&&e.jsx("p",{className:"text-sm text-destructive",children:n}),p&&e.jsx("p",{className:"text-sm text-green-600",children:"Preferencia guardada."})]}),e.jsxs(M,{onClick:x,disabled:!g||i,children:[i?e.jsx(K,{size:"sm",className:"mr-2"}):null,"Guardar Cambios"]})]})]})}var ce="Avatar",[ka,Rs]=re(ce),[_a,be]=ka(ce),Ne=s.forwardRef((a,r)=>{const{__scopeAvatar:t,...l}=a,[i,o]=s.useState("idle");return e.jsx(_a,{scope:t,imageLoadingStatus:i,onImageLoadingStatusChange:o,children:e.jsx(z.span,{...l,ref:r})})});Ne.displayName=ce;var Se="AvatarImage",we=s.forwardRef((a,r)=>{const{__scopeAvatar:t,src:l,onLoadingStatusChange:i=()=>{},...o}=a,n=be(Se,t),u=Fa(l,o.referrerPolicy),p=he(d=>{i(d),n.onImageLoadingStatusChange(d)});return ge(()=>{u!=="idle"&&p(u)},[u,p]),u==="loaded"?e.jsx(z.img,{...o,ref:r,src:l}):null});we.displayName=Se;var Ie="AvatarFallback",Ce=s.forwardRef((a,r)=>{const{__scopeAvatar:t,delayMs:l,...i}=a,o=be(Ie,t),[n,u]=s.useState(l===void 0);return s.useEffect(()=>{if(l!==void 0){const p=window.setTimeout(()=>u(!0),l);return()=>window.clearTimeout(p)}},[l]),n&&o.imageLoadingStatus!=="loaded"?e.jsx(z.span,{...i,ref:r}):null});Ce.displayName=Ie;function Fa(a,r){const[t,l]=s.useState("idle");return ge(()=>{if(!a){l("error");return}let i=!0;const o=new window.Image,n=u=>()=>{i&&l(u)};return l("loading"),o.onload=n("loaded"),o.onerror=n("error"),o.src=a,r&&(o.referrerPolicy=r),()=>{i=!1}},[a,r]),t}var Ee=Ne,Ae=we,Re=Ce;const Pe=s.forwardRef(({className:a,...r},t)=>e.jsx(Ee,{ref:t,className:q("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",a),...r}));Pe.displayName=Ee.displayName;const ke=s.forwardRef(({className:a,...r},t)=>e.jsx(Ae,{ref:t,className:q("aspect-square h-full w-full",a),...r}));ke.displayName=Ae.displayName;const _e=s.forwardRef(({className:a,...r},t)=>e.jsx(Re,{ref:t,className:q("flex h-full w-full items-center justify-center rounded-full bg-muted",a),...r}));_e.displayName=Re.displayName;function Ta({currentAvatarUrl:a,onAvatarUploaded:r,userId:t}){const[l,i]=s.useState(!1),[o,n]=s.useState(null),u=s.useRef(null),p=x=>x?x.substring(0,2).toUpperCase():"U",d=async x=>{var h;const g=(h=x.target.files)==null?void 0:h[0];if(!g)return;if(!["image/jpeg","image/png","image/webp"].includes(g.type)){n("Tipo de archivo no permitido. Usa JPG, PNG o WEBP.");return}const f=5*1024*1024;if(g.size>f){n("El archivo es demasiado grande (máx 5MB).");return}i(!0),n(null);try{const v=await na(g);v?r(v):n("Error al subir el avatar.")}catch(v){console.error("Error uploading avatar:",v),n("Ocurrió un error inesperado.")}finally{i(!1),u.current&&(u.current.value="")}},j=()=>{var x;(x=u.current)==null||x.click()};return e.jsxs("div",{className:"flex flex-col items-center space-y-4",children:[e.jsxs(Pe,{className:"h-24 w-24 ring-2 ring-offset-2 ring-primary/20 ring-offset-background",children:[e.jsx(ke,{src:a??void 0,alt:"Avatar de usuario"}),e.jsx(_e,{className:"bg-muted text-muted-foreground",children:t?p(t):e.jsx(ma,{className:"h-10 w-10"})})]}),e.jsx(V,{ref:u,type:"file",accept:"image/png, image/jpeg, image/webp",onChange:d,className:"hidden",disabled:l}),e.jsx(M,{variant:"outline",size:"sm",onClick:j,disabled:l,children:l?e.jsxs(e.Fragment,{children:[e.jsx(K,{size:"sm",className:"mr-2"})," Subiendo..."]}):e.jsxs(e.Fragment,{children:[e.jsx(Aa,{className:"mr-2 h-4 w-4"})," Cambiar Avatar"]})}),o&&e.jsx("p",{className:"text-sm text-destructive",children:o}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"JPG, PNG, WEBP (Máx 5MB)"})]})}var ne="rovingFocusGroup.onEntryFocus",Ga={bubbles:!1,cancelable:!0},te="RovingFocusGroup",[le,Fe,Ua]=ga(te),[Oa,Te]=re(te,[Ua]),[Ma,Ka]=Oa(te),Ge=s.forwardRef((a,r)=>e.jsx(le.Provider,{scope:a.__scopeRovingFocusGroup,children:e.jsx(le.Slot,{scope:a.__scopeRovingFocusGroup,children:e.jsx(La,{...a,ref:r})})}));Ge.displayName=te;var La=s.forwardRef((a,r)=>{const{__scopeRovingFocusGroup:t,orientation:l,loop:i=!1,dir:o,currentTabStopId:n,defaultCurrentTabStopId:u,onCurrentTabStopIdChange:p,onEntryFocus:d,preventScrollOnEntryFocus:j=!1,...x}=a,g=s.useRef(null),c=oe(r,g),f=ye(o),[h=null,v]=ve({prop:n,defaultProp:u,onChange:p}),[y,N]=s.useState(!1),b=he(d),I=Fe(t),w=s.useRef(!1),[C,k]=s.useState(0);return s.useEffect(()=>{const S=g.current;if(S)return S.addEventListener(ne,b),()=>S.removeEventListener(ne,b)},[b]),e.jsx(Ma,{scope:t,orientation:l,dir:f,loop:i,currentTabStopId:h,onItemFocus:s.useCallback(S=>v(S),[v]),onItemShiftTab:s.useCallback(()=>N(!0),[]),onFocusableItemAdd:s.useCallback(()=>k(S=>S+1),[]),onFocusableItemRemove:s.useCallback(()=>k(S=>S-1),[]),children:e.jsx(z.div,{tabIndex:y||C===0?-1:0,"data-orientation":l,...x,ref:c,style:{outline:"none",...a.style},onMouseDown:L(a.onMouseDown,()=>{w.current=!0}),onFocus:L(a.onFocus,S=>{const J=!w.current;if(S.target===S.currentTarget&&J&&!y){const E=new CustomEvent(ne,Ga);if(S.currentTarget.dispatchEvent(E),!E.defaultPrevented){const B=I().filter(F=>F.focusable),_=B.find(F=>F.active),Q=B.find(F=>F.id===h),$=[_,Q,...B].filter(Boolean).map(F=>F.ref.current);Me($,j)}}w.current=!1}),onBlur:L(a.onBlur,()=>N(!1))})})}),Ue="RovingFocusGroupItem",Oe=s.forwardRef((a,r)=>{const{__scopeRovingFocusGroup:t,focusable:l=!0,active:i=!1,tabStopId:o,...n}=a,u=fa(),p=o||u,d=Ka(Ue,t),j=d.currentTabStopId===p,x=Fe(t),{onFocusableItemAdd:g,onFocusableItemRemove:c}=d;return s.useEffect(()=>{if(l)return g(),()=>c()},[l,g,c]),e.jsx(le.ItemSlot,{scope:t,id:p,focusable:l,active:i,children:e.jsx(z.span,{tabIndex:j?0:-1,"data-orientation":d.orientation,...n,ref:r,onMouseDown:L(a.onMouseDown,f=>{l?d.onItemFocus(p):f.preventDefault()}),onFocus:L(a.onFocus,()=>d.onItemFocus(p)),onKeyDown:L(a.onKeyDown,f=>{if(f.key==="Tab"&&f.shiftKey){d.onItemShiftTab();return}if(f.target!==f.currentTarget)return;const h=Da(f,d.orientation,d.dir);if(h!==void 0){if(f.metaKey||f.ctrlKey||f.altKey||f.shiftKey)return;f.preventDefault();let y=x().filter(N=>N.focusable).map(N=>N.ref.current);if(h==="last")y.reverse();else if(h==="prev"||h==="next"){h==="prev"&&y.reverse();const N=y.indexOf(f.currentTarget);y=d.loop?Va(y,N+1):y.slice(N+1)}setTimeout(()=>Me(y))}})})})});Oe.displayName=Ue;var qa={ArrowLeft:"prev",ArrowUp:"prev",ArrowRight:"next",ArrowDown:"next",PageUp:"first",Home:"first",PageDown:"last",End:"last"};function za(a,r){return r!=="rtl"?a:a==="ArrowLeft"?"ArrowRight":a==="ArrowRight"?"ArrowLeft":a}function Da(a,r,t){const l=za(a.key,t);if(!(r==="vertical"&&["ArrowLeft","ArrowRight"].includes(l))&&!(r==="horizontal"&&["ArrowUp","ArrowDown"].includes(l)))return qa[l]}function Me(a,r=!1){const t=document.activeElement;for(const l of a)if(l===t||(l.focus({preventScroll:r}),document.activeElement!==t))return}function Va(a,r){return a.map((t,l)=>a[(r+l)%a.length])}var Ba=Ge,$a=Oe,de="Radio",[Ha,Ke]=re(de),[Ya,Wa]=Ha(de),Le=s.forwardRef((a,r)=>{const{__scopeRadio:t,name:l,checked:i=!1,required:o,disabled:n,value:u="on",onCheck:p,form:d,...j}=a,[x,g]=s.useState(null),c=oe(r,v=>g(v)),f=s.useRef(!1),h=x?d||!!x.closest("form"):!0;return e.jsxs(Ya,{scope:t,checked:i,disabled:n,children:[e.jsx(z.button,{type:"button",role:"radio","aria-checked":i,"data-state":De(i),"data-disabled":n?"":void 0,disabled:n,value:u,...j,ref:c,onClick:L(a.onClick,v=>{i||p==null||p(),h&&(f.current=v.isPropagationStopped(),f.current||v.stopPropagation())})}),h&&e.jsx(Ja,{control:x,bubbles:!f.current,name:l,value:u,checked:i,required:o,disabled:n,form:d,style:{transform:"translateX(-100%)"}})]})});Le.displayName=de;var qe="RadioIndicator",ze=s.forwardRef((a,r)=>{const{__scopeRadio:t,forceMount:l,...i}=a,o=Wa(qe,t);return e.jsx(pa,{present:l||o.checked,children:e.jsx(z.span,{"data-state":De(o.checked),"data-disabled":o.disabled?"":void 0,...i,ref:r})})});ze.displayName=qe;var Ja=a=>{const{control:r,checked:t,bubbles:l=!0,...i}=a,o=s.useRef(null),n=va(t),u=ja(r);return s.useEffect(()=>{const p=o.current,d=window.HTMLInputElement.prototype,x=Object.getOwnPropertyDescriptor(d,"checked").set;if(n!==t&&x){const g=new Event("click",{bubbles:l});x.call(p,t),p.dispatchEvent(g)}},[n,t,l]),e.jsx("input",{type:"radio","aria-hidden":!0,defaultChecked:t,...i,tabIndex:-1,ref:o,style:{...a.style,...u,position:"absolute",pointerEvents:"none",opacity:0,margin:0}})};function De(a){return a?"checked":"unchecked"}var Qa=["ArrowUp","ArrowDown","ArrowLeft","ArrowRight"],ue="RadioGroup",[Xa,Ps]=re(ue,[Te,Ke]),Ve=Te(),Be=Ke(),[Za,es]=Xa(ue),$e=s.forwardRef((a,r)=>{const{__scopeRadioGroup:t,name:l,defaultValue:i,value:o,required:n=!1,disabled:u=!1,orientation:p,dir:d,loop:j=!0,onValueChange:x,...g}=a,c=Ve(t),f=ye(d),[h,v]=ve({prop:o,defaultProp:i,onChange:x});return e.jsx(Za,{scope:t,name:l,required:n,disabled:u,value:h,onValueChange:v,children:e.jsx(Ba,{asChild:!0,...c,orientation:p,dir:f,loop:j,children:e.jsx(z.div,{role:"radiogroup","aria-required":n,"aria-orientation":p,"data-disabled":u?"":void 0,dir:f,...g,ref:r})})})});$e.displayName=ue;var He="RadioGroupItem",Ye=s.forwardRef((a,r)=>{const{__scopeRadioGroup:t,disabled:l,...i}=a,o=es(He,t),n=o.disabled||l,u=Ve(t),p=Be(t),d=s.useRef(null),j=oe(r,d),x=o.value===i.value,g=s.useRef(!1);return s.useEffect(()=>{const c=h=>{Qa.includes(h.key)&&(g.current=!0)},f=()=>g.current=!1;return document.addEventListener("keydown",c),document.addEventListener("keyup",f),()=>{document.removeEventListener("keydown",c),document.removeEventListener("keyup",f)}},[]),e.jsx($a,{asChild:!0,...u,focusable:!n,active:x,children:e.jsx(Le,{disabled:n,required:o.required,checked:x,...p,...i,name:o.name,ref:j,onCheck:()=>o.onValueChange(i.value),onKeyDown:L(c=>{c.key==="Enter"&&c.preventDefault()}),onFocus:L(i.onFocus,()=>{var c;g.current&&((c=d.current)==null||c.click())})})})});Ye.displayName=He;var as="RadioGroupIndicator",We=s.forwardRef((a,r)=>{const{__scopeRadioGroup:t,...l}=a,i=Be(t);return e.jsx(ze,{...i,...l,ref:r})});We.displayName=as;var Je=$e,Qe=Ye,ss=We;const Xe=s.forwardRef(({className:a,...r},t)=>e.jsx(Je,{className:q("grid gap-2",a),...r,ref:t}));Xe.displayName=Je.displayName;const ie=s.forwardRef(({className:a,...r},t)=>e.jsx(Qe,{ref:t,className:q("aspect-square h-4 w-4 rounded-full border border-primary text-primary shadow focus:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",a),...r,children:e.jsx(ss,{className:"flex items-center justify-center",children:e.jsx(wa,{className:"h-3.5 w-3.5 fill-primary"})})}));ie.displayName=Qe.displayName;const rs=[{value:"easy",label:"Fácil",description:"Recetas rápidas y sencillas."},{value:"medium",label:"Medio",description:"Recetas con algunos pasos más."},{value:"hard",label:"Difícil",description:"Recetas elaboradas o técnicas."}];function ts({currentPreference:a,onUpdatePreference:r}){const[t,l]=s.useState(a||"none"),[i,o]=s.useState(!1),[n,u]=s.useState(null),[p,d]=s.useState(!1),j=c=>{l(c),u(null),d(!1)},x=async()=>{o(!0),u(null),d(!1);const f=await r(t==="none"?null:t);o(!1),f?(d(!0),setTimeout(()=>d(!1),3e3)):u("No se pudo guardar la preferencia.")},g=t!==(a||"none");return e.jsxs(T,{children:[e.jsx(G,{children:e.jsx(U,{children:"Preferencia de Dificultad"})}),e.jsx(O,{children:e.jsxs(Xe,{value:t,onValueChange:j,disabled:i,className:"space-y-3",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(ie,{value:"none",id:"difficulty-none"}),e.jsx(R,{htmlFor:"difficulty-none",className:"font-normal text-muted-foreground",children:"Sin especificar"})]}),rs.map(c=>e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(ie,{value:c.value,id:`difficulty-${c.value}`}),e.jsxs(R,{htmlFor:`difficulty-${c.value}`,className:"font-normal",children:[c.label,e.jsx("p",{className:"text-xs text-muted-foreground",children:c.description})]})]},c.value))]})}),e.jsxs(Y,{className:"flex justify-between items-center",children:[e.jsxs("div",{children:[n&&e.jsx("p",{className:"text-sm text-destructive",children:n}),p&&e.jsx("p",{className:"text-sm text-green-600",children:"Preferencia guardada."})]}),e.jsxs(M,{onClick:x,disabled:!g||i,children:[i?e.jsx(K,{size:"sm",className:"mr-2"}):null,"Guardar Cambios"]})]})]})}function ns({currentTime:a,onUpdateTime:r}){const[t,l]=s.useState((a==null?void 0:a.toString())||""),[i,o]=s.useState(!1),[n,u]=s.useState(null),[p,d]=s.useState(!1);s.useEffect(()=>{l((a==null?void 0:a.toString())||"")},[a]);const j=c=>{l(c.target.value),u(null),d(!1)},x=async()=>{o(!0),u(null),d(!1);const c=t.trim()===""?null:parseInt(t,10);if(t.trim()!==""&&(isNaN(c)||c<=0)){u("Ingresa un número de minutos válido (mayor a 0)."),o(!1);return}const f=await r(c);o(!1),f?(d(!0),setTimeout(()=>d(!1),3e3)):u("No se pudo guardar la preferencia de tiempo.")},g=t!==((a==null?void 0:a.toString())||"");return e.jsxs(T,{children:[e.jsx(G,{children:e.jsxs(U,{className:"flex items-center gap-2",children:[e.jsx(ya,{className:"h-5 w-5 text-muted-foreground"}),"Tiempo Máximo de Preparación"]})}),e.jsx(O,{children:e.jsxs("div",{className:"space-y-1",children:[e.jsx(R,{htmlFor:"max-prep-time",children:"Tiempo máximo (en minutos)"}),e.jsx(V,{id:"max-prep-time",type:"number",value:t,onChange:j,placeholder:"Ej: 30 (dejar vacío si no hay límite)",min:"1",disabled:i}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Opcional. Ayuda a filtrar recetas que se ajusten a tu tiempo disponible."})]})}),e.jsxs(Y,{className:"flex justify-between items-center",children:[e.jsxs("div",{children:[n&&e.jsx("p",{className:"text-sm text-destructive",children:n}),p&&e.jsx("p",{className:"text-sm text-green-600",children:"Preferencia guardada."})]}),e.jsxs(M,{onClick:x,disabled:!g||i,children:[i?e.jsx(K,{size:"sm",className:"mr-2"}):null,"Guardar Tiempo"]})]})]})}function ls({currentValue:a,onUpdateValue:r}){const[t,l]=s.useState(a||""),[i,o]=s.useState(!1),[n,u]=s.useState(null),[p,d]=s.useState(!1);s.useEffect(()=>{l(a||"")},[a]);const j=c=>{l(c.target.value),u(null),d(!1)},x=async()=>{o(!0),u(null),d(!1);const c=t.trim()===""?null:t.trim(),f=await r(c);o(!1),f?(d(!0),setTimeout(()=>d(!1),3e3)):u("No se pudo guardar la información.")},g=t!==(a||"");return e.jsxs(T,{children:[e.jsx(G,{children:e.jsxs(U,{className:"flex items-center gap-2",children:[e.jsx(Ea,{className:"h-5 w-5 text-muted-foreground"}),"Alergias y Restricciones"]})}),e.jsx(O,{children:e.jsxs("div",{className:"space-y-1",children:[e.jsx(R,{htmlFor:"allergies-restrictions",children:"Indica alergias o ingredientes a evitar"}),e.jsx(ba,{id:"allergies-restrictions",value:t,onChange:j,placeholder:"Ej: Alergia a los frutos secos, evitar cerdo, sin gluten...",rows:4,disabled:i}),e.jsx("p",{className:"text-xs text-muted-foreground",children:"Opcional. Esta información podría usarse en el futuro para filtrar recetas."})]})}),e.jsxs(Y,{className:"flex justify-between items-center",children:[e.jsxs("div",{children:[n&&e.jsx("p",{className:"text-sm text-destructive",children:n}),p&&e.jsx("p",{className:"text-sm text-green-600",children:"Información guardada."})]}),e.jsxs(M,{onClick:x,disabled:!g||i,children:[i?e.jsx(K,{size:"sm",className:"mr-2"}):null,"Guardar Información"]})]})]})}function is({label:a,placeholder:r="Añade tags...",currentTags:t,onUpdateTags:l,className:i,id:o="tags-input"}){const[n,u]=s.useState([]),[p,d]=s.useState(""),[j,x]=s.useState(!1),[g,c]=s.useState(null),f=s.useRef(null);s.useEffect(()=>{u(t||[])},[t]);const h=b=>{d(b.target.value),c(null)},v=s.useCallback(async b=>{var w;const I=b.trim();if(I&&!n.includes(I)){const C=[...n,I];x(!0),c(null);try{await l(C)?(u(C),d("")):c("Error al guardar el tag.")}catch(k){console.error("Error updating tags:",k),c("Error inesperado al guardar.")}finally{x(!1)}}else n.includes(I)&&c(`"${I}" ya existe.`),d("");(w=f.current)==null||w.focus()},[n,l]),y=s.useCallback(async b=>{var w;const I=n.filter(C=>C!==b);x(!0),c(null);try{await l(I)?u(I):c("Error al eliminar el tag.")}catch(C){console.error("Error removing tag:",C),c("Error inesperado al eliminar.")}finally{x(!1)}(w=f.current)==null||w.focus()},[n,l]),N=b=>{b.key==="Enter"||b.key===","?(b.preventDefault(),v(p)):b.key==="Backspace"&&p===""&&n.length>0};return e.jsxs("div",{className:q("space-y-2",i),children:[e.jsx(R,{htmlFor:o,className:"text-slate-700",children:a}),e.jsxs("div",{className:"flex items-center space-x-2 p-2 border border-slate-300 rounded-md focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500",children:[e.jsxs("div",{className:"flex flex-wrap gap-1 flex-grow",children:[n.map(b=>e.jsxs(Na,{variant:"secondary",className:"flex items-center gap-1",children:[b,e.jsx("button",{type:"button",onClick:()=>y(b),disabled:j,className:"rounded-full hover:bg-slate-300 disabled:opacity-50","aria-label":`Eliminar ${b}`,children:e.jsx(xa,{className:"h-3 w-3"})})]},b)),e.jsx(V,{ref:f,id:o,type:"text",value:p,onChange:h,onKeyDown:N,placeholder:n.length===0?r:"Añadir más...",disabled:j,className:"flex-1 border-none shadow-none focus-visible:ring-0 h-auto p-0 m-0 min-w-[80px]"})]}),j&&e.jsx(je,{className:"h-4 w-4 animate-spin text-slate-500"})]}),g&&e.jsx("p",{className:"text-sm text-destructive pt-1",children:g})]})}const xe=["Horno","Microondas","Air Fryer","Licuadora","Procesadora de alimentos","Olla de cocción lenta","Batidora de mano","Batidora de pie"],P="Otro";function os({label:a,currentEquipment:r,onUpdateEquipment:t,className:l}){const[i,o]=s.useState(new Set),[n,u]=s.useState(""),[p,d]=s.useState(!1),[j,x]=s.useState(null);s.useEffect(()=>{const h=new Set;let v="";(r||[]).forEach(y=>{xe.includes(y)?h.add(y):y&&(h.add(P),v=y)}),o(h),u(v)},[r]);const g=s.useCallback(async(h,v)=>{const y=[];h.forEach(N=>{N!==P&&y.push(N)}),h.has(P)&&v.trim()&&y.push(v.trim()),d(!0),x(null);try{await t(y)||x("Error al guardar el equipamiento.")}catch(N){console.error("Error updating equipment:",N),x("Error inesperado al guardar.")}finally{d(!1)}},[t]),c=(h,v)=>{const y=new Set(i);v?y.add(h):y.delete(h),o(y);const N=h===P&&!v?"":n;u(N),g(y,N)},f=h=>{const v=h.target.value;u(v),i.has(P)&&g(i,v)};return e.jsxs("div",{className:q("space-y-3",l),children:[e.jsx(R,{className:"text-slate-700 font-medium",children:a}),e.jsxs("div",{className:"grid grid-cols-2 gap-x-4 gap-y-2",children:[xe.map(h=>e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(fe,{id:`equip-${h}`,checked:i.has(h),onCheckedChange:v=>c(h,!!v),disabled:p}),e.jsx(R,{htmlFor:`equip-${h}`,className:"text-sm font-normal text-slate-700",children:h})]},h)),e.jsxs("div",{className:"flex items-center space-x-2 col-span-2",children:[e.jsx(fe,{id:`equip-${P}`,checked:i.has(P),onCheckedChange:h=>c(P,!!h),disabled:p}),e.jsxs(R,{htmlFor:`equip-${P}`,className:"text-sm font-normal text-slate-700",children:[P,":"]}),e.jsx(V,{type:"text",value:n,onChange:f,placeholder:"Especifica otro equipamiento",disabled:!i.has(P)||p,className:q("h-8 text-sm flex-1",!i.has(P)&&"bg-slate-100")})]})]}),p&&e.jsx(je,{className:"h-4 w-4 animate-spin text-slate-500 mt-2"}),j&&e.jsx("p",{className:"text-sm text-destructive pt-1",children:j})]})}function ks(){const{user:a}=ha(),[r,t]=s.useState(null),[l,i]=s.useState(!0),[o,n]=s.useState(null),[u,p]=s.useState(""),[d,j]=s.useState(!1),[x,g]=s.useState(null),[c,f]=s.useState(!1),[h,v]=s.useState(void 0),[y,N]=s.useState(null),[b,I]=s.useState(""),[w,C]=s.useState(!1),[k,S]=s.useState(!1),[J,E]=s.useState(null),[B,_]=s.useState(null),Q=s.useCallback(async()=>{i(!0),n(null),g(null),f(!1);try{if(!(a!=null&&a.id)){n("No se pudo identificar al usuario para cargar el perfil."),i(!1);return}const m=await la(a.id);m?(t(m),p(m.username||""),v(m.avatar_url),N(m.gemini_api_key||null)):n("No se pudo cargar el perfil.")}catch(m){console.error("Error loading profile in page:",m),n("Ocurrió un error al cargar tu perfil.")}finally{i(!1)}},[]);s.useEffect(()=>{Q()},[Q]);const me=async()=>{if(r){j(!0),g(null),f(!1),n(null);try{const m=u.trim();if(m.length>0&&m.length<3){g("El nombre de usuario debe tener al menos 3 caracteres."),j(!1);return}if(!(a!=null&&a.id)){g("No se pudo identificar al usuario para guardar."),j(!1);return}await H(a.id,{username:m||null})?(t({...r,username:m||null}),f(!0),setTimeout(()=>f(!1),3e3)):g("No se pudo guardar el nombre de usuario.")}catch(m){console.error("Error updating username in page:",m),g("Ocurrió un error al guardar el nombre de usuario.")}finally{j(!1)}}},$=s.useCallback(async m=>{var A;n(null),g(null),f(!1);try{return m.max_prep_time!==void 0&&typeof m.max_prep_time!="number"&&m.max_prep_time!==null&&(console.warn("Invalid type for max_prep_time, setting to null"),m.max_prep_time=null),m.allergies_restrictions!==void 0&&((A=m.allergies_restrictions)==null?void 0:A.trim())===""&&(m.allergies_restrictions=null),a!=null&&a.id?await H(a.id,m)&&r?(t({...r,...m}),!0):!1:(n("No se pudo identificar al usuario para guardar la preferencia."),!1)}catch(X){return console.error("Error updating preference/info in page:",X),n("Ocurrió un error al guardar la información."),!1}},[r]),F=s.useCallback(async m=>{n(null);try{if(!(a!=null&&a.id))return n("No se pudo identificar al usuario para guardar los ingredientes excluidos."),!1;const A=m.map(D=>D.trim()).filter(D=>D.length>0);return await H(a.id,{excluded_ingredients:A})&&r?(t({...r,excluded_ingredients:A}),!0):(n("Error al guardar los ingredientes excluidos."),!1)}catch(A){return console.error("Error updating excluded ingredients:",A),n("Error inesperado al guardar los ingredientes excluidos."),!1}},[r,a==null?void 0:a.id]),Ze=s.useCallback(async m=>{n(null);try{if(!(a!=null&&a.id))return n("No se pudo identificar al usuario para guardar el equipamiento."),!1;const A=m.map(D=>D.trim()).filter(D=>D.length>0);return await H(a.id,{available_equipment:A})&&r?(t({...r,available_equipment:A}),!0):(n("Error al guardar el equipamiento."),!1)}catch(A){return console.error("Error updating available equipment:",A),n("Error inesperado al guardar el equipamiento."),!1}},[r,a==null?void 0:a.id]),ea=m=>{v(m),r&&t({...r,avatar_url:m})},aa=m=>!m||m.length<=4?"****":`****...${m.slice(-4)}`,sa=async()=>{if(!(a!=null&&a.id)){E("No se pudo identificar al usuario para guardar la clave.");return}if(!b.trim()){E("La clave API no puede estar vacía.");return}S(!0),E(null),_(null),n(null);try{await H(a.id,{gemini_api_key:b.trim()})?(N(b.trim()),I(""),_("Clave API de Gemini guardada correctamente."),C(!1),setTimeout(()=>_(null),4e3)):E("No se pudo guardar la clave API.")}catch(m){console.error("Error updating Gemini API Key:",m),E("Ocurrió un error al guardar la clave API.")}finally{S(!1)}},ra=async()=>{if(window.confirm("¿Estás seguro de que quieres eliminar tu clave API de Gemini?")){if(!(a!=null&&a.id)){E("No se pudo identificar al usuario para eliminar la clave.");return}S(!0),E(null),_(null),n(null);try{await H(a.id,{gemini_api_key:null})?(N(null),I(""),_("Clave API de Gemini eliminada."),C(!1),setTimeout(()=>_(null),4e3)):E("No se pudo eliminar la clave API.")}catch(m){console.error("Error deleting Gemini API Key:",m),E("Ocurrió un error al eliminar la clave API.")}finally{S(!1)}}};if(l)return e.jsx("div",{className:"flex justify-center items-center h-64",children:e.jsx(K,{size:"lg"})});if(o&&!r)return e.jsxs(Z,{variant:"destructive",className:"max-w-md mx-auto mt-8",children:[e.jsx(se,{className:"h-4 w-4"}),e.jsx(ee,{children:"Error"}),e.jsx(ae,{children:o})]});if(!r)return e.jsx("p",{className:"text-center mt-8",children:"Perfil no disponible."});const ta=r.username!==(u.trim()||null);return e.jsxs("div",{className:"container mx-auto max-w-2xl py-8 px-4",children:[e.jsx("h1",{className:"text-3xl font-bold mb-6 text-slate-900",children:"Tu Perfil"}),o&&!x&&e.jsxs(Z,{variant:"destructive",className:"mb-6",children:[e.jsx(se,{className:"h-4 w-4"}),e.jsx(ee,{children:"Error General"}),e.jsx(ae,{children:o})]}),e.jsxs("div",{className:"space-y-6",children:[e.jsxs(T,{className:"bg-white border border-slate-200 shadow-md rounded-lg",children:[e.jsx(G,{children:e.jsx(U,{className:"text-slate-900",children:"Avatar"})}),e.jsx(O,{children:e.jsx(Ta,{currentAvatarUrl:h,onAvatarUploaded:ea,userId:r.id})})]}),e.jsxs(T,{className:"bg-white border border-slate-200 shadow-md rounded-lg",children:[e.jsx(G,{children:e.jsx(U,{className:"text-slate-900",children:"Ingredientes Excluidos"})}),e.jsxs(O,{children:[e.jsx(is,{id:"excluded-ingredients-input",label:"Ingredientes a evitar",placeholder:"Añade ingredientes (ej: cilantro) y presiona Enter...",currentTags:r.excluded_ingredients,onUpdateTags:F}),e.jsx("p",{className:"text-xs text-muted-foreground mt-2",children:"Las recetas generadas por IA intentarán evitar estos ingredientes."})]})]}),e.jsxs(T,{className:"bg-white border border-slate-200 shadow-md rounded-lg",children:[e.jsx(G,{children:e.jsx(U,{className:"text-slate-900",children:"Equipamiento Disponible"})}),e.jsxs(O,{children:[e.jsx(os,{label:"Selecciona el equipamiento que tienes disponible:",currentEquipment:r.available_equipment,onUpdateEquipment:Ze}),e.jsx("p",{className:"text-xs text-muted-foreground mt-2",children:"Las recetas generadas por IA podrán tener en cuenta tu equipamiento."})]})]}),e.jsxs(T,{className:"bg-white border border-slate-200 shadow-md rounded-lg",children:[e.jsx(G,{children:e.jsx(U,{className:"text-slate-900",children:"Información Básica"})}),e.jsxs(O,{className:"space-y-4",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsx(R,{htmlFor:"email",className:"text-slate-700",children:"Email"}),e.jsx("div",{id:"email",className:"text-sm text-slate-600 p-2 border border-slate-300 rounded-md bg-slate-50",children:r.email||"No disponible"})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsx(R,{htmlFor:"username",className:"text-slate-700",children:"Nombre de Usuario"}),e.jsx(V,{id:"username",value:u,onChange:m=>{p(m.target.value),g(null),f(!1)},placeholder:"Tu nombre público (opcional)",disabled:d,className:"border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"}),x&&e.jsx("p",{className:"text-sm text-destructive pt-1",children:x}),c&&e.jsx("p",{className:"text-sm text-green-600 pt-1",children:"Nombre de usuario guardado."})]})]}),e.jsx(Y,{children:e.jsxs(M,{onClick:me,disabled:!ta||d,size:"sm",className:"ml-auto bg-emerald-600 hover:bg-emerald-700 text-white",children:[d?e.jsx(K,{size:"sm",className:"mr-2 text-white"}):e.jsx(pe,{className:"mr-2 h-4 w-4"}),"Guardar Usuario"]})})]}),e.jsx(Pa,{currentPreference:r.dietary_preference,onUpdatePreference:m=>$({dietary_preference:m})}),e.jsx(ts,{currentPreference:r.difficulty_preference,onUpdatePreference:m=>$({difficulty_preference:m})}),e.jsx(ns,{currentTime:r.max_prep_time,onUpdateTime:m=>$({max_prep_time:m})}),e.jsx(ls,{currentValue:r.allergies_restrictions,onUpdateValue:m=>$({allergies_restrictions:m})}),e.jsxs(T,{className:"bg-white border border-slate-200 shadow-md rounded-lg",children:[e.jsx(G,{children:e.jsx(U,{className:"text-slate-900",children:"API Key de Gemini (Opcional)"})}),e.jsxs(O,{className:"space-y-4",children:[e.jsxs("p",{className:"text-sm text-muted-foreground",children:["Opcionalmente, puedes guardar tu propia API Key de Google AI Studio (Gemini) para habilitar funcionalidades avanzadas de IA en la aplicación. Tu clave se almacena de forma segura y solo se usa para interactuar con la API de Gemini en tu nombre.",e.jsx("a",{href:"#",target:"_blank",rel:"noopener noreferrer",className:"text-emerald-600 hover:text-emerald-700 hover:underline ml-1",children:"¿Cómo obtener una clave?"})]}),B&&e.jsxs(Z,{children:[e.jsx(se,{className:"h-4 w-4 text-emerald-700"})," ",e.jsx(ee,{className:"text-emerald-800",children:"Éxito"})," ",e.jsx(ae,{className:"text-emerald-700",children:B})," "]}),J&&e.jsxs(Z,{variant:"destructive",children:[e.jsx(se,{className:"h-4 w-4"}),e.jsx(ee,{children:"Error"}),e.jsx(ae,{children:J})]}),y&&e.jsxs("div",{className:"space-y-1",children:[e.jsx(R,{htmlFor:"currentApiKey",className:"text-slate-700",children:"Clave API Actual"}),e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(V,{id:"currentApiKey",type:w?"text":"password",readOnly:!0,value:w?y:aa(y),className:"flex-grow bg-slate-100 border-slate-300 text-slate-700"}),e.jsx(M,{variant:"outline",size:"icon",onClick:()=>C(!w),"aria-label":w?"Ocultar clave":"Mostrar clave",className:"border-slate-300 text-slate-700 hover:bg-slate-100",children:w?e.jsx(Ia,{className:"h-4 w-4"}):e.jsx(Ca,{className:"h-4 w-4"})})]})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsx(R,{htmlFor:"newApiKey",className:"text-slate-700",children:y?"Reemplazar Clave API":"Ingresar Nueva Clave API"}),e.jsx(V,{id:"newApiKey",type:"password",value:b,onChange:m=>{I(m.target.value),E(null),_(null)},placeholder:"Pega tu clave API de Gemini aquí",disabled:k,className:"border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"})]})]}),e.jsxs(Y,{className:"flex justify-end space-x-2",children:[y&&e.jsxs(M,{variant:"destructive",onClick:ra,disabled:k,size:"sm",children:[k?e.jsx(K,{size:"sm",className:"mr-2"}):e.jsx(Sa,{className:"mr-2 h-4 w-4"}),"Eliminar Clave"]}),e.jsxs(M,{onClick:sa,disabled:!b.trim()||k,size:"sm",className:"bg-emerald-600 hover:bg-emerald-700 text-white",children:[k?e.jsx(K,{size:"sm",className:"mr-2 text-white"}):e.jsx(pe,{className:"mr-2 h-4 w-4"}),"Guardar Clave"]})]})]})]})]})}export{ks as UserProfilePage};
