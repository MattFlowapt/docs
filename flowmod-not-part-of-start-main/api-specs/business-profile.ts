export const businessProfilePaths = {
  '/business/fetchProfile/{instanceName}': {
    get: {
      tags: ['Business Profile'],
      summary: 'Get Business Profile',
      description: 'Retrieve business profile information for a WhatsApp Business number',
      parameters: [
        {
          name: 'instanceName',
          in: 'path',
          required: true,
          schema: { type: 'string' }
        },
        {
          name: 'number',
          in: 'query',
          schema: { type: 'string' },
          description: 'Phone number to get business profile for (optional - defaults to own profile)',
          example: '5511999999999'
        }
      ],
      responses: {
        '200': {
          description: 'Business profile retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  wuid: { 
                    type: 'string', 
                    example: '5511999999999@s.whatsapp.net',
                    description: 'WhatsApp User ID'
                  },
                  name: { 
                    type: 'string', 
                    example: 'Business Name',
                    description: 'Business display name'
                  },
                  numberExists: { 
                    type: 'boolean',
                    description: 'Whether the number exists on WhatsApp'
                  },
                  picture: { 
                    type: 'string', 
                    nullable: true,
                    description: 'Profile picture URL'
                  },
                  status: { 
                    type: 'string', 
                    example: 'Available',
                    description: 'WhatsApp status message'
                  },
                  isBusiness: { 
                    type: 'boolean',
                    description: 'Whether this is a business account'
                  },
                  email: { 
                    type: 'string', 
                    nullable: true,
                    example: 'business@example.com',
                    description: 'Business email address'
                  },
                  description: { 
                    type: 'string', 
                    nullable: true,
                    example: 'We are a great business!',
                    description: 'Business description'
                  },
                  website: { 
                    type: 'string', 
                    nullable: true,
                    example: 'https://business.com',
                    description: 'Business website URL'
                  },
                  category: { 
                    type: 'string', 
                    nullable: true,
                    example: 'Shopping & Retail',
                    description: 'Business category'
                  },
                  address: { 
                    type: 'string', 
                    nullable: true,
                    example: '123 Business St, City, Country',
                    description: 'Business address'
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  '/business/updateProfile/{instanceName}': {
    put: {
      tags: ['Business Profile'],
      summary: 'Update Business Profile',
      description: 'Update your business profile information',
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
                name: { 
                  type: 'string', 
                  example: 'My Business Name',
                  description: 'Business display name'
                },
                description: { 
                  type: 'string', 
                  example: 'We provide excellent services',
                  description: 'Business description'
                },
                email: { 
                  type: 'string', 
                  example: 'contact@business.com',
                  description: 'Business email address'
                },
                website: { 
                  type: 'string', 
                  example: 'https://mybusiness.com',
                  description: 'Business website URL'
                },
                category: { 
                  type: 'string', 
                  example: 'Shopping & Retail',
                  description: 'Business category'
                },
                address: { 
                  type: 'string', 
                  example: '123 Main St, City, Country',
                  description: 'Business address'
                }
              }
            }
          }
        }
      },
      responses: {
        '200': {
          description: 'Business profile updated successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  message: { 
                    type: 'string',
                    example: 'Business profile updated successfully'
                  },
                  updated: { type: 'boolean' }
                }
              }
            }
          }
        }
      }
    }
  }
}; 