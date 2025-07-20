import { instanceManagementPaths } from './instance-management';
import { messagingPaths } from './messaging';
import { chatOperationsPaths } from './chat-operations';
import { groupManagementPaths } from './group-management';
import { webhookManagementPaths } from './webhook-management';
import { businessProfilePaths } from './business-profile';
import { commonSchemas } from './schemas';

export const createOpenApiSpec = () => ({
  openapi: '3.0.0',
  info: {
    title: 'FlowMod WhatsApp API',
    version: '1.0.0',
    description: `Complete WhatsApp Web API integration for businesses and developers.

## Authentication
All endpoints require an API key in the header:
\`\`\`
apikey: YOUR_INSTANCE_API_KEY
\`\`\`

## Example API Call
\`\`\`bash
curl -X GET "https://api.flowmod.ai/instance/connectionState/FlowMod" \\
  -H "apikey: 6BABB66B4BF8-437A-8643-4D19B887F1FD" \\
  -H "Content-Type: application/json"
\`\`\`

**Response:**
\`\`\`json
{
  "instance": {
    "instanceName": "FlowMod",
    "state": "open"
  }
}
\`\`\``,
    contact: {
      name: 'FlowMod Support',
      email: 'dev@flowapt.com'
    }
  },
  servers: [
    {
      url: 'https://api.flowmod.ai',
      description: 'FlowMod Production API'
    }
  ],
  security: [
    {
      ApiKeyAuth: []
    }
  ],
  components: {
    securitySchemes: {
      ApiKeyAuth: {
        type: 'apiKey',
        in: 'header',
        name: 'apikey',
        description: 'Organization-specific API key for Evolution API access'
      }
    },
    schemas: commonSchemas
  },
  paths: {
    ...instanceManagementPaths,
    ...messagingPaths,
    ...chatOperationsPaths,
    ...groupManagementPaths,
    ...webhookManagementPaths,
    ...businessProfilePaths
  },
  tags: [
    {
      name: 'Instance Management',
      description: 'WhatsApp instance connection and status management'
    },
    {
      name: 'Messaging', 
      description: 'Send various types of WhatsApp messages'
    },
    {
      name: 'Chat Operations',
      description: 'Chat utilities, message management, and number validation'
    },
    {
      name: 'Group Management',
      description: 'Create and manage WhatsApp groups and participants'
    },
    {
      name: 'Webhook Management',
      description: 'Configure webhooks for real-time event notifications'
    },
    {
      name: 'Business Profile',
      description: 'Manage WhatsApp Business profile information'
    }
  ]
}); 