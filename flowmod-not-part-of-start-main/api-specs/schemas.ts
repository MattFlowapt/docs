export const commonSchemas = {
  MessageKey: {
    type: 'object',
    properties: {
      id: { 
        type: 'string',
        description: 'Unique message identifier'
      },
      fromMe: { 
        type: 'boolean',
        description: 'Whether message was sent by the instance'
      },
      remoteJid: { 
        type: 'string',
        description: 'WhatsApp JID of recipient/group'
      }
    },
    required: ['id', 'fromMe', 'remoteJid']
  },
  Message: {
    type: 'object',
    properties: {
      key: { $ref: '#/components/schemas/MessageKey' },
      message: { 
        type: 'object',
        description: 'Message content object'
      },
      messageTimestamp: { 
        type: 'number',
        description: 'Unix timestamp of message'
      },
      status: { 
        type: 'string', 
        enum: ['PENDING', 'SENT', 'RECEIVED', 'READ'],
        description: 'Message delivery status'
      },
      pushName: {
        type: 'string',
        description: 'Display name of sender'
      }
    }
  },
  Group: {
    type: 'object',
    properties: {
      id: { 
        type: 'string',
        description: 'WhatsApp group ID'
      },
      subject: { 
        type: 'string',
        description: 'Group name/subject'
      },
      owner: { 
        type: 'string',
        description: 'Group owner JID'
      },
      participants: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            admin: { 
              type: 'string', 
              enum: ['superadmin', 'admin'],
              nullable: true 
            }
          }
        }
      },
      desc: {
        type: 'string',
        description: 'Group description'
      },
      creation: {
        type: 'number',
        description: 'Group creation timestamp'
      },
      size: {
        type: 'number',
        description: 'Number of participants'
      }
    }
  },
  Instance: {
    type: 'object',
    properties: {
      instanceName: { 
        type: 'string', 
        example: 'my-instance',
        description: 'Unique instance identifier for the organization'
      },
      wuid: { 
        type: 'string', 
        example: '5511999999999@s.whatsapp.net',
        description: 'WhatsApp User ID'
      },
      profileName: { 
        type: 'string', 
        example: 'My WhatsApp',
        description: 'Display name for the WhatsApp instance'
      },
      profilePictureUrl: { 
        type: 'string', 
        nullable: true,
        description: 'URL to profile picture'
      },
      connectionStatus: { 
        type: 'string', 
        enum: ['open', 'connecting', 'close'],
        description: 'Current connection status'
      }
    }
  },
  Chat: {
    type: 'object',
    properties: {
      remoteJid: {
        type: 'string',
        description: 'WhatsApp JID of the chat'
      },
      name: {
        type: 'string',
        description: 'Display name of contact/group'
      },
      unreadMessages: {
        type: 'number',
        description: 'Number of unread messages'
      },
      lastMessage: {
        $ref: '#/components/schemas/Message'
      },
      isGroup: {
        type: 'boolean',
        description: 'Whether this is a group chat'
      }
    }
  },
  Contact: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'WhatsApp JID'
      },
      name: {
        type: 'string',
        description: 'Contact display name'
      },
      number: {
        type: 'string',
        description: 'Phone number'
      },
      profilePictureUrl: {
        type: 'string',
        nullable: true,
        description: 'Profile picture URL'
      }
    }
  },
  WebhookEvent: {
    type: 'object',
    properties: {
      event: {
        type: 'string',
        description: 'Event type'
      },
      instance: {
        type: 'string',
        description: 'Instance name'
      },
      data: {
        type: 'object',
        description: 'Event data payload'
      },
      destination: {
        type: 'string',
        description: 'Webhook URL'
      },
      date_time: {
        type: 'string',
        format: 'date-time',
        description: 'Event timestamp'
      }
    }
  }
}; 