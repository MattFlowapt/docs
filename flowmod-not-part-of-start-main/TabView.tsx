import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  MessageSquare, 
  UserRound, 
  Calendar, 
  FileText, 
  BarChart3, 
  Clock,
  Bot,
  Shield
} from "lucide-react";
import { ReactNode } from "react";

interface TabViewProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  groupsTab: ReactNode;
  messagesTab: ReactNode;
  interventionsTab: ReactNode;
  participantsTab: ReactNode;
  eventsTab: ReactNode;
  promptsTab: ReactNode;
  historyTab: ReactNode;
  analyticsTab: ReactNode;
  askFlowModTab: ReactNode;
}

export function TabView({ 
  activeTab, 
  setActiveTab, 
  groupsTab,
  messagesTab, 
  interventionsTab,
  participantsTab, 
  eventsTab,
  promptsTab,
  historyTab,
  analyticsTab,
  askFlowModTab
}: TabViewProps) {
  return (
    <Tabs 
      defaultValue={activeTab} 
      value={activeTab} 
      onValueChange={setActiveTab}
      className="w-full flex flex-col h-full"
    >
      <TabsList className="grid grid-cols-8 mb-0 w-full shrink-0 border-b rounded-none">
        <TabsTrigger value="groups" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <Users className="h-4 w-4" />
          <span>Groups</span>
        </TabsTrigger>
        <TabsTrigger value="messages" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <MessageSquare className="h-4 w-4" />
          <span>Messages</span>
        </TabsTrigger>
        <TabsTrigger value="interventions" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <Shield className="h-4 w-4" />
          <span>Interventions</span>
        </TabsTrigger>
        <TabsTrigger value="participants" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <UserRound className="h-4 w-4" />
          <span>Participants</span>
        </TabsTrigger>
        <TabsTrigger value="events" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <Calendar className="h-4 w-4" />
          <span>Events</span>
        </TabsTrigger>
        <TabsTrigger value="prompts" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <FileText className="h-4 w-4" />
          <span>Prompts</span>
        </TabsTrigger>
        <TabsTrigger value="analytics" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <BarChart3 className="h-4 w-4" />
          <span>Analytics</span>
        </TabsTrigger>
        <TabsTrigger value="ask" className="flex items-center gap-2 rounded-none data-[state=active]:rounded-none">
          <Bot className="h-4 w-4" />
          <span>Ask FlowMod</span>
        </TabsTrigger>
      </TabsList>
      
      <div className="flex-1 overflow-auto">
        <TabsContent value="groups" className="h-full m-0 pt-2">
          {groupsTab}
        </TabsContent>
        
        <TabsContent value="messages" className="h-full m-0 pt-2">
          {messagesTab}
        </TabsContent>
        
        <TabsContent value="interventions" className="h-full m-0 pt-2">
          {interventionsTab}
        </TabsContent>
        
        <TabsContent value="participants" className="h-full m-0 pt-2">
          {participantsTab}
        </TabsContent>
        
        <TabsContent value="events" className="h-full m-0 pt-2">
          {eventsTab}
        </TabsContent>
        
        <TabsContent value="prompts" className="h-full m-0 pt-2">
          {promptsTab}
        </TabsContent>
        
        <TabsContent value="analytics" className="h-full m-0 pt-2">
          {analyticsTab}
        </TabsContent>
        
        <TabsContent value="ask" className="h-full m-0 pt-2">
          {askFlowModTab}
        </TabsContent>
      </div>
    </Tabs>
  );
} 