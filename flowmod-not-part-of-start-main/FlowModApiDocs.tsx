import { useState } from 'react';
import { Check, Copy, Key, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useOrganization } from '@/context/OrganizationContext';
import { createOpenApiSpec } from './api-specs';

interface FlowModApiDocsProps {
  onBack?: () => void;
}

export function FlowModApiDocs({ onBack }: FlowModApiDocsProps) {
  const { currentOrganization } = useOrganization();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const apiKey = currentOrganization?.whatsapp_bearer_token;
  const instanceName = currentOrganization?.whatsapp_organization_id;

  const copyToClipboard = async (text: string, field: string) => {
    if (!text) return;
    
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Generate the complete OpenAPI specification
  const openApiSpec = createOpenApiSpec();

  return (
    <div className="h-full flex flex-col">


      {/* API Credentials Section */}
      <div className="px-6 py-3 bg-slate-50 dark:bg-slate-900 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">FlowMod API Documentation</span>
          <div className="flex items-center space-x-4">
            
            {/* API Key */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <Key className="h-3 w-3 text-blue-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">API Key:</span>
              </div>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                {apiKey ? `${apiKey.substring(0, 6)}...${apiKey.substring(apiKey.length - 3)}` : 'Not set'}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(apiKey, 'apiKey')}
                disabled={!apiKey}
                className="h-6 w-6 p-0"
              >
                {copiedField === 'apiKey' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

            {/* Instance Name */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                <User className="h-3 w-3 text-green-600" />
                <span className="text-xs text-gray-600 dark:text-gray-400">Instance:</span>
              </div>
              <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono text-gray-700 dark:text-gray-300">
                {instanceName || 'Not set'}
              </code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => copyToClipboard(instanceName, 'instanceName')}
                disabled={!instanceName}
                className="h-6 w-6 p-0"
              >
                {copiedField === 'instanceName' ? (
                  <Check className="h-3 w-3 text-green-600" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
              </Button>
            </div>

          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="flex-1 overflow-auto">
        <SwaggerUI
          spec={openApiSpec}
          tryItOutEnabled={true}
          displayRequestDuration={true}
          displayOperationId={true}
          defaultModelsExpandDepth={2}
          defaultModelExpandDepth={2}
          filter={true}
          showExtensions={true}
          showCommonExtensions={true}
          supportedSubmitMethods={['get', 'post', 'put', 'delete', 'patch']}
          validatorUrl={null}
          requestInterceptor={(request) => {
            // Auto-inject API key for testing
            if (apiKey) {
              request.headers.apikey = apiKey;
            }
            return request;
          }}
          plugins={[
            {
              statePlugins: {
                spec: {
                  wrapSelectors: {
                    allowTryItOutFor: () => () => true
                  }
                }
              }
            }
          ]}
          layout="BaseLayout"
          docExpansion="list"
          defaultModelRendering="model"
          showMutatedRequest={true}
          showRequestHeaders={true}
          deepLinking={true}
          persistAuthorization={true}
          presets={[
            SwaggerUI.presets.standalone
          ]}
        />
      </div>
    </div>
  );
} 