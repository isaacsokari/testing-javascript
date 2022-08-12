const path = require('path')

module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  moduleDirectories: ['node_modules', path.join(__dirname, 'src'), 'shared'],
  moduleNameMapper: {
    '\\.module.css$': 'identity-obj-proxy',
    '\\.css$': require.resolve('./test/styleMock.js'),
  },
  snapshotSerializers: ['@emotion/jest/serializer'],
  setupFilesAfterEnv: ['@testing-library/jest-dom/extend-expect'],
}
