import { swaggerSpec } from '../config/swagger';
import * as fs from 'fs';
import * as path from 'path';

interface PostmanCollection {
  info: {
    name: string;
    description: string;
    schema: string;
  };
  auth: any;
  item: any[];
  variable: any[];
}

function convertSwaggerToPostman(swagger: any): PostmanCollection {
  const collection: PostmanCollection = {
    info: {
      name: swagger.info.title,
      description: swagger.info.description,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'
    },
    auth: {
      type: 'bearer',
      bearer: [
        {
          key: 'token',
          value: '{{authToken}}',
          type: 'string'
        }
      ]
    },
    item: [],
    variable: [
      {
        key: 'baseUrl',
        value: swagger.servers[0].url,
        type: 'string'
      },
      {
        key: 'authToken',
        value: '',
        type: 'string'
      }
    ]
  };

  // Group endpoints by tags
  const groupedEndpoints: { [tag: string]: any[] } = {};

  Object.entries(swagger.paths).forEach(([path, methods]: [string, any]) => {
    Object.entries(methods).forEach(([method, endpoint]: [string, any]) => {
      if (endpoint.tags && endpoint.tags.length > 0) {
        const tag = endpoint.tags[0];
        if (!groupedEndpoints[tag]) {
          groupedEndpoints[tag] = [];
        }
        groupedEndpoints[tag].push({
          path,
          method,
          endpoint
        });
      }
    });
  });

  // Create folders for each tag
  Object.entries(groupedEndpoints).forEach(([tag, endpoints]) => {
    const folder = {
      name: tag,
      item: endpoints.map(({ path, method, endpoint }) => {
        const request: any = {
          name: endpoint.summary || `${method.toUpperCase()} ${path}`,
          request: {
            method: method.toUpperCase(),
            header: [
              {
                key: 'Content-Type',
                value: 'application/json'
              }
            ],
            url: {
              raw: `{{baseUrl}}${path}`,
              host: ['{{baseUrl}}'],
              path: path.split('/').filter((p: string) => p)
            }
          }
        };

        // Add path parameters
        if (endpoint.parameters) {
          request.request.url.variable = endpoint.parameters
            .filter((p: any) => p.in === 'path')
            .map((p: any) => ({
              key: p.name,
              value: '',
              description: p.description
            }));

          // Add query parameters
          const queryParams = endpoint.parameters.filter((p: any) => p.in === 'query');
          if (queryParams.length > 0) {
            request.request.url.query = queryParams.map((p: any) => ({
              key: p.name,
              value: '',
              description: p.description,
              disabled: !p.required
            }));
          }
        }

        // Add request body
        if (endpoint.requestBody) {
          const content = endpoint.requestBody.content['application/json'];
          if (content && content.schema) {
            request.request.body = {
              mode: 'raw',
              raw: JSON.stringify(generateExample(content.schema), null, 2),
              options: {
                raw: {
                  language: 'json'
                }
              }
            };
          }
        }

        // Add description
        if (endpoint.description) {
          request.description = endpoint.description;
        }

        return request;
      })
    };
    collection.item.push(folder);
  });

  return collection;
}

function generateExample(schema: any): any {
  if (schema.$ref) {
    // Handle references (simplified)
    return {};
  }

  switch (schema.type) {
    case 'object':
      const obj: any = {};
      if (schema.properties) {
        Object.entries(schema.properties).forEach(([key, prop]: [string, any]) => {
          obj[key] = generateExample(prop);
        });
      }
      return obj;
    
    case 'array':
      return [generateExample(schema.items)];
    
    case 'string':
      if (schema.enum) {
        return schema.enum[0];
      }
      if (schema.format === 'uuid') {
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
      }
      if (schema.format === 'date-time') {
        return new Date().toISOString();
      }
      if (schema.format === 'url') {
        return 'https://example.com';
      }
      return 'string';
    
    case 'integer':
    case 'number':
      return schema.minimum || 0;
    
    case 'boolean':
      return false;
    
    default:
      return null;
  }
}

// Generate the collection
const postmanCollection = convertSwaggerToPostman(swaggerSpec);

// Save to file
const outputPath = path.join(__dirname, '../../postman-collection.json');
fs.writeFileSync(outputPath, JSON.stringify(postmanCollection, null, 2));

console.log(`✅ Postman collection generated: ${outputPath}`);