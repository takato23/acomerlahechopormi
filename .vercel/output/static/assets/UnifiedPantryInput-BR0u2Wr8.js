const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/BarcodeScanner-DukQxBdB.js","assets/index-o6bm3qdW.js","assets/framer-motion-DexFYn3r.js","assets/index-CZXe0mcL.css","assets/VoiceInput-CGU2ImWd.js"])))=>i.map(i=>d[i]);
import{c as F,B as I,X as Z,S as k,b as v,_ as M}from"./index-o6bm3qdW.js";import{r as d,j as e,m as W,A as X}from"./framer-motion-DexFYn3r.js";import{I as z}from"./input-DTFkI6V9.js";import{L as C}from"./label-Ctjrl553.js";import{S as G,a as K,b as H,c as J,d as Y}from"./select-DBfGXf_6.js";import{A as ee,a as ae,b as te,c as se}from"./accordion-BmcxSi9G.js";import{s as re,u as ne}from"./useDebounce-Cu73n7FP.js";import{C as T}from"./check-BwO51OGf.js";import{a as U}from"./pantryService-1OnSk01a.js";import{P as ie}from"./plus-DaImIilD.js";import"./index-zM9kQwqA.js";import"./index-BMd2TyCU.js";import"./index-B3hHUwxe.js";import"./chevron-down-D8MEcRXF.js";import"./chevron-up-DGjrEF3Z.js";/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const oe=F("ChevronsUpDown",[["path",{d:"m7 15 5 5 5-5",key:"1hf1tw"}],["path",{d:"m7 9 5-5 5 5",key:"sgt6xg"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const le=F("PenLine",[["path",{d:"M12 20h9",key:"t2du7b"}],["path",{d:"M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z",key:"ymcmye"}]]),D={un:1,una:1,dos:2,tres:3,cuatro:4,cinco:5,seis:6,siete:7,ocho:8,nueve:9,diez:10,once:11,doce:12,trece:13,catorce:14,quince:15,veinte:20,treinta:30,cuarenta:40,cincuenta:50,medio:.5,media:.5},V=["kg","kilo","kilos","g","gr","gramo","gramos","libra","libras","lb","lbs","onza","onzas","oz","l","lt","lts","litro","litros","ml","cc","galon","galones","gal","u","un","unidad","unidades","doc","docena","docenas","par","pares","paq","paquete","paquetes","caja","cajas","lata","latas","bot","botella","botellas","sachet","sachets","atado","atados","bandeja","bandejas","rollo","rollos","tableta","tabletas","barra","barras","bolsa","bolsas","frasco","frascos","tarro","tarros"],ce=["de","del","la","el","los","las"],P=new RegExp(`\\b(${V.join("|")})(s?)\\b`,"i");function $(m){const f=m.toLowerCase();return D[f]??null}function E(m){return m.split(" ").filter(f=>!ce.includes(f.toLowerCase())).join(" ").trim()}function O(m){var x;const f=m,u=m.trim();if(!u)return{success:!1,error:"empty_input",originalText:f};let i=null,r=null,a=u;const t=u.match(new RegExp(`^(${Object.keys(D).join("|")})\\s+([a-zA-Záéíóúñ]+)\\s+(.+)$`,"i"));if(t){const g=$(t[1]);if(g!==null){const j=t[2].toLowerCase(),y=t[3];if(P.test(j))return i=g,r=S(j),a=E(y),{success:!0,data:{quantity:i,unit:r,ingredientName:a}}}}const b=u.match(/^(\d*\.?\d+)\s*([a-zA-Záéíóúñ]+)\s+(.+)$/i);if(b){const g=parseFloat(b[1]),j=b[2].toLowerCase(),y=b[3];if(P.test(j))return i=g,r=S(j),a=y.trim(),(a.toLowerCase().startsWith("y medio")||a.toLowerCase().startsWith("y media"))&&(i+=.5,a=a.replace(/^y\s+(medio|media)\s*/i,"").trim()),a=E(a),{success:!0,data:{quantity:i,unit:r,ingredientName:a}}}const h=u.match(new RegExp(`^(${Object.keys(D).join("|")})\\s+(.+)$`,"i"));if(h){const g=$(h[1]);if(g!==null)return i=g,r=S("u"),a=E(h[2]),{success:!0,data:{quantity:i,unit:r,ingredientName:a}}}const l=u.match(/^(.+?)\s+(\d*\.?\d+)\s*([a-zA-Záéíóúñ]*)$/i);if(l){const g=l[1],j=parseFloat(l[2]),y=((x=l[3])==null?void 0:x.toLowerCase())||null;if(!y||P.test(y))return i=j,r=S(y),a=E(g),{success:!0,data:{quantity:i,unit:r,ingredientName:a}}}const p=u.match(/^(\d*\.?\d+)\s+(.+)$/i);if(p)return i=parseFloat(p[1]),r=S("unidad"),a=E(p[2]),{success:!0,data:{quantity:i,unit:r,ingredientName:a}};const N=u.match(new RegExp(`^(${V.join("|")})s?\\s+de\\s+(.+)$`,"i"));return N?(i=1,r=S(N[1]),a=E(N[2]),{success:!0,data:{quantity:i,unit:r,ingredientName:a}}):(i=1,r=S("u"),a=E(u),a?{success:!0,data:{quantity:i,unit:r,ingredientName:a},usedFallback:!0}:{success:!1,error:"unparseable",originalText:f})}const de={kilo:"kg",kilos:"kg",g:"g",gr:"g",gramo:"g",gramos:"g",libra:"lb",libras:"lb",lbs:"lb",onza:"oz",onzas:"oz",l:"l",lt:"l",lts:"l",litro:"l",litros:"l",ml:"ml",cc:"ml",galon:"gal",galones:"gal",u:"u",un:"u",unidad:"u",unidades:"u",doc:"doc",docena:"doc",docenas:"doc",par:"par",pares:"par",paq:"paq",paquete:"paq",paquetes:"paq",caja:"caja",cajas:"caja",lata:"lata",latas:"lata",bot:"bot",botella:"bot",botellas:"bot",sachet:"sachet",sachets:"sachet",atado:"atado",atados:"atado",bandeja:"bandeja",bandejas:"bandeja",rollo:"rollo",rollos:"rollo",tableta:"tableta",tabletas:"tableta",barra:"barra",barras:"barra",bolsa:"bolsa",bolsas:"bolsa",frasco:"frasco",frascos:"frasco",tarro:"tarro",tarros:"tarro"};function S(m){if(!m)return null;const f=m.toLowerCase();return de[f]||f}function ue({initialData:m,usedFallback:f=!1,availableCategories:u,onConfirm:i,onCancel:r,onEditDetails:a}){var q;const[t,b]=d.useState(m),[h,l]=d.useState(null),[p,N]=d.useState(""),[x,g]=d.useState(!1),[j,y]=d.useState(!1),[L,s]=d.useState(!1),[o,c]=d.useState(""),[w,R]=d.useState("");d.useEffect(()=>{const n=re(t.ingredientName);l(n),n&&b(_=>({..._,suggestedCategoryId:n})),N("")},[m,t.ingredientName]);const A=async n=>{g(!0);const _={ingredient_name:t.ingredientName,quantity:t.quantity,unit:t.unit,category_id:h,expiry_date:p||null,location:o||null,price:w===""?null:Number(w)};try{await i(_,n)}catch(Q){console.error("Error confirming item from preview:",Q),v.error("Error al confirmar el ítem.")}finally{g(!1)}},B=()=>{if(a){const n={ingredient_name:t.ingredientName,quantity:t.quantity,unit:t.unit,category_id:h,expiry_date:p||null,location:o||null,price:w===""?null:Number(w)};a(n)}};return h&&((q=u.find(n=>n.id===h))==null||q.name),e.jsxs(W.div,{initial:{opacity:0,y:-10},animate:{opacity:1,y:0},exit:{opacity:0,y:-10},className:"mt-2 p-4 border rounded-md shadow-sm bg-card text-card-foreground",children:[e.jsxs("div",{className:"flex justify-between items-center mb-3",children:[e.jsx("h4",{className:"font-semibold",children:"Confirmar Ítem"}),e.jsx(I,{variant:"ghost",size:"sm",onClick:r,"aria-label":"Cancelar",children:e.jsx(Z,{className:"h-4 w-4"})})]}),e.jsxs("div",{className:"grid grid-cols-3 gap-2 mb-3 text-sm",children:[e.jsxs("div",{children:[e.jsx(C,{className:"text-xs text-muted-foreground",children:"Nombre"}),e.jsx("p",{className:"font-medium truncate",title:t.ingredientName,children:t.ingredientName}),f&&e.jsx("p",{className:"text-xs text-amber-600",children:"(Nombre inferido)"})]}),e.jsxs("div",{children:[e.jsx(C,{className:"text-xs text-muted-foreground",children:"Cantidad"}),e.jsx("p",{className:"font-medium",children:t.quantity??"-"})]}),e.jsxs("div",{children:[e.jsx(C,{className:"text-xs text-muted-foreground",children:"Unidad"}),e.jsx("p",{className:"font-medium",children:t.unit??"-"})]})]}),e.jsxs("div",{className:"mb-3",children:[e.jsx(C,{htmlFor:"preview-category",className:"text-xs text-muted-foreground",children:"Categoría"}),e.jsxs(G,{value:h??void 0,onValueChange:n=>l(n),disabled:x,children:[e.jsx(K,{id:"preview-category",className:"h-9",children:e.jsx(H,{placeholder:"Selecciona categoría..."})}),e.jsx(J,{children:u.map(n=>e.jsx(Y,{value:n.id,children:n.name},n.id))})]}),t.suggestedCategoryId&&h===t.suggestedCategoryId&&e.jsx("p",{className:"text-xs text-muted-foreground mt-1",children:"(Sugerida)"})]}),e.jsx(ee,{type:"single",collapsible:!0,value:j?"details":"",onValueChange:n=>y(n==="details"),children:e.jsxs(ae,{value:"details",className:"border-b-0",children:[e.jsx(te,{className:"text-sm py-2 hover:no-underline",children:e.jsxs("span",{className:"flex items-center gap-1",children:[e.jsx(oe,{className:"h-3 w-3"})," Añadir Detalles (Opcional)"]})}),e.jsx(se,{className:"pt-2 pb-0",children:e.jsxs("div",{className:"grid gap-2",children:[e.jsxs("div",{children:[e.jsx(C,{htmlFor:"preview-expiry",className:"text-xs text-muted-foreground",children:"Fecha de Caducidad"}),e.jsx(z,{id:"preview-expiry",type:"date",value:p,onChange:n=>{N(n.target.value),s(!0)},disabled:x,className:"h-9"})]}),e.jsxs("div",{children:[e.jsx(C,{htmlFor:"preview-location",className:"text-xs text-muted-foreground",children:"Ubicación"}),e.jsx(z,{id:"preview-location",type:"text",value:o,onChange:n=>c(n.target.value),placeholder:"Ej: Nevera, Despensa...",disabled:x,className:"h-9"})]}),e.jsxs("div",{children:[e.jsx(C,{htmlFor:"preview-price",className:"text-xs text-muted-foreground",children:"Precio"}),e.jsx(z,{id:"preview-price",type:"number",value:w,onChange:n=>R(n.target.value===""?"":Number(n.target.value)),placeholder:"Ej: 1.50",step:"0.01",disabled:x,className:"h-9"})]})]})})]})}),e.jsxs("div",{className:"flex justify-between items-center mt-4 gap-2 flex-wrap",children:[a&&e.jsxs(I,{variant:"outline",size:"sm",onClick:B,disabled:x,className:"flex-grow sm:flex-grow-0",children:[e.jsx(le,{className:"h-4 w-4 mr-1"})," Editar Detalles"]}),e.jsxs("div",{className:"flex gap-2 flex-grow justify-end",children:[e.jsxs(I,{variant:"secondary",size:"sm",onClick:()=>A(!0),disabled:x,children:[x?e.jsx(k,{size:"sm",className:"mr-1"}):e.jsx(T,{className:"h-4 w-4 mr-1"}),"Confirmar y Añadir Otro"]}),e.jsxs(I,{size:"sm",onClick:()=>A(!1),disabled:x,children:[x?e.jsx(k,{size:"sm",className:"mr-1"}):e.jsx(T,{className:"h-4 w-4 mr-1"}),"Confirmar"]})]})]})]})}const me=d.lazy(()=>M(()=>import("./BarcodeScanner-DukQxBdB.js"),__vite__mapDeps([0,1,2,3]))),pe=d.lazy(()=>M(()=>import("./VoiceInput-CGU2ImWd.js"),__vite__mapDeps([4,2,1,3]))),ze=({onItemAdded:m,availableCategories:f,onEditRequest:u})=>{const[i,r]=d.useState(""),[a,t]=d.useState(!1),[b,h]=d.useState(!1),[l,p]=d.useState(null);ne("",2e3);const N=()=>{const s=i.trim();s&&(t(!0),setTimeout(()=>{const o=O(s);if(t(!1),o.success)console.log("Parsed Data:",o.data,"Fallback:",o.usedFallback),p(o),v.info(`Parseado: ${o.data.quantity??"?"} ${o.data.unit??""} ${o.data.ingredientName}`);else{console.error("Parse Error:",o.error),p(null);let c="No se pudo entender la entrada.";o.error==="empty_input"&&(c="Por favor, introduce un ítem."),v.error(c)}},150))},x=s=>{s.key==="Enter"?(s.preventDefault(),l||N()):s.key==="Escape"&&(l?p(null):r(""))},g=async(s,o)=>{t(!0);try{await U(s),v.success(`"${s.ingredient_name}" añadido!`),p(null),r(""),m()}catch(c){console.error("Error adding item from unified input:",c),v.error(c instanceof Error?c.message:"Error al añadir el ítem.")}finally{t(!1)}},j=s=>{u?(p(null),r(""),u(s)):v.info("La edición detallada no está habilitada aquí.")},y=s=>{r(s)},L=async s=>{if(!s||a||l)return;r(s),console.log("Voice transcript set to input:",s),h(!0),await new Promise(c=>setTimeout(c,100)),t(!0),console.log("Starting parsing and API call for:",s);const o=O(s);if(console.log("Parsing result for voice input:",o),o.success)try{const c={ingredient_name:o.data.ingredientName,quantity:o.data.quantity,unit:o.data.unit};await U(c),v.success(`"${o.data.ingredientName}" añadido por voz!`),r(""),m()}catch(c){console.error("Error adding item from voice input:",c);const w=c instanceof Error?c.message:"Error desconocido al añadir el ítem por voz.";console.error("Error in addPantryItem from voice:",c),v.error(`Error al añadir "${s}": ${w}`)}else console.error("Voice Parse Error:",o.error),v.error(`No se entendió: "${s}". Intenta de nuevo o edita manualmente.`);t(!1),h(!1)};return e.jsxs("div",{className:"flex flex-col w-full gap-2",children:[e.jsxs("div",{className:"flex items-center space-x-2",children:[e.jsx(z,{type:"text",placeholder:"Ej: 2 kg Harina, Leche 1 litro, 5 Manzanas...",value:i,onChange:s=>{r(s.target.value),l&&p(null)},onKeyDown:x,disabled:a||b,readOnly:b,className:"h-10 flex-grow"}),e.jsx(d.Suspense,{fallback:e.jsx(I,{variant:"outline",size:"icon",disabled:!0,className:"h-10 w-10",children:e.jsx(k,{size:"sm"})}),children:e.jsx(me,{isLoading:a,onBarcodeDetected:y})}),e.jsx(d.Suspense,{fallback:e.jsx(I,{variant:"outline",size:"icon",disabled:!0,className:"h-10 w-10",children:e.jsx(k,{size:"sm"})}),children:e.jsx(pe,{isLoading:a,isProcessingVoice:b,onTranscriptReceived:L})}),e.jsx(I,{onClick:N,disabled:a||b||!i.trim()||!!l,className:"h-10","aria-label":"Añadir ítem manualmente",children:a&&!b?e.jsx(k,{size:"sm"}):e.jsx(ie,{className:"h-4 w-4"})})]}),e.jsx(X,{children:(l==null?void 0:l.success)&&e.jsx(ue,{initialData:l.data,usedFallback:l.usedFallback,availableCategories:f,onConfirm:g,onCancel:()=>p(null),onEditDetails:u?j:void 0},i)})]})};export{ze as default};
