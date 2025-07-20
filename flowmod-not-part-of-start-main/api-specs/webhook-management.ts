export const webhookManagementPaths = {
  '/webhook/set/{instanceName}': {
    post: {
      tags: ['Webhook Management'],
      summary: 'Configure Webhook',
      description: 'Set webhook URL and events for real-time notifications',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                webhook: {
                  type: 'object',
                  properties: {
                    enabled: { 
                      type: 'boolean', 
                      default: true,
                      description: 'Enable or disable webhook'
                    },
                    url: { 
                      type: 'string', 
                      example: 'https://your-server.com/webhook',
                      description: 'Your webhook endpoint URL'
                    },
                    events: {
                      type: 'array',
                      items: { 
                        type: 'string',
                        enum: [
                          'MESSAGES_UPSERT',
                          'MESSAGES_UPDATE', 
                          'GROUP_PARTICIPANTS_UPDATE',
                          'GROUPS_UPSERT',
                          'CHATS_UPSERT',
                          'CONTACTS_UPSERT',
                          'CONNECTION_UPDATE'
                        ]
                      },
                      description: 'Events to receive via webhook'
                    },
                    byEvents: { 
                      type: 'boolean', 
                      default: false,
                      description: 'Send separate requests for each event type'
                    },
                    base64: { 
                      type: 'boolean', 
                      default: false, 
                      description: 'Include base64 media in webhook payload'
                    }
                  },
                  required: ['url']
                }
              },
              required: ['webhook']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Webhook configured successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  webhook: {
                    type: 'object',
                    properties: {
                      instanceId: { 
                        type: 'string',
                        description: 'Instance identifier'
                      },
                      enabled: { type: 'boolean' },
                      url: { type: 'string' },
                      events: { 
                        type: 'array', 
                        items: { type: 'string' } 
                      },
                      webhookByEvents: { type: 'boolean' },
                      webhookBase64: { type: 'boolean' }
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
  '/webhook/find/{instanceName}': {
    get: {
      tags: ['Webhook Management'],
      summary: 'Get Webhook Configuration',
      description: 'Retrieve current webhook settings for the instance',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Webhook configuration retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  webhook: {
                    type: 'object',
                    properties: {
                      instanceId: { 
                        type: 'string',
                        description: 'Instance identifier'
                      },
                      enabled: { 
                        type: 'boolean',
                        description: 'Whether webhook is enabled'
                      },
                      url: { 
                        type: 'string',
                        description: 'Webhook endpoint URL'
                      },
                      events: {
                        type: 'array',
                        items: { type: 'string' },
                        description: 'Configured webhook events'
                      },
                      webhookByEvents: { 
                        type: 'boolean',
                        description: 'Whether events are sent separately'
                      },
                      webhookBase64: { 
                        type: 'boolean',
                        description: 'Whether base64 media is included'
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
  '/webhook/remove/{instanceName}': {
    delete: {
      tags: ['Webhook Management'],
      summary: 'Remove Webhook',
      description: 'Disable and remove webhook configuration',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Webhook removed successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { 
                    type: 'string',
                    example: 'Webhook removed successfully'
                  },
                  removed: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/webhook/events/{instanceName}': {
    get: {
      tags: ['Webhook Management'],
      summary: 'List Available Events',
      description: 'Get list of all available webhook event types',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        }
      ],
      responses: {
        '200': {
          description: 'Available events retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  availableEvents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        event: { 
                          type: 'string',
                          example: 'MESSAGES_UPSERT'
                        },
                        description: { 
                          type: 'string',
                          example: 'Triggered when new messages are received'
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