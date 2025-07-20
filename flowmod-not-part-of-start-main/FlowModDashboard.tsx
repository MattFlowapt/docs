import { useState, useEffect, useRef } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, MessageSquare, BarChart3, Clock, Maximize, Minimize, Monitor, Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { TabView } from "./TabView";
import { GroupsTab } from "./GroupsTab";
import { MessagesTab } from "./MessagesTab";
import { InterventionsTab } from "./InterventionsTab";
import { ParticipantsTab } from "./ParticipantsTab";
import { EventsTab } from "./EventsTab";
import { PromptsTab } from "./PromptsTab";
import { HistoryTab } from "./HistoryTab";
import { AnalyticsTab } from "./AnalyticsTab";
import { AskFlowModTab } from "./AskFlowModTab";
import { MasterGroupSelector } from "./MasterGroupSelector";

interface FlowModDashboardProps {
  onBack: () => void;
}

export function FlowModDashboard({ onBack }: FlowModDashboardProps) {
  const { currentOrganization } = useOrganization();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeTab, setActiveTab] = useState("groups");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMasterGroupId, setSelectedMasterGroupId] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAppFullscreen, setIsAppFullscreen] = useState(false);
  
  // Handler when a master group is selected
  const handleMasterGroupSelect = (masterGroupId: string) => {
    setSelectedMasterGroupId(masterGroupId);
    setActiveTab("messages");
  };

  // Handler for MasterGroupSelector
  const handleMasterGroupChange = (masterGroupId: string) => {
    setSelectedMasterGroupId(masterGroupId);
  };
  
  // Handler to view analytics
  const handleViewAnalytics = () => {
    if (selectedMasterGroupId) {
      setActiveTab("analytics");
    }
  };

  // App fullscreen handler (removes sidebar)
  const toggleAppFullscreen = () => {
    setIsAppFullscreen(!isAppFullscreen);
    
    // Add/remove class to body to hide sidebar
    if (!isAppFullscreen) {
      document.body.classList.add('app-fullscreen');
      // Hide the main app layout sidebar
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        (sidebar as HTMLElement).style.display = 'none';
      }
    } else {
      document.body.classList.remove('app-fullscreen');
      // Show the main app layout sidebar
      const sidebar = document.querySelector('[data-sidebar]');
      if (sidebar) {
        (sidebar as HTMLElement).style.display = '';
      }
    }
  };

  // Browser fullscreen handler
  const toggleBrowserFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!isFullscreen) {
        // Enter fullscreen
        if (containerRef.current.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if ((containerRef.current as any).webkitRequestFullscreen) {
          await (containerRef.current as any).webkitRequestFullscreen();
        } else if ((containerRef.current as any).msRequestFullscreen) {
          await (containerRef.current as any).msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if ((document as any).webkitExitFullscreen) {
          await (document as any).webkitExitFullscreen();
        } else if ((document as any).msExitFullscreen) {
          await (document as any).msExitFullscreen();
        }
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               (document as any).webkitFullscreenElement || 
                               (document as any).msFullscreenElement;
      setIsFullscreen(!!fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup app fullscreen state when component unmounts
      if (isAppFullscreen) {
        document.body.classList.remove('app-fullscreen');
        const sidebar = document.querySelector('[data-sidebar]');
        if (sidebar) {
          (sidebar as HTMLElement).style.display = '';
        }
      }
    };
  }, [isAppFullscreen]);

  // Main content render
  const renderContent = () => {
    return (
      <TabView 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        groupsTab={
          <GroupsTab 
            onMasterGroupSelect={handleMasterGroupSelect}
            isLoading={isLoading}
          />
        }
        messagesTab={
          <MessagesTab
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
        interventionsTab={
          <InterventionsTab
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
        participantsTab={
          <ParticipantsTab 
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
        eventsTab={
          <EventsTab 
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
        promptsTab={
          <PromptsTab 
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
        historyTab={
          <HistoryTab
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
        analyticsTab={
          <AnalyticsTab
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
        askFlowModTab={
          <AskFlowModTab
            masterGroupId={selectedMasterGroupId}
            isLoading={isLoading}
          />
        }
      />
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`w-full h-full flex flex-col ${isFullscreen ? 'bg-background' : ''} ${isAppFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}
    >
      {/* Header */}
      <div className="border-b">
        <div className="flex items-center justify-between py-4 px-4 md:px-6">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={onBack}
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
            
            {/* Master Group selector - only show outside of groups tab */}
            {activeTab !== "groups" && (
              <div className="ml-4">
                <MasterGroupSelector 
                  selectedMasterGroupId={selectedMasterGroupId} 
                  onMasterGroupChange={handleMasterGroupChange} 
                />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            {/* Fullscreen button with hover dropdown */}
            <div className="relative group">
              {/* Main fullscreen button - click for app fullscreen */}
              <Button
                variant="outline"
                size="icon"
                onClick={isFullscreen ? toggleBrowserFullscreen : toggleAppFullscreen}
                className="shrink-0"
                title={isFullscreen ? "Exit Whole Screen" : isAppFullscreen ? "Exit App Fullscreen" : "App Fullscreen"}
              >
                {isFullscreen || isAppFullscreen ? (
                  <Minimize className="h-4 w-4" />
                ) : (
                  <Maximize className="h-4 w-4" />
                )}
              </Button>
              
              {/* Hover dropdown for browser fullscreen */}
              <div className="absolute top-full right-0 mt-1 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="bg-background border border-border rounded-md shadow-lg py-1 min-w-[180px]">
                  <button
                    onClick={toggleBrowserFullscreen}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground flex items-center gap-2 whitespace-nowrap"
                  >
                    <Monitor className="h-4 w-4" />
                    {isFullscreen ? "Exit Whole Screen" : "Whole Screen"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
} 