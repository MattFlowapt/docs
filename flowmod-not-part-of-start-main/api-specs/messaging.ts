export const messagingPaths = {
  '/message/sendText/{instanceName}': {
    post: {
      tags: ['Messaging'],
      summary: 'Send Text Message',
      description: 'Send a text message to a WhatsApp number or group with optional features like typing delay, mentions, and replies',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'Organization-specific instance identifier'
        }
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                number: { 
                  type: 'string', 
                  example: '5511999999999',
                  description: 'Phone number or group ID to send message to'
                },
                text: { 
                  type: 'string', 
                  example: 'Hello, World!',
                  description: 'Message text content'
                },
                delay: { 
                  type: 'number', 
                  example: 1200,
                  description: 'Typing simulation delay in milliseconds'
                },
                quoted: {
                  type: 'object',
                  description: 'Message to quote/reply to',
                  properties: {
                    key: { $ref: '#/components/schemas/MessageKey' }
                  }
                },
                linkPreview: { 
                  type: 'boolean', 
                  default: true,
                  description: 'Enable link preview for URLs'
                },
                mentionsEveryOne: { 
                  type: 'boolean', 
                  default: false,
                  description: 'Mention all group participants'
                },
                mentioned: { 
                  type: 'array', 
                  items: { type: 'string' },
                  description: 'Array of phone numbers to mention'
                }
              },
              required: ['number', 'text']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Message sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Message' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/message/sendMedia/{instanceName}': {
    post: {
      tags: ['Messaging'],
      summary: 'Send Media Message',
      description: 'Send image, video, audio, or document message with optional caption',
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
                number: { 
                  type: 'string', 
                  example: '5511999999999',
                  description: 'Phone number or group ID'
                },
                mediatype: { 
                  type: 'string', 
                  enum: ['image', 'video', 'audio', 'document'],
                  example: 'image',
                  description: 'Type of media being sent'
                },
                media: { 
                  type: 'string',
                  description: 'Base64 encoded media content or URL'
                },
                caption: { 
                  type: 'string', 
                  example: 'Media caption',
                  description: 'Optional caption for the media'
                },
                fileName: { 
                  type: 'string', 
                  example: 'document.pdf',
                  description: 'File name for documents'
                },
                mimetype: { 
                  type: 'string', 
                  example: 'image/jpeg',
                  description: 'MIME type of the media'
                }
              },
              required: ['number', 'mediatype', 'media']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Media message sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Message' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/message/sendAudio/{instanceName}': {
    post: {
      tags: ['Messaging'],
      summary: 'Send Audio Message',
      description: 'Send an audio message (voice note) with automatic encoding to WhatsApp format',
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
                number: { 
                  type: 'string', 
                  example: '5511999999999',
                  description: 'Phone number or group ID'
                },
                audio: { 
                  type: 'string',
                  description: 'Base64 encoded audio content or URL'
                },
                encoding: { 
                  type: 'boolean', 
                  default: true,
                  description: 'Enable automatic audio encoding to WhatsApp format'
                },
                delay: { 
                  type: 'number', 
                  example: 1200,
                  description: 'Recording simulation delay in milliseconds'
                }
              },
              required: ['number', 'audio']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Audio message sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Message' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/message/sendLocation/{instanceName}': {
    post: {
      tags: ['Messaging'],
      summary: 'Send Location Message',
      description: 'Send a location message with coordinates and optional name/address',
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
                number: { 
                  type: 'string', 
                  example: '5511999999999'
                },
                latitude: { 
                  type: 'number', 
                  example: -23.5505,
                  description: 'Latitude coordinate'
                },
                longitude: { 
                  type: 'number', 
                  example: -46.6333,
                  description: 'Longitude coordinate'
                },
                name: { 
                  type: 'string', 
                  example: 'São Paulo',
                  description: 'Location name'
                },
                address: { 
                  type: 'string', 
                  example: 'São Paulo, Brazil',
                  description: 'Full address'
                }
              },
              required: ['number', 'latitude', 'longitude']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Location message sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Message' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/message/sendPoll/{instanceName}': {
    post: {
      tags: ['Messaging'],
      summary: 'Send Poll Message',
      description: 'Send a poll message with multiple options for voting',
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
                number: { 
                  type: 'string', 
                  example: '5511999999999'
                },
                name: { 
                  type: 'string', 
                  example: 'What\'s your favorite color?',
                  description: 'Poll question'
                },
                selectableCount: { 
                  type: 'number', 
                  example: 1,
                  description: 'Number of options users can select'
                },
                values: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['Red', 'Blue', 'Green', 'Yellow'],
                  description: 'Poll options'
                }
              },
              required: ['number', 'name', 'selectableCount', 'values']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Poll message sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Message' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/message/sendContact/{instanceName}': {
    post: {
      tags: ['Messaging'],
      summary: 'Send Contact Message',
      description: 'Send contact information as a vCard',
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
                number: { 
                  type: 'string', 
                  example: '5511999999999'
                },
                contact: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      fullName: { type: 'string', example: 'John Doe' },
                      wuid: { type: 'string', example: '5511888888888' },
                      phoneNumber: { type: 'string', example: '5511888888888' },
                      organization: { type: 'string', example: 'Company Inc' },
                      email: { type: 'string', example: 'john@company.com' }
                    },
                    required: ['fullName', 'phoneNumber']
                  },
                  description: 'Array of contacts to send'
                }
              },
              required: ['number', 'contact']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Contact message sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Message' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/message/sendReaction/{instanceName}': {
    post: {
      tags: ['Messaging'],
      summary: 'Send Reaction',
      description: 'Send an emoji reaction to a message',
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
                reactionMessage: {
                  type: 'object',
                  properties: {
                    key: { $ref: '#/components/schemas/MessageKey' },
                    text: { 
                      type: 'string', 
                      example: '👍',
                      description: 'Emoji reaction to send'
                    }
                  },
                  required: ['key', 'text']
                }
              },
              required: ['reactionMessage']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Reaction sent successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Message' }
                }
              }
            }
          }
        }
      }
    }
  }
}; 