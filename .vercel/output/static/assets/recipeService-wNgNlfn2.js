import{s}from"./index-o6bm3qdW.js";const u=async e=>{if(!e)return console.error("User ID es necesario para obtener recetas."),[];const{data:n,error:r}=await s.from("recipes").select(`
      *,
      is_favorite,
      recipe_ingredients (
        id,
        ingredient_name,
        quantity,
        unit,
        ingredient_id
      )
    `).eq("user_id",e).order("created_at",{ascending:!1});if(r)throw console.error("Error fetching recipes:",r),new Error(`Error al obtener recetas: ${r.message}`);const o=n.map(t=>({...t,ingredients:t.recipe_ingredients||[]}));return console.log("Recipes fetched:",o),o},g=async e=>{if(!e)return null;const{data:n,error:r}=await s.from("recipes").select(`
      *,
      is_favorite,
      recipe_ingredients (
        id,
        ingredient_name,
        quantity,
        unit,
        ingredient_id
      )
    `).eq("id",e).single();if(r){if(console.error(`Error fetching recipe ${e}:`,r),r.code==="PGRST116")return null;throw new Error(`Error al obtener la receta: ${r.message}`)}return n?{...n,...n,ingredients:n.recipe_ingredients||[]}:null},p=async e=>{if(console.log("Guardando receta:",e),!e.title||!e.user_id)throw new Error("El título y el ID de usuario son obligatorios.");const n={user_id:e.user_id,title:e.title,description:e.description,instructions:Array.isArray(e.instructions)?e.instructions.join(`
`):e.instructions,prep_time_minutes:e.prep_time_minutes,cook_time_minutes:e.cook_time_minutes,servings:e.servings},{data:r,error:o}=await s.from("recipes").insert(n).select().single();if(o||!r)throw console.error("Error al insertar receta:",o),new Error(`Error al guardar la receta: ${(o==null?void 0:o.message)||"Error desconocido"}`);console.log("Receta principal guardada (sin imagen aún), ID:",r.id);let t=null;try{console.log(`Invocando Edge Function 'generate-recipe-image' para: ${r.title}`);const{data:a,error:c}=await s.functions.invoke("generate-recipe-image",{body:{recipeTitle:r.title}});if(c)throw c;if(t=a==null?void 0:a.imageUrl,console.log("Imagen generada, URL/Data:",t),t){const{data:i,error:d}=await s.from("recipes").update({image_url:t}).eq("id",r.id).select().single();if(d)throw d;i&&(console.log("Receta actualizada con image_url."),Object.assign(r,i))}else console.warn("La Edge Function no devolvió una imageUrl.")}catch(a){console.error("Error al generar o guardar imagen para la receta:",a)}if(e.ingredients&&e.ingredients.length>0){const a=e.ingredients.map(i=>({recipe_id:r.id,ingredient_name:i.name,quantity:typeof i.quantity=="string"?parseFloat(i.quantity.replace(",","."))||null:i.quantity,unit:i.unit||null}));console.log("Insertando ingredientes:",a);const{error:c}=await s.from("recipe_ingredients").insert(a.map(i=>({recipe_id:i.recipe_id,ingredient_name:i.ingredient_name,quantity:i.quantity,unit:i.unit})));if(c)throw console.error("Error al insertar ingredientes:",c),new Error(`Error al guardar los ingredientes: ${c.message}`);console.log("Ingredientes guardados.")}return r},m=async e=>{if(!e)throw new Error("Se requiere ID de receta para eliminar.");const{error:n}=await s.from("recipes").delete().eq("id",e);if(n)throw console.error(`Error deleting recipe ${e}:`,n),new Error(`Error al eliminar la receta: ${n.message}`);console.log(`Receta ${e} eliminada.`)},f=async(e,n)=>{const{data:{user:r}}=await s.auth.getUser();if(!r)throw console.error("User not authenticated to update favorite status."),new Error("Usuario no autenticado");const{data:o,error:t}=await s.from("recipes").update({is_favorite:n}).eq("id",e).eq("user_id",r.id).select("id, is_favorite").single();if(t){if(console.error(`Error updating favorite status for recipe ${e}:`,t),t.code==="PGRST116")return console.warn(`Recipe ${e} not found or permission denied.`),null;throw new Error(`Error al actualizar favorito: ${t.message}`)}return console.log(`Recipe ${e} favorite status updated to ${n}`),o};export{p as a,u as b,m as d,g,f as u};
