// jest.setup.js
// Cargar variables de entorno desde .env para las pruebas de Jest
require('dotenv').config({ path: '.env.local' }); // Especificar el path correcto

// Puedes añadir aquí otras configuraciones globales para Jest si es necesario
// Por ejemplo, configurar mocks globales, polyfills, etc.