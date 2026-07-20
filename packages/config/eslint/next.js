// Extends the base config with Next.js + React Hooks rules for the apps.
const base = require("./base.js");
const reactHooks = require("eslint-plugin-react-hooks");

/** @type {import('eslint').Linter.Config[]} */
module.exports = [
  ...base,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
    },
  },
];
