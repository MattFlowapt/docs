export const groupManagementPaths = {
  '/group/create/{instanceName}': {
    post: {
      tags: ['Group Management'],
      summary: 'Create Group',
      description: 'Create a new WhatsApp group with participants',
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
                subject: { 
                  type: 'string', 
                  example: 'My New Group',
                  description: 'Group name/subject'
                },
                description: { 
                  type: 'string', 
                  example: 'This is a test group',
                  description: 'Group description'
                },
                participants: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['5511999999999', '5511888888888'],
                  description: 'Array of phone numbers to add as participants'
                },
                promoteParticipants: { 
                  type: 'boolean', 
                  default: false,
                  description: 'Whether to promote participants to admin'
                }
              },
              required: ['subject', 'participants']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Group created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: { $ref: '#/components/schemas/Group' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/group/fetchAllGroups/{instanceName}': {
    get: {
      tags: ['Group Management'],
      summary: 'List All Groups',
      description: 'Get all WhatsApp groups for this instance with optional participant details',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        },
        {
          name: 'getParticipants',
          in: 'query',
          schema: { type: 'boolean', default: false },
          description: 'Include participant details in response'
        }
      ],
      responses: {
        '200': {
          description: 'Groups retrieved successfully',
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
                        id: { 
                          type: 'string', 
                          example: '120363000000000000@g.us',
                          description: 'WhatsApp group ID'
                        },
                        subject: { 
                          type: 'string', 
                          example: 'My New Group',
                          description: 'Group name/subject'
                        },
                        size: { 
                          type: 'number', 
                          example: 3,
                          description: 'Number of participants'
                        },
                        owner: { 
                          type: 'string', 
                          example: '5511999999999@s.whatsapp.net',
                          description: 'Group owner JID'
                        },
                        participants: {
                          type: 'array',
                          description: 'Group participants (if getParticipants=true)',
                          items: {
                            type: 'object',
                            properties: {
                              id: { 
                                type: 'string', 
                                example: '5511999999999@s.whatsapp.net'
                              },
                              admin: { 
                                type: 'string', 
                                enum: ['superadmin', 'admin', null],
                                nullable: true,
                                description: 'Admin role in group'
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
      }
    }
  },
  '/group/findGroupInfos/{instanceName}': {
    get: {
      tags: ['Group Management'],
      summary: 'Get Group Information',
      description: 'Get detailed information about a specific group',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        },
        {
          name: 'groupJid',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'WhatsApp group JID',
          example: '120363000000000000@g.us'
        }
      ],
      responses: {
        '200': {
          description: 'Group information retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '120363000000000000@g.us' },
                  subject: { type: 'string', example: 'My New Group' },
                  subjectOwner: { type: 'string', example: '5511999999999@s.whatsapp.net' },
                  subjectTime: { type: 'number', example: 1698765432 },
                  creation: { type: 'number', example: 1698765432 },
                  owner: { type: 'string', example: '5511999999999@s.whatsapp.net' },
                  desc: { type: 'string', example: 'This is a test group' },
                  descId: { type: 'string', example: 'ABCDEF123456' },
                  participants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: '5511999999999@s.whatsapp.net' },
                        admin: { 
                          type: 'string', 
                          enum: ['superadmin', 'admin'],
                          nullable: true
                        }
                      }
                    }
                  },
                  size: { type: 'number', example: 2 },
                  announce: { type: 'boolean' },
                  restrict: { type: 'boolean' },
                  isCommunity: { type: 'boolean' },
                  linkedParent: { type: 'string', nullable: true }
                }
              }
            }
          }
        }
      }
    }
  },
  '/group/participants/{instanceName}': {
    get: {
      tags: ['Group Management'],
      summary: 'Get Group Participants',
      description: 'Get detailed participant list for a group',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        },
        {
          name: 'groupJid',
          in: 'query',
          required: true,
          schema: { type: 'string' },
          description: 'WhatsApp group JID',
          example: '120363000000000000@g.us'
        }
      ],
      responses: {
        '200': {
          description: 'Group participants retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  participants: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { 
                          type: 'string', 
                          example: '5511999999999@s.whatsapp.net'
                        },
                        admin: { 
                          type: 'string', 
                          enum: ['superadmin', 'admin'],
                          nullable: true,
                          description: 'Admin role in group'
                        },
                        name: { 
                          type: 'string', 
                          example: 'John Doe',
                          description: 'Display name'
                        },
                        imgUrl: { 
                          type: 'string', 
                          nullable: true,
                          description: 'Profile picture URL'
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
  '/group/updateParticipant/{instanceName}': {
    post: {
      tags: ['Group Management'],
      summary: 'Update Group Participants',
      description: 'Add, remove, promote, or demote group participants',
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
                groupJid: { 
                  type: 'string', 
                  example: '120363000000000000@g.us',
                  description: 'WhatsApp group JID'
                },
                action: { 
                  type: 'string', 
                  enum: ['add', 'remove', 'promote', 'demote'],
                  example: 'add',
                  description: 'Action to perform on participants'
                },
                participants: {
                  type: 'array',
                  items: { type: 'string' },
                  example: ['5511999999999', '5511888888888'],
                  description: 'Array of phone numbers to perform action on'
                }
              },
              required: ['groupJid', 'action', 'participants']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Participant update completed',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  status: { type: 'number', example: 201 },
                  error: { type: 'boolean', example: false },
                  response: {
                    type: 'object',
                    properties: {
                      updateParticipants: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            status: { 
                              type: 'string',
                              example: '200',
                              description: 'HTTP status code as string'
                            },
                            jid: { 
                              type: 'string',
                              example: '5511555555555@s.whatsapp.net',
                              description: 'Participant JID'
                            },
                            content: {
                              type: 'object',
                              properties: {
                                action: { type: 'string', example: 'add' },
                                participants: { 
                                  type: 'array', 
                                  items: { type: 'string' },
                                  example: ['5511555555555@s.whatsapp.net']
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
        }
      }
    }
  },
  '/group/updateGroupSubject/{instanceName}': {
    put: {
      tags: ['Group Management'],
      summary: 'Update Group Name',
      description: 'Change the name/subject of a group',
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
                groupJid: { 
                  type: 'string', 
                  example: '120363000000000000@g.us'
                },
                subject: { 
                  type: 'string', 
                  example: 'New Group Name',
                  description: 'New group name/subject'
                }
              },
              required: ['groupJid', 'subject']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Group subject updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  subject: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/group/updateGroupDescription/{instanceName}': {
    put: {
      tags: ['Group Management'],
      summary: 'Update Group Description',
      description: 'Change the description of a group',
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
                groupJid: { 
                  type: 'string', 
                  example: '120363000000000000@g.us'
                },
                description: { 
                  type: 'string', 
                  example: 'New group description',
                  description: 'New group description'
                }
              },
              required: ['groupJid', 'description']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Group description updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  },
  '/group/leaveGroup/{instanceName}': {
    post: {
      tags: ['Group Management'],
      summary: 'Leave Group',
      description: 'Leave a WhatsApp group',
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
                groupJid: { 
                  type: 'string', 
                  example: '120363000000000000@g.us'
                }
              },
              required: ['groupJid']
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Left group successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { type: 'string' },
                  left: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }
}; 