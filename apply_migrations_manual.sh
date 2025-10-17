#!/bin/bash
set -euo pipefail

echo "🔧 Aplicando migraciones del dashboard pastel..."
echo ""
echo "📋 INSTRUCCIONES:"
echo "1. Ve a https://supabase.com/dashboard/project/[tu-proyecto]/sql"
echo "2. Copia y pega el contenido del archivo 'apply_migrations_locally.sql'"
echo "3. Ejecuta la consulta en el SQL Editor"
echo "4. Verifica que aparezca: ✅ Migraciones del dashboard pastel aplicadas exitosamente"
echo ""
echo "📁 Ubicación del archivo SQL: $(pwd)/apply_migrations_locally.sql"
echo ""
echo "Después de aplicar las migraciones:"
echo "- El dashboard debería funcionar correctamente"
echo "- Deberías ver '🍬 Pastel' en el header"
echo "- Los datos del dashboard se cargarán desde el hook unificado"
