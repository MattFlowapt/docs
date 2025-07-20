export const chatOperationsPaths = {
  '/chat/findChats/{instanceName}': {
    post: {
      tags: ['Chat Operations'],
      summary: 'Get All Chats',
      description: 'Retrieve all WhatsApp conversations/chats with last message and unread count',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' },
          description: 'WhatsApp instance identifier'
        }
      ],
      requestBody: {
        required: false,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                limit: { 
                  type: 'number', 
                  default: 50,
                  description: 'Maximum number of chats to return'
                },
                offset: { 
                  type: 'number', 
                  default: 0,
                  description: 'Number of chats to skip'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Chats retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { 
                      type: 'string', 
                      nullable: true,
                      description: 'Chat ID (may be null)'
                    },
                    lastMessage: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', description: 'Message ID' },
                        key: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            fromMe: { type: 'boolean' },
                            remoteJid: { type: 'string', example: '5511999999999@s.whatsapp.net' }
                          }
                        },
                        pushName: { type: 'string', example: 'John Doe' },
                        messageType: { type: 'string', example: 'conversation' },
                        message: {
                          type: 'object',
                          properties: {
                            conversation: { type: 'string', example: 'Hello there!' }
                          }
                        },
                        messageTimestamp: { type: 'number', example: 1698765432 },
                        instanceId: { type: 'string' },
                        source: { type: 'string', example: 'unknown' },
                        status: { type: 'string', example: 'PENDING' }
                      }
                    },
                    unreadCount: { 
                      type: 'number', 
                      example: 0,
                      description: 'Number of unread messages'
                    },
                    isSaved: { 
                      type: 'boolean', 
                      description: 'Whether chat is saved'
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
  '/chat/findMessages/{instanceName}': {
    post: {
      tags: ['Chat Operations'],
      summary: 'Get Chat Messages',
      description: 'Retrieve messages from a specific chat/conversation',
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
                remoteJid: {
                  type: 'string',
                  example: '5511999999999@s.whatsapp.net',
                  description: 'WhatsApp JID of the chat to get messages from'
                },
                limit: {
                  type: 'number',
                  default: 20,
                  description: 'Number of messages to retrieve'
                },
                before: {
                  type: 'string',
                  description: 'Message ID to get messages before (pagination)'
                }
              },
              required: ['remoteJid']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Messages retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  messages: {
                    type: 'object',
                    properties: {
                      total: { type: 'number', example: 882 },
                      pages: { type: 'number', example: 18 },
                      currentPage: { type: 'number', example: 1 },
                      records: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/Message' }
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
  '/chat/markMessageAsRead/{instanceName}': {
    post: {
      tags: ['Chat Operations'],
      summary: 'Mark Messages as Read',
      description: 'Mark one or more messages as read',
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
                readMessages: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/MessageKey' },
                  description: 'Array of message keys to mark as read'
                }
              },
              required: ['readMessages']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Messages marked as read',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  read: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/chat/whatsappNumbers/{instanceName}': {
    post: {
      tags: ['Chat Operations'],
      summary: 'Check WhatsApp Numbers',
      description: 'Verify which phone numbers are registered on WhatsApp',
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
                numbers: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['5511999999999', '5511888888888'],
                  description: 'Array of phone numbers to check'
                }
              },
              required: ['numbers']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Number validation results',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    jid: { 
                      type: 'string', 
                      description: 'WhatsApp JID' 
                    },
                    exists: { 
                      type: 'boolean', 
                      description: 'Whether number exists on WhatsApp' 
                    },
                    number: { 
                      type: 'string', 
                      description: 'Original phone number'
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
  '/chat/deleteMessageForEveryone/{instanceName}': {
    delete: {
      tags: ['Chat Operations'],
      summary: 'Delete Message For Everyone',
      description: 'Delete a message for everyone (must be within time limit)',
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
                key: { $ref: '#/components/schemas/MessageKey' }
              },
              required: ['key']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Message deleted successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  deleted: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }
}; 