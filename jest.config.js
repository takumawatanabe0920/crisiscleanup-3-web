module.exports = {
  collectCoverage: true,
  collectCoverageFrom: ["**/*.{js,vue}", "!**/node_modules/**"],
  // TODO: integrate coveralls or something similiar
  coverageReporters: ["text-summary"],

  moduleFileExtensions: ["js", "json", "vue"],
  transform: {
    // compile any *.vue files with vue-jest
    ".*\\.(vue)$": "vue-jest",
    // *.js => babel
    "^.+\\.js$": "<rootDir>/node_modules/babel-jest"
  }
};
