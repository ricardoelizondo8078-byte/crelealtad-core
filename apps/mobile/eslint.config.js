const { defineConfig, globalIgnores } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  globalIgnores(['.expo/*', 'coverage/*', 'dist/*']),
  expoConfig,
  {
    // La base existente usa refs imperativas de React Native y sincronización de estado en efectos.
    // Se conservan visibles como deuda mientras se migran por componente, sin bloquear el lint base.
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
