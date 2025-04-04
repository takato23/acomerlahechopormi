import{r as q,j as s}from"./framer-motion-DexFYn3r.js";import{C as B,a as V,c as F,b as R}from"./card-CGU5HWmE.js";import{h as u,B as d}from"./index-o6bm3qdW.js";import{C as A}from"./checkbox-CElA_Qfn.js";import{C as G}from"./chevron-up-DGjrEF3Z.js";import{C as H}from"./chevron-down-D8MEcRXF.js";import{P as C}from"./pencil-DTPZJ6bb.js";import{T as v}from"./trash-2-CpjvPaTx.js";import{P as f,M as k,T as b,a as L,b as $}from"./tags-41O2HsC5.js";import{C as _}from"./calendar-clock-BfQncUxL.js";import"./index-B3hHUwxe.js";import"./check-BwO51OGf.js";function O(e,t){if(!e||!e.startsWith("#"))return`rgba(0, 0, 0, ${t})`;const l=e.length===4?`#${e[1]}${e[1]}${e[2]}${e[2]}${e[3]}${e[3]}`:e,n=parseInt(l.slice(1),16),c=n>>16&255,i=n>>8&255,r=n&255;return`rgba(${c}, ${i}, ${r}, ${t})`}function U({item:e,onEdit:t,onDelete:l,isSelectionMode:n,isSelected:c,onSelectItem:i}){var g,N,w,y;const[r,P]=q.useState(!1),x=e._consolidatedCount&&e._consolidatedCount>1,E=e._originalItems||[],j=e.expiry_date&&new Date(e.expiry_date)<new Date,h=(g=e.category)==null?void 0:g.color,T={borderLeft:`3px solid ${h||"transparent"}`,backgroundColor:h?O(h,.1):"transparent"},z=a=>{const p=a.target,m=p.closest("button"),o=p.closest('[role="checkbox"]');n&&!m&&!o&&i(e.id)},D=a=>{a.stopPropagation(),P(!r)};return s.jsxs(B,{className:u("flex flex-col justify-between h-full shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden",n&&"cursor-pointer",c&&"ring-2 ring-primary ring-offset-2"),onClick:z,children:[s.jsxs(V,{className:u("p-2 flex flex-row items-center gap-1.5 space-y-0",n&&"pointer-events-auto"),style:T,onClick:a=>{n&&a.stopPropagation()},children:[n&&s.jsxs("div",{className:"flex items-center justify-center h-7 w-7 mr-1",children:[" ",s.jsx(A,{id:`select-${e.id}`,checked:c,onCheckedChange:()=>i(e.id),"aria-label":`Seleccionar ${((N=e.ingredient)==null?void 0:N.name)||"item"}`,onClick:a=>a.stopPropagation()})]}),s.jsxs("div",{className:"flex-1 overflow-hidden",children:[s.jsx(F,{className:"text-sm font-medium leading-tight truncate",children:((w=e.ingredient)==null?void 0:w.name)||"Ingrediente Desconocido"}),((y=e.category)==null?void 0:y.name)&&s.jsx("p",{className:"text-xs font-medium text-muted-foreground truncate",children:e.category.name})," "]}),x&&!n&&s.jsxs(d,{variant:"ghost",size:"sm",className:"h-7 w-7",onClick:D,"aria-expanded":r,"aria-controls":`details-${e.id}`,children:[r?s.jsx(G,{className:"h-4 w-4"}):s.jsx(H,{className:"h-4 w-4"}),s.jsx("span",{className:"sr-only",children:r?"Colapsar detalles":"Expandir detalles"})]}),!n&&!x&&s.jsxs("div",{className:"flex gap-0",children:[s.jsxs(d,{variant:"ghost",size:"sm",className:"h-7 w-7",onClick:a=>{a.stopPropagation(),t(e)},children:[s.jsx(C,{className:"h-3.5 w-3.5"}),s.jsx("span",{className:"sr-only",children:"Editar"})]}),s.jsxs(d,{variant:"ghost",size:"sm",className:"h-7 w-7 text-destructive hover:text-destructive",onClick:a=>{a.stopPropagation(),l(e.id)},children:[s.jsx(v,{className:"h-3.5 w-3.5"}),s.jsx("span",{className:"sr-only",children:"Eliminar"})]})]})]}),s.jsxs(R,{className:"p-2 text-xs text-muted-foreground flex-1",children:[" ",s.jsxs("div",{className:"space-y-1",children:[" ",s.jsxs("div",{className:"flex items-center gap-0.5 text-sm font-medium",children:[" ",s.jsx(f,{className:"h-3.5 w-3.5 text-muted-foreground"}),s.jsxs("span",{children:[e.quantity??"-"," ",e.unit||""]}),x&&s.jsxs("span",{className:"ml-1 text-xs font-normal text-muted-foreground",children:["(+",e._consolidatedCount-1,")"]})]}),s.jsxs("ul",{className:"space-y-0.5 text-xs",children:[" ",e.expiry_date?s.jsxs("li",{className:`flex items-center gap-0.5 ${j?"text-destructive font-medium":""}`,children:[" ",s.jsx(_,{className:"h-3 w-3 flex-shrink-0"})," ",s.jsxs("span",{children:[j?"Vencido:":"Vence:"," ",e.expiry_date]})]}):null,e.location&&s.jsxs("li",{className:"flex items-center gap-0.5",children:[" ",s.jsx(k,{className:"h-3 w-3 flex-shrink-0"}),s.jsx("span",{children:e.location})]}),e.price!=null?s.jsxs("li",{className:"flex items-center gap-0.5",children:[" ",s.jsx(b,{className:"h-3 w-3 flex-shrink-0"}),s.jsxs("span",{children:["$",e.price.toFixed(2)]})]}):null,(e.min_stock!=null||e.target_stock!=null)&&s.jsxs("li",{className:"flex items-center gap-0.5",title:"Stock Min/Obj",children:[" ",s.jsx(f,{className:"h-3 w-3 flex-shrink-0"}),s.jsxs("span",{children:["Stock: ",e.min_stock??"_"," / ",e.target_stock??"_"," "]})]})]}),e.tags&&e.tags.length>0&&s.jsxs("div",{className:"flex items-center gap-0.5 flex-wrap pt-1",children:[" ",s.jsx(L,{className:"h-3 w-3 text-muted-foreground mr-0.5 flex-shrink-0"})," ",e.tags.map(a=>s.jsxs("span",{className:"text-[10px] px-1 py-0.25 bg-secondary text-secondary-foreground rounded-full",children:[" ",a]},a))]}),e.notes&&s.jsxs("div",{className:"flex items-start gap-0.5 pt-1 text-xs",children:[" ",s.jsx($,{className:"h-3 w-3 mt-0.5 flex-shrink-0"})," ",s.jsx("p",{className:"line-clamp-2",children:e.notes})," "]})]})]}),r&&x&&s.jsxs("div",{id:`details-${e.id}`,className:"border-t border-border/50 px-2 py-1.5 bg-muted/20",children:[" ",s.jsxs("div",{className:"space-y-1",children:[" ",E.map((a,p)=>{const m=a.expiry_date&&new Date(a.expiry_date)<new Date;return s.jsxs("div",{className:"flex justify-between items-center text-xs gap-2",children:[" ",s.jsxs("div",{className:"flex-1 flex items-center gap-1.5 overflow-hidden flex-wrap",children:[" ",s.jsxs("span",{className:"font-medium whitespace-nowrap",children:[s.jsx(f,{className:"inline h-3 w-3 mr-0.5 text-muted-foreground"}),a.quantity??"-"," ",a.unit||""]}),a.expiry_date&&s.jsxs("span",{className:u("text-muted-foreground whitespace-nowrap",m&&"text-destructive font-medium"),children:[s.jsx(_,{className:"inline h-3 w-3 mr-0.5"}),a.expiry_date]}),a.price!=null&&s.jsxs("span",{className:"text-muted-foreground whitespace-nowrap",children:[s.jsx(b,{className:"inline h-3 w-3 mr-0.5"}),"$",a.price.toFixed(2)]}),a.location&&s.jsxs("span",{className:"text-muted-foreground whitespace-nowrap hidden xs:inline",children:[s.jsx(k,{className:"inline h-3 w-3 mr-0.5"}),a.location]}),a.notes&&s.jsxs("span",{className:"text-muted-foreground whitespace-nowrap hidden sm:inline",title:a.notes,children:[s.jsx($,{className:"inline h-3 w-3 mr-0.5"}),"Nota"]})]}),!n&&s.jsxs("div",{className:"flex gap-0.5 flex-shrink-0",children:[" ",s.jsxs(d,{variant:"ghost",size:"icon",className:"h-5 w-5",onClick:o=>{o.stopPropagation(),t(a)},children:[s.jsx(C,{className:"h-3 w-3"})," ",s.jsx("span",{className:"sr-only",children:"Editar ítem original"})]}),s.jsxs(d,{variant:"ghost",size:"icon",className:"h-5 w-5 text-destructive hover:text-destructive",onClick:o=>{o.stopPropagation(),l(a.id)},children:[s.jsx(v,{className:"h-3 w-3"})," ",s.jsx("span",{className:"sr-only",children:"Eliminar ítem original"})]})]})]},a.id||p)})]})]})]})}const as=({items:e,onEdit:t,onDelete:l,isSelectionMode:n,selectedItems:c,onSelectItem:i})=>!e||e.length===0?s.jsx("div",{className:"text-center py-10 text-muted-foreground",id:"pantry-empty-state",children:"Tu despensa está vacía. ¡Añade algunos items!"}):s.jsx("div",{className:"grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-1",children:e.map(r=>s.jsx(U,{item:r,onEdit:t,onDelete:l,isSelectionMode:n,isSelected:c.has(r.id),onSelectItem:i},r.id))});export{as as default};
