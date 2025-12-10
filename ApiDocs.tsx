import React, { useState } from 'react';
import { Copy, Check, ExternalLink, Code, Book, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { createConversationsApiSpec } from '@/components/docs/conversations-api-specs';

export default function ApiDocs() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = async (text: string, identifier: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(identifier);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  // Generate the complete OpenAPI specification
  const openApiSpec = createConversationsApiSpec();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-sm flex items-center justify-center flex-shrink-0 p-1 shadow-sm border border-gray-200">
                  <img 
                    src="/original_logo.png" 
                    alt="Logo" 
                    className="w-9 h-9 object-contain"
                  />
                </div>
                <div className="font-semibold font-gothic text-2xl text-slate-800 dark:text-white">
                  flowIQ API Docs
                </div>
              </div>
              <p className="mt-0.5 text-gray-600 dark:text-gray-300">
                Still in the works :)
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                v1.0.0
              </Badge>
              <Badge variant="outline">
                REST API
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        

        {/* Authentication Info */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Authentication & Setup</CardTitle>
            <CardDescription>
              How to authenticate with the FlowIQ API and make your first call. Currently featuring Conversations API endpoints.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Required Headers</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md font-mono text-sm">
                  <div className="text-gray-600 dark:text-gray-400">Authorization: Bearer <span className="text-blue-600 dark:text-blue-400">YOUR_BEARER_TOKEN</span></div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Replace <code className="bg-gray-100 dark:bg-gray-700 px-1 py-0.5 rounded text-xs">YOUR_BEARER_TOKEN</code> with your actual bearer token from FlowIQ dashboard.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Base URL</h4>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md font-mono text-sm flex items-center justify-between">
                  <span className="text-gray-800 dark:text-gray-200">https://api.flowiq.live</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={() => copyToClipboard('https://api.flowiq.live', 'baseUrl')}
                  >
                    {copiedText === 'baseUrl' ? 
                      <Check className="h-3 w-3 text-green-600" /> : 
                      <Copy className="h-3 w-3" />
                    }
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Complete Example</h4>
              <div className="bg-gray-900 text-green-400 p-4 rounded-md font-mono text-sm overflow-x-auto">
                <div className="whitespace-nowrap">
                  <span className="text-gray-400"># Get messages for a contact</span><br/>
                  <span className="text-blue-400">curl</span> <span className="text-yellow-300">"https://api.flowiq.live/conversations?tenantId=YOUR_TENANT_ID&whatsappNumber=YOUR_PHONE_NUMBER&limit=10"</span> \<br/>
                  <span className="ml-2 text-purple-400">-H</span> <span className="text-yellow-300">"Authorization: Bearer YOUR_BEARER_TOKEN"</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-2 right-2 text-white hover:text-gray-300"
                  onClick={() => copyToClipboard(
                    'curl "https://api.flowiq.live/conversations?tenantId=YOUR_TENANT_ID&whatsappNumber=YOUR_PHONE_NUMBER&limit=10" -H "Authorization: Bearer YOUR_BEARER_TOKEN"',
                    'example'
                  )}
                >
                  {copiedText === 'example' ? 
                    <Check className="h-4 w-4" /> : 
                    <Copy className="h-4 w-4" />
                  }
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Reference Section */}
        <Card>
          <CardHeader>
            <CardTitle>API Reference</CardTitle>
            <CardDescription>
              Interactive API documentation with live testing capability. Currently featuring the Conversations API.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="bg-white dark:bg-gray-900 rounded-b-lg overflow-hidden">
              <style>
                {`
                  .swagger-ui .info .title,
                  .swagger-ui .info hgroup.main .title,
                  .swagger-ui .info h1,
                  .swagger-ui .info .version,
                  .swagger-ui .info .main {
                    display: none !important;
                  }
                  
                  .swagger-ui .wrapper {
                    padding-top: 0 !important;
                    padding-bottom: 0 !important;
                  }
                  
                  .swagger-ui .scheme-container,
                  .swagger-ui .topbar,
                  .swagger-ui .global-server-container {
                    margin-top: 0 !important;
                    padding-top: 0 !important;
                  }
                  
                  .swagger-ui .info {
                    margin-top: 0 !important;
                    margin-bottom: 0 !important;
                    padding-top: 0 !important;
                    padding-bottom: 0 !important;
                  }
                `}
              </style>
              <SwaggerUI
                spec={openApiSpec}
                tryItOutEnabled={true}
                displayRequestDuration={true}
                displayOperationId={false}
                defaultModelsExpandDepth={1}
                defaultModelExpandDepth={1}
                filter={true}
                showExtensions={false}
                showCommonExtensions={false}
                supportedSubmitMethods={['get']}
                validatorUrl={null}
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
                defaultModelRendering="example"
                showMutatedRequest={false}
                showRequestHeaders={true}
                deepLinking={true}
                persistAuthorization={false}
                presets={[
                  SwaggerUI.presets.standalone
                ]}
                requestInterceptor={(request) => {
                  // Add any global request modifications here if needed
                  return request;
                }}
                responseInterceptor={(response) => {
                  // Add any global response modifications here if needed
                  return response;
                }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 py-8 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
            <div className="text-center sm:text-left">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                FlowIQ API v1.0.0
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Work in progress API docs
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="mailto:matt@flowapt.com"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                Contact Matt
              </a>
              <a
                href="https://flowiq.live"
                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ExternalLink className="h-4 w-4 mr-1" />
                FlowIQ Platform
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
