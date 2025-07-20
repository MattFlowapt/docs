export const instanceManagementPaths = {
  '/instance/connect/{instanceName}': {
    post: {
      tags: ['Instance Management'],
      summary: 'Connect WhatsApp Instance',
      description: 'Initiate WhatsApp connection. Returns QR code if disconnected, or current state if already connected.',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'WhatsApp instance identifier'
        }
      ],
      responses: {
        '200': {
          description: 'Connection response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 200 },
                  error: { type: 'boolean', example: false },
                  response: {
                    oneOf: [
                      {
                        type: 'object',
                        description: 'When already connected',
                        properties: {
                          instance: {
                            type: 'object',
                            properties: {
                              instanceName: { type: 'string', example: 'FlowMod' },
                              status: { type: 'string', example: 'connecting' }
                            }
                          }
                        }
                      },
                      {
                        type: 'object',
                        description: 'When connection needed',
                        properties: {
                          instance: {
                            type: 'object',
                            properties: {
                              instanceName: { type: 'string', example: 'FlowMod' },
                              status: { type: 'string', example: 'connecting' }
                            }
                          },
                          qrcode: {
                            type: 'object',
                            properties: {
                              code: { type: 'string', description: 'QR code string for WhatsApp mobile app' },
                              base64: { type: 'string', description: 'Base64 encoded QR code image' }
                            }
                          }
                        }
                      }
                    ]
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/instance/connectionState/{instanceName}': {
    get: {
      tags: ['Instance Management'],
      summary: 'Get Connection State',
      description: 'Retrieve current connection state of the WhatsApp instance',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'WhatsApp instance identifier'
        }
      ],
      responses: {
        '200': {
          description: 'Connection state retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 200 },
                  error: { type: 'boolean', example: false },
                  response: {
                    type: 'object',
                    properties: {
                      instance: {
                        type: 'object',
                        properties: {
                          instanceName: { type: 'string', example: 'FlowMod' },
                          state: { 
                            type: 'string', 
                            enum: ['open', 'connecting', 'close'],
                            example: 'open',
                            description: 'Current connection state'
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/instance/fetchInstances': {
    get: {
      tags: ['Instance Management'],
      summary: 'List All Instances',
      description: 'Retrieve all WhatsApp instances associated with your account',
      responses: {
        '200': {
          description: 'Instances retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 200 },
                  error: { type: 'boolean', example: false },
                  response: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        instanceName: { type: 'string', example: 'FlowMod' },
                        instanceId: { type: 'string', description: 'Unique instance ID' },
                        status: { 
                          type: 'string', 
                          enum: ['open', 'connecting', 'close'],
                          example: 'open'
                        },
                        serverUrl: { 
                          type: 'string', 
                          example: 'https://api.flowmod.ai',
                          description: 'API server URL'
                        },
                        profileName: { 
                          type: 'string', 
                          example: '🤖 FlowMod Agent',
                          description: 'Display name of the WhatsApp account'
                        },
                        profilePicUrl: { 
                          type: 'string', 
                          nullable: true,
                          description: 'Profile picture URL'
                        },
                        integration: { 
                          type: 'string', 
                          example: 'WHATSAPP-BAILEYS',
                          description: 'Integration type'
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}; 