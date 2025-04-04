import{j as e}from"./framer-motion-DexFYn3r.js";import{c as i,B as r,X as x}from"./index-o6bm3qdW.js";import{A as j,a as p,b as u,c as g,d as k,e as C,f as v,g as A,h as D}from"./alert-dialog-CCeH0div.js";/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const c=i("CheckSquare",[["path",{d:"m9 11 3 3L22 4",key:"1pflzl"}],["path",{d:"M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",key:"1jnkn4"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const f=i("Square",[["rect",{width:"18",height:"18",x:"3",y:"3",rx:"2",key:"afitv7"}]]);/**
 * @license lucide-react v0.320.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const y=i("Trash",[["path",{d:"M3 6h18",key:"d0wm0j"}],["path",{d:"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6",key:"4alrt4"}],["path",{d:"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2",key:"v07s0e"}]]),z=({isSelectionMode:l,selectedItems:n,onEnterSelectionMode:t,onSelectAll:o,onDeselectAll:d,onCancelSelection:h,onDeleteSelected:m,totalVisibleItems:a})=>{if(!l)return e.jsxs(r,{variant:"outline",size:"sm",onClick:t,"aria-label":"Activar modo selección",children:[e.jsx(c,{className:"mr-2 h-4 w-4"}),"Seleccionar"]});const s=n.size;return e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsxs("span",{className:"text-sm",children:[s," de ",a," seleccionados"]}),e.jsxs(r,{variant:"outline",size:"sm",onClick:s===a?d:o,children:[s===a?e.jsx(f,{className:"mr-2 h-4 w-4"}):e.jsx(c,{className:"mr-2 h-4 w-4"}),s===a?"Deseleccionar todo":"Seleccionar todo"]}),e.jsxs(j,{children:[e.jsx(p,{asChild:!0,children:e.jsxs(r,{variant:"destructive",size:"sm",disabled:s===0,children:[e.jsx(y,{className:"mr-2 h-4 w-4"}),"Eliminar (",s,")"]})}),e.jsxs(u,{children:[e.jsxs(g,{children:[e.jsx(k,{children:"¿Eliminar items seleccionados?"}),e.jsxs(C,{children:["Esta acción eliminará permanentemente ",s," ",s===1?"item":"items"," de tu despensa."]})]}),e.jsxs(v,{children:[e.jsx(A,{children:"Cancelar"}),e.jsx(D,{onClick:m,children:"Eliminar"})]})]})]}),e.jsxs(r,{variant:"ghost",size:"sm",onClick:h,children:[e.jsx(x,{className:"mr-2 h-4 w-4"}),"Cancelar"]})]})};export{z as default};
