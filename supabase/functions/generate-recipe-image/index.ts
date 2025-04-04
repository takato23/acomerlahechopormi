import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { corsHeaders } from '../_shared/cors.ts'

// Placeholder para la API Key de Stability AI (se leerá desde secretos)
const STABILITY_API_KEY = Deno.env.get('STABILITY_API_KEY')

serve(async (req) => {
  // Manejo de CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extraer el título de la receta del body de la request
    const { recipeTitle } = await req.json()
    if (!recipeTitle) {
      throw new Error('Falta "recipeTitle" en el body de la solicitud.')
    }

    if (!STABILITY_API_KEY) {
        throw new Error('Falta la API Key de Stability AI (STABILITY_API_KEY) en los secretos de Supabase.')
    }

    console.log(`Generando imagen para: ${recipeTitle}`)

    // 2. Construir el prompt para Stability AI (se puede mejorar)
    const prompt = `Fotografía profesional de comida, plato terminado de "${recipeTitle}", apetitoso, bien iluminado, vista superior o ángulo ligero`

    // 3. Llamar a la API de Stability AI (Ejemplo con Text-to-Image)
    //    Referencia API: https://platform.stability.ai/docs/api-reference#tag/v1generation/operation/textToImage
    //    Endpoint: https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image (o el modelo deseado)

    const stabilityApiUrl = 'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image'; // O el modelo que prefieras

    const apiResponse = await fetch(stabilityApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json', // o 'image/png' si quieres la imagen directamente
        'Authorization': `Bearer ${STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [{ text: prompt }],
        cfg_scale: 7, // Parámetro de configuración (ajustar según necesidad)
        height: 512, // Dimensiones (ajustar)
        width: 512,
        steps: 30, // Pasos de generación (ajustar)
        samples: 1, // Número de imágenes a generar
        // Otros parámetros opcionales: style_preset, seed, etc.
      }),
    });

    if (!apiResponse.ok) {
      const errorBody = await apiResponse.text();
      console.error("Error de Stability AI:", errorBody);
      throw new Error(`Error al generar imagen (${apiResponse.status}): ${errorBody}`);
    }

    // 4. Procesar la respuesta de Stability AI
    //    La API devuelve un JSON con un array 'artifacts' que contiene las imágenes en base64
    const responseData = await apiResponse.json();
    const imageBase64 = responseData.artifacts[0]?.base64;

    if (!imageBase64) {
        throw new Error('No se recibió la imagen en formato base64 desde Stability AI.');
    }

    // 5. (Opcional pero recomendado) Subir la imagen a Supabase Storage
    //    Esto evita devolver strings base64 muy largos y permite usar URLs públicas
    //    Necesitaríamos importar el cliente de Supabase aquí
    //    const storagePath = `public/${recipeTitle.replace(/\s+/g, '_')}_${Date.now()}.png`;
    //    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
    //      .from('recipe_images')
    //      .upload(storagePath, decode(imageBase64), { contentType: 'image/png' }); // decode de std/encoding/base64.ts
    //    if (uploadError) throw uploadError;
    //    const imageUrl = supabaseAdmin.storage.from('recipe_images').getPublicUrl(storagePath).data.publicUrl;

    // Por ahora, devolvemos la imagen en base64 (menos ideal)
    const imageUrl = `data:image/png;base64,${imageBase64}`; // O la URL de Supabase Storage

    // 6. Devolver la URL de la imagen (o la data base64)
    return new Response(
      JSON.stringify({ imageUrl }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )
  } catch (error) {
    console.error("Error en Edge Function:", error);
    return new Response(
        JSON.stringify({ error: error.message }),
        {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 400, // O 500 si es un error interno
        }
    )
  }
})