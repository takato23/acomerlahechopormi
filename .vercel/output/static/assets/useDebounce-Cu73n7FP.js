import{r as s}from"./framer-motion-DexFYn3r.js";const u={vegetables:{exactMatch:["manzana","pera","banana","lechuga","tomate","zanahoria","cebolla","papa","naranja","limon","uva","frutilla"],partialMatch:["fruta","verdura","hortaliza"],priority:1},dairy:{exactMatch:["leche","queso","yogur","huevo","huevos","manteca","crema"],partialMatch:["lácteo"],priority:1},meat:{exactMatch:["pollo","carne","pescado","cerdo","jamon","milanesa","milanesas","salchicha","atun","bife"],partialMatch:["proteína","fiambre","embutido"],priority:1},pantry:{exactMatch:["arroz","fideos","pan","harina","azucar","sal","aceite","lata","conserva","galletitas","cafe","te","yerba","mermelada","pure"],partialMatch:["cereal","pasta","almacen","seco","enlatado"],priority:1},cleaning:{exactMatch:["lavandina","detergente","jabon","limpiador","papel higienico","servilleta","escoba","trapo"],partialMatch:["limpieza","hogar"],priority:1},beverages:{exactMatch:["agua","gaseosa","jugo","vino","cerveza","soda"],partialMatch:["bebida","liquido"],priority:1},frozen:{exactMatch:["helado","congelado","pizza congelada","verdura congelada"],partialMatch:["congelado","freezer"],priority:1},personal_care:{exactMatch:["shampoo","acondicionador","desodorante","perfume","crema corporal","protector solar"],partialMatch:["cuidado personal","higiene","cosmetico"],priority:1},other:{exactMatch:["mascota","pilas"],partialMatch:[],priority:99}},d=(e,t=u)=>{if(!e||e.trim().length===0)return null;const r=e.trim().toLowerCase();let a=null;for(const o in t){const c=t[o];let i=!1,n=c.priority;const p=r.split(/\s+/);c.exactMatch.some(l=>p.includes(l.toLowerCase()))?i=!0:c.partialMatch.some(l=>r.includes(l.toLowerCase()))&&(i=!0,n+=10),i&&(!a||n<a.priority)&&(a={categoryId:o,priority:n})}return console.log(`Suggestion for "${e}": ${a?a.categoryId:"None"}`),a?a.categoryId:null};function g(e,t){const[r,a]=s.useState(e);return s.useEffect(()=>{const o=setTimeout(()=>{a(e)},t);return()=>{clearTimeout(o)}},[e,t]),r}export{d as s,g as u};
