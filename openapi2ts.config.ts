const { generateService } = require('@umijs/openapi')

generateService({
    schemaPath: 'http://localhost:8080/api/v3/api-docs/default',
    serversPath: './src/renderer/src/',
    requestLibPath: "import request from '@renderer/http/request'",
})