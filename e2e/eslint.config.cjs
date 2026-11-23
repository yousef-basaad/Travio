const base = require("@travio/config/eslint");

module.exports = [...base, { ignores: ["playwright-report/**", "test-results/**"] }];
