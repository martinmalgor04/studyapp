// @ts-check
const nextConfig = require('eslint-config-next/core-web-vitals');

module.exports = [
  ...nextConfig,
  {
    rules: {
      // react-hooks/set-state-in-effect is a new strict rule in React 19's ESLint plugin.
      // Existing code uses valid patterns (init state from URL params, loading flags).
      // Downgraded to warn to avoid blocking CI while we gradually refactor.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
];
