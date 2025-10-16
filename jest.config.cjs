// jest.config.cjs
module.exports = {
  testEnvironment: "jsdom",
  transform: {
    "^.+\\.[tj]sx?$": "babel-jest",
  },
  testMatch: ["**/tests/**/*.test.[jt]s?(x)", "**/*.test.[jt]s?(x)"],
  setupFilesAfterEnv: ["<rootDir>/tests/setupTests.js"],
  moduleNameMapper: {
    "\\.(css|less|scss)$": "<rootDir>/tests/__mocks__/styleMock.js",
    "\\.(png|jpg|jpeg|svg)$": "<rootDir>/tests/__mocks__/fileMock.js",
  },
  transformIgnorePatterns: ["/node_modules/"],
};
