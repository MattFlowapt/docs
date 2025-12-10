export const conversationApiSchemas = {
  ConversationMessage: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'The message content (may contain JSON for structured messages)',
        example: 'Hello! How can I help you today?'
      },
      sender_type: {
        type: 'string',
        enum: ['user-whatsapp', 'bot-whatsapp', 'human-whatsapp', 'system'],
        description: 'Type of sender',
        example: 'user-whatsapp'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Message timestamp',
        example: '2025-01-10T14:30:00Z'
      },
      message_status: {
        type: 'string',
        enum: ['sent', 'delivered', 'read', 'failed'],
        description: 'Message delivery status',
        example: 'read'
      },
      media_type: {
        type: 'string',
        nullable: true,
        enum: ['image', 'video', 'audio', 'document', 'interactive', null],
        description: 'Type of media attachment',
        example: 'image'
      },
      media_url: {
        type: 'string',
        nullable: true,
        description: 'URL to media file if applicable',
        example: 'https://example.com/image.jpg'
      },
      assignee: {
        type: 'string',
        nullable: true,
        description: 'Assigned team member UUID',
        example: null
      },
      voice_note_transcription: {
        type: 'string',
        nullable: true,
        description: 'Transcription of voice messages',
        example: null
      },
      reactions: {
        type: 'array',
        items: {
          type: 'object'
        },
        description: 'Message reactions',
        example: []
      }
    },
    required: ['message', 'sender_type', 'created_at', 'message_status']
  },
  Contact: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        format: 'uuid',
        description: 'Contact unique identifier',
        example: 'contact-uuid'
      },
      full_name: {
        type: 'string',
        nullable: true,
        description: 'Contact full name',
        example: 'John Doe'
      },
      whatsapp_id: {
        type: 'string',
        description: 'WhatsApp number (normalized)',
        example: '27123456789'
      },
      phone_number: {
        type: 'string',
        nullable: true,
        description: 'Original phone number format',
        example: '+27 12 345 6789'
      },
      email: {
        type: 'string',
        nullable: true,
        format: 'email',
        description: 'Contact email address',
        example: 'john@example.com'
      },
      created_at: {
        type: 'string',
        format: 'date-time',
        description: 'Contact creation timestamp',
        example: '2025-01-10T14:30:00Z'
      },
      tags: {
        type: 'array',
        items: {
          type: 'string'
        },
        nullable: true,
        description: 'Contact tags',
        example: ['customer', 'premium']
      },
      has_unread_messages: {
        type: 'boolean',
        description: 'Whether contact has unread messages',
        example: false
      },
      bot_status: {
        type: 'string',
        nullable: true,
        enum: ['active', 'paused', null],
        description: 'Bot interaction status',
        example: 'active'
      },
      archived: {
        type: 'boolean',
        nullable: true,
        description: 'Whether contact is archived',
        example: false
      }
    },
    required: ['id', 'whatsapp_id', 'created_at', 'has_unread_messages']
  },
  Pagination: {
    type: 'object',
    properties: {
      currentPage: {
        type: 'integer',
        minimum: 1,
        description: 'Current page number',
        example: 1
      },
      totalPages: {
        type: 'integer',
        minimum: 0,
        description: 'Total number of pages',
        example: 5
      },
      totalMessages: {
        type: 'integer',
        minimum: 0,
        description: 'Total number of messages (for message endpoints)',
        example: 48
      },
      totalContacts: {
        type: 'integer',
        minimum: 0,
        description: 'Total number of contacts (for contacts endpoint)',
        example: 150
      },
      messagesPerPage: {
        type: 'integer',
        minimum: 1,
        description: 'Number of messages per page',
        example: 10
      },
      contactsPerPage: {
        type: 'integer',
        minimum: 1,
        description: 'Number of contacts per page',
        example: 50
      },
      hasNextPage: {
        type: 'boolean',
        description: 'Whether there is a next page',
        example: true
      },
      hasPrevPage: {
        type: 'boolean',
        description: 'Whether there is a previous page',
        example: false
      }
    },
    required: ['currentPage', 'totalPages', 'hasNextPage', 'hasPrevPage']
  },
  ConversationResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the request was successful',
        example: true
      },
      messages: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/ConversationMessage'
        },
        description: 'Array of conversation messages'
      },
      pagination: {
        $ref: '#/components/schemas/Pagination'
      },
      count: {
        type: 'integer',
        minimum: 0,
        description: 'Number of messages returned in this response',
        example: 10
      },
      searchTerms: {
        type: 'array',
        items: {
          type: 'string'
        },
        nullable: true,
        description: 'Search terms that were applied (if any)',
        example: ['#4275', 'urgent']
      },
      filtered: {
        type: 'boolean',
        description: 'Whether search filtering was applied',
        example: true
      },
      stored: {
        type: 'boolean',
        description: 'Whether messages were stored in contact record',
        example: false
      }
    },
    required: ['success', 'messages', 'count', 'filtered']
  },
  ContactsResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the request was successful',
        example: true
      },
      contacts: {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Contact'
        },
        description: 'Array of contacts'
      },
      pagination: {
        $ref: '#/components/schemas/Pagination'
      },
      count: {
        type: 'integer',
        minimum: 0,
        description: 'Number of contacts returned in this response',
        example: 50
      }
    },
    required: ['success', 'contacts', 'pagination', 'count']
  },
  FindContactResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the request was successful',
        example: true
      },
      contact: {
        $ref: '#/components/schemas/Contact'
      },
      original_phone: {
        type: 'string',
        description: 'Original phone number provided',
        example: '27123456789'
      },
      normalized_phone: {
        type: 'string',
        description: 'Normalized phone number used for lookup',
        example: '27123456789'
      }
    },
    required: ['success', 'contact', 'original_phone', 'normalized_phone']
  },
  ErrorResponse: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean',
        description: 'Whether the request was successful',
        example: false
      },
      error: {
        type: 'string',
        description: 'Error message',
        example: 'Tenant ID is required'
      },
      message: {
        type: 'string',
        description: 'Detailed error message',
        example: 'Please provide tenantId query parameter'
      },
      details: {
        type: 'string',
        description: 'Additional error details (optional)',
        example: 'Shopify order not found'
      }
    },
    required: ['success', 'error']
  }
};

export const conversationApiPaths = {
  '/conversations': {
    get: {
      tags: ['Conversations'],
      summary: 'Get conversation messages',
      description: `Retrieve messages from a conversation with comprehensive filtering and search capabilities.

## Default Behavior
- **Action**: Defaults to \`conversation-messages\` if not specified
- **Order**: Returns newest messages first (\`ascending=false\`)
- **Limit**: Returns 10 messages per page by default
- **Page**: Starts at page 1

## Search Capabilities
- **Text Search**: Use \`query\` parameter with comma-separated terms
- **Order Search**: Use \`orderId\` to search by Shopify order ID
- **Combined Search**: Use both \`query\` and \`orderId\` together

## Examples

### Basic Usage
\`\`\`bash
GET /conversations?tenantId=YOUR_TENANT_ID&whatsappNumber=YOUR_PHONE_NUMBER
\`\`\`

### Search by Order ID
\`\`\`bash
GET /conversations?tenantId=YOUR_TENANT_ID&whatsappNumber=YOUR_PHONE_NUMBER&orderId=YOUR_ORDER_ID
\`\`\`

### Text Search
\`\`\`bash
GET /conversations?tenantId=YOUR_TENANT_ID&whatsappNumber=YOUR_PHONE_NUMBER&query=urgent,help
\`\`\`

### Get Contacts
\`\`\`bash
GET /conversations?action=contacts&tenantId=YOUR_TENANT_ID&limit=25&search=john
\`\`\``,
      parameters: [
        {
          name: 'tenantId',
          in: 'query',
          required: true,
          schema: {
            type: 'string'
          },
          description: 'Organization tenant identifier',
          example: 'your-org-tenant-id'
        },
        {
          name: 'action',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            enum: ['conversation-messages', 'contacts', 'find-by-phone'],
            default: 'conversation-messages'
          },
          description: 'API action to perform',
          example: 'conversation-messages'
        },
        {
          name: 'whatsappNumber',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'WhatsApp phone number (required for message and find-by-phone actions)',
          example: '27123456789'
        },
        {
          name: 'contactId',
          in: 'query',
          required: false,
          schema: {
            type: 'string',
            format: 'uuid'
          },
          description: 'Contact UUID (alternative to whatsappNumber)',
          example: 'contact-uuid'
        },
        {
          name: 'limit',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Number of items per page (messages: default 10, contacts: default 50)',
          example: 20
        },
        {
          name: 'page',
          in: 'query',
          required: false,
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination',
          example: 1
        },
        {
          name: 'query',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'Search terms (comma-separated for multiple terms)',
          example: 'urgent,help,order'
        },
        {
          name: 'orderId',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'Shopify order ID to search for (fetches order number from Shopify)',
          example: '1234567890'
        },
        {
          name: 'ascending',
          in: 'query',
          required: false,
          schema: {
            type: 'boolean',
            default: false
          },
          description: 'Message order (false = newest first, true = oldest first)',
          example: false
        },
        {
          name: 'search',
          in: 'query',
          required: false,
          schema: {
            type: 'string'
          },
          description: 'Search contacts by name/phone (for contacts action)',
          example: 'john'
        }
      ],
      responses: {
        '200': {
          description: 'Successful response',
          content: {
            'application/json': {
              schema: {
                oneOf: [
                  { $ref: '#/components/schemas/ConversationResponse' },
                  { $ref: '#/components/schemas/ContactsResponse' },
                  { $ref: '#/components/schemas/FindContactResponse' }
                ]
              },
              examples: {
                'conversation-messages': {
                  summary: 'Conversation Messages',
                  value: {
                    success: true,
                    messages: [
                      {
                        message: 'Hello! How can I help you today?',
                        sender_type: 'bot-whatsapp',
                        created_at: '2025-01-10T14:30:00Z',
                        message_status: 'read',
                        media_type: null,
                        media_url: null,
                        assignee: null,
                        voice_note_transcription: null,
                        reactions: []
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 5,
                      totalMessages: 48,
                      messagesPerPage: 10,
                      hasNextPage: true,
                      hasPrevPage: false
                    },
                    count: 1,
                    searchTerms: null,
                    filtered: false,
                    stored: false
                  }
                },
                'order-search': {
                  summary: 'Order Search Results',
                  value: {
                    success: true,
                    messages: [
                      {
                        message: '{"header": "Order #1001 Status Update", "body": "Your order has been shipped!", "buttons": ["Track Order", "Reorder"]}',
                        sender_type: 'bot-whatsapp',
                        created_at: '2025-01-10T14:30:00Z',
                        message_status: 'read',
                        media_type: null,
                        media_url: null,
                        assignee: null,
                        voice_note_transcription: null,
                        reactions: []
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 1,
                      totalMessages: 5,
                      messagesPerPage: 10,
                      hasNextPage: false,
                      hasPrevPage: false
                    },
                    count: 5,
                    searchTerms: ['#1001'],
                    filtered: true,
                    stored: false
                  }
                },
                contacts: {
                  summary: 'Contacts List',
                  value: {
                    success: true,
                    contacts: [
                      {
                        id: 'contact-uuid',
                        full_name: 'John Doe',
                        whatsapp_id: '27123456789',
                        phone_number: '+27 12 345 6789',
                        email: 'john@example.com',
                        created_at: '2025-01-10T14:30:00Z',
                        tags: ['customer'],
                        has_unread_messages: false,
                        bot_status: 'active',
                        archived: false
                      }
                    ],
                    pagination: {
                      currentPage: 1,
                      totalPages: 3,
                      totalContacts: 150,
                      contactsPerPage: 50,
                      hasNextPage: true,
                      hasPrevPage: false
                    },
                    count: 50
                  }
                },
                'find-contact': {
                  summary: 'Find Contact by Phone',
                  value: {
                    success: true,
                    contact: {
                      id: '123e4567-e89b-12d3-a456-426614174000',
                      full_name: 'John Doe',
                      whatsapp_id: '27123456789',
                      phone_number: '+27 12 345 6789',
                      email: 'john@example.com',
                      created_at: '2025-01-10T14:30:00Z',
                      tags: ['customer'],
                      has_unread_messages: false,
                      bot_status: 'active',
                      archived: false
                    },
                    original_phone: '27123456789',
                    normalized_phone: '27123456789'
                  }
                }
              }
            }
          }
        },
        '400': {
          description: 'Bad Request - Invalid parameters',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                'missing-tenantId': {
                  summary: 'Missing Tenant ID',
                  value: {
                    success: false,
                    error: 'Tenant ID is required',
                    message: 'Please provide tenantId query parameter'
                  }
                },
                'invalid-action': {
                  summary: 'Invalid Action',
                  value: {
                    success: false,
                    error: 'Invalid action',
                    message: 'Use: conversation-messages, contacts, or find-by-phone'
                  }
                }
              }
            }
          }
        },
        '401': {
          description: 'Unauthorized - Invalid or missing authentication',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                'missing-auth': {
                  summary: 'Missing Authorization',
                  value: {
                    success: false,
                    error: 'Authorization required',
                    message: 'Please provide Authorization bearer token'
                  }
                },
                'auth-mismatch': {
                  summary: 'Authentication Mismatch',
                  value: {
                    success: false,
                    error: 'Authentication mismatch',
                    message: 'Bearer token does not match the provided tenantId'
                  }
                }
              }
            }
          }
        },
        '404': {
          description: 'Not Found - Organization, contact, or order not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              examples: {
                'org-not-found': {
                  summary: 'Organization Not Found',
                  value: {
                    success: false,
                    error: 'Organization not found',
                    message: 'No organization found with tenantId: YOUR_TENANT_ID'
                  }
                },
                'contact-not-found': {
                  summary: 'Contact Not Found',
                  value: {
                    success: false,
                    error: 'Contact not found for the provided phone number',
                    normalized_phone: '27123456789'
                  }
                },
                'order-not-found': {
                  summary: 'Shopify Order Not Found',
                  value: {
                    success: false,
                    error: 'Shopify order not found',
                    orderId: '1234567890'
                  }
                }
              }
            }
          }
        },
        '500': {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/ErrorResponse'
              },
              example: {
                success: false,
                error: 'Internal server error'
              }
            }
          }
        }
      },
      security: [
        {
          BearerAuth: []
        }
      ]
    }
  }
};

export const createConversationsApiSpec = () => ({
  openapi: '3.0.0',
  info: {
    title: '',
    version: '',
    description: ''
  },
  servers: [
    {
      url: 'https://api.flowiq.live',
      description: 'FlowIQ Production API'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        description: 'Bearer token for authentication. Format: `Bearer YOUR_BEARER_TOKEN`',
        bearerFormat: 'Bearer'
      }
    },
    schemas: conversationApiSchemas
  },
  paths: conversationApiPaths,
  tags: [
    {
      name: 'Conversations',
description: 'Conversation and contact management API endpoints'
    }
  ]
});
