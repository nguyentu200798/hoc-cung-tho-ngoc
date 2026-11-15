import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';

export default [
  {
    ignores: ['dist/**/*', 'node_modules/**/*', 'uploaded_games/**/*', 'uploaded_lessons/**/*'],
  },
  firebaseRulesPlugin.configs['flat/recommended'],
];
