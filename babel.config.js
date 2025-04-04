module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: 'current' } }],
    '@babel/preset-typescript',
    // Añadir preset de React si hay errores de JSX más adelante
    ['@babel/preset-react', { runtime: 'automatic' }] // Descomentado para transformar JSX
  ],
  plugins: [
    // Añadir plugins para sintaxis específicas si son necesarias
    '@babel/plugin-syntax-import-meta', // Para import.meta
    '@babel/plugin-transform-object-rest-spread' // Usar el plugin recomendado
  ],
};