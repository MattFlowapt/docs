import React, { useState } from 'react';
import { FlowModDashboard } from '@/components/integrations/flowmod/FlowModDashboard';
import { FlowModApiConsole } from '@/components/integrations/flowmod/FlowModApiConsole';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Code2, Settings, BookOpen } from 'lucide-react';

interface FlowModIntegrationProps {
  standalone?: boolean;
}

type FlowModView = 'selection' | 'group-moderation' | 'api-console';

/**
 * Main FlowMod Integration with selection screen
 */
export function FlowModIntegration({ standalone = true }: FlowModIntegrationProps) {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState<FlowModView>('selection');
  
  const handleBack = () => {
    if (currentView === 'selection') {
      navigate('/integrations');
    } else {
      setCurrentView('selection');
    }
  };

  // Selection Screen
  if (currentView === 'selection') {
    return (
      <div className="w-full h-full flex flex-col">
        {/* Header */}
        <div className="border-b">
          <div className="flex items-center justify-between py-4 px-4 md:px-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handleBack}
                className="shrink-0"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center">
                <h1 className="text-3xl font-semibold font-gothic flex items-baseline">
                  FlowMod 
                  <span className="flex ml-1 items-baseline">
                    <sup className="text-xs font-medium bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-pink-500 mr-0.5">by</sup>
                    <span className="text-lg">flowapt</span>
                  </span>
                </h1>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Selection Cards */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full">
            
            {/* Group Moderation Card */}
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-purple-200"
                  onClick={() => setCurrentView('group-moderation')}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                  <Users className="h-8 w-8 text-purple-600" />
                </div>
                <CardTitle className="text-2xl">Group Moderation</CardTitle>
                <CardDescription className="text-base">
                  Manage and moderate your WhatsApp groups, participants, and conversations
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li>• Monitor group conversations</li>
                  <li>• Manage participants and interventions</li>
                  <li>• View analytics and insights</li>
                  <li>• AI-powered moderation tools</li>
                </ul>
                <Button className="w-full" size="lg">
                  <Settings className="h-4 w-4 mr-2" />
                  Open Group Moderation
                </Button>
              </CardContent>
            </Card>

            {/* API Console Card */}
            <Card className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-blue-200"
                  onClick={() => setCurrentView('api-console')}>
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
                  <Code2 className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">API Console</CardTitle>
                <CardDescription className="text-base">
                  Test and explore the FlowMod API with interactive documentation
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center">
                <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                  <li>• Interactive API testing</li>
                  <li>• Complete API documentation</li>
                  <li>• Authentication examples</li>
                  <li>• Code samples and SDKs</li>
                </ul>
                <Button className="w-full" size="lg" variant="outline">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Open API Console
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Group Moderation View
  if (currentView === 'group-moderation') {
    return <FlowModDashboard onBack={handleBack} />;
  }

  // API Console View
  if (currentView === 'api-console') {
    return <FlowModApiConsole onBack={handleBack} />;
  }

  return null;
}

export default FlowModIntegration;

export { FlowModDashboard } from './FlowModDashboard'; 