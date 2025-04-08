// CommonJS require
const { handleNtlmAuth } = require('./dist/cjs/index.js');
console.log('CJS import successful:', typeof handleNtlmAuth === 'function');
