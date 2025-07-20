import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Bot, RefreshCw, Send, MessageSquare, CheckCircle, Calendar, AlertTriangle, HelpCircle, Sparkles, Users } from "lucide-react";
import { MessageList } from "@/components/chat/MessageList";
import { MessageInput } from "@/components/chat/MessageInput";
import { useOrganization } from "@/context/OrganizationContext";
import { useAuth } from "@/context/AuthContext";
import { Message } from "@/types/chat";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays } from "date-fns";

interface AskFlowModTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

// Canned questions for quick access
const CANNED_QUESTIONS = [
  { text: "What were the main topics discussed?", icon: <MessageSquare className="h-2 w-2 mr-1" /> },
  { text: "Summarize key decisions made", icon: <CheckCircle className="h-2 w-2 mr-1" /> },
  { text: "What events were mentioned?", icon: <Calendar className="h-2 w-2 mr-1" /> },
  { text: "Show me any complaints or issues", icon: <AlertTriangle className="h-2 w-2 mr-1" /> },
  { text: "What questions were asked?", icon: <HelpCircle className="h-2 w-2 mr-1" /> },
  { text: "Analyze group sentiment and mood", icon: <Sparkles className="h-2 w-2 mr-1" /> },
];

// Timeframe options
const TIMEFRAME_OPTIONS = [
  { label: "Last 24 hours", value: "1d", days: 1 },
  { label: "Last 3 days", value: "3d", days: 3 },
  { label: "Last 7 days", value: "7d", days: 7 },
  { label: "Last 30 days", value: "30d", days: 30 },
  { label: "Last 90 days", value: "90d", days: 90 },
];

export function AskFlowModTab({ masterGroupId, isLoading }: AskFlowModTabProps) {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();
  
  // State
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [organizationMemberId, setOrganizationMemberId] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string>('');
  
  // Group and timeframe selection
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedTimeframe, setSelectedTimeframe] = useState('7d');
  const [groups, setGroups] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  // Session management
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hasSession, setHasSession] = useState(false);
  
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Fetch organization member ID and name
  useEffect(() => {
    if (user && currentOrganization) {
      fetchOrganizationMember();
    }
  }, [user, currentOrganization]);

  // Load groups when master group changes
  useEffect(() => {
    if (masterGroupId) {
      loadGroups();
    }
  }, [masterGroupId]);

  // Load existing session when component mounts
  useEffect(() => {
    if (organizationMemberId) {
      loadExistingSession();
    }
  }, [organizationMemberId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesContainerRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      });
    }
  }, [messages]);

  const fetchOrganizationMember = async () => {
    if (!user || !currentOrganization) return;
    
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          profiles!fk_organization_members_user_id (
            full_name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        console.error('Error getting organization member:', error);
        return;
      }
      
      if (data) {
        setOrganizationMemberId(data.id);
        setMemberName(data.profiles?.full_name || 'Unknown Member');
      }
    } catch (error) {
      console.error('Error fetching organization member:', error);
    }
  };

  const loadGroups = async () => {
    if (!masterGroupId || !currentOrganization) return;
    
    setLoadingGroups(true);
    try {
      const { data, error } = await supabase
        .from('flowmod_groups')
        .select('id, name')
        .eq('organization_id', currentOrganization.id)
        .eq('master_group_id', masterGroupId)
        .order('name');
      
      if (error) {
        console.error('Error loading groups:', error);
        toast.error('Failed to load groups');
        return;
      }
      
      setGroups(data || []);
    } catch (error) {
      console.error('Error loading groups:', error);
      toast.error('Failed to load groups');
    } finally {
      setLoadingGroups(false);
    }
  };

  const loadExistingSession = async () => {
    if (!organizationMemberId || !currentOrganization) return;
    
    try {
      const { data, error } = await supabase
        .from('flowmod_chat_sessions')
        .select('id, messages, group_id, timeframe_start, timeframe_end')
        .eq('organization_member_id', organizationMemberId)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        console.error('Error loading session:', error);
        return;
      }
      
      if (data) {
        setSessionId(data.id);
        setMessages(data.messages || []);
        setHasSession(true);
        
        // Set group and timeframe from session
        if (data.group_id) {
          setSelectedGroupId(data.group_id);
        } else {
          setSelectedGroupId('all');
        }
        
        // Calculate timeframe
        const start = new Date(data.timeframe_start);
        const end = new Date(data.timeframe_end);
        const diffDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        
        const timeframeOption = TIMEFRAME_OPTIONS.find(opt => opt.days === diffDays);
        if (timeframeOption) {
          setSelectedTimeframe(timeframeOption.value);
        }
      }
    } catch (error) {
      console.error('Error loading existing session:', error);
    }
  };

  const createOrUpdateSession = async (groupId: string | null, timeframeDays: number) => {
    if (!organizationMemberId || !currentOrganization) return null;
    
    const now = new Date();
    const timeframeStart = subDays(now, timeframeDays);
    const timeframeEnd = now;
    
    try {
      // Always upsert to ensure only one session per member
      const { data, error } = await supabase
        .from('flowmod_chat_sessions')
        .upsert({
          organization_member_id: organizationMemberId,
          organization_id: currentOrganization.id,
          group_id: groupId,
          master_group_id: groupId ? null : masterGroupId,
          timeframe_start: timeframeStart.toISOString(),
          timeframe_end: timeframeEnd.toISOString(),
          messages: [],
          name: memberName
        }, {
          onConflict: 'organization_member_id'
        })
        .select('id')
        .single();
      
      if (error) {
        console.error('Error creating/updating session:', error);
        return null;
      }
      
      return data.id;
    } catch (error) {
      console.error('Error creating/updating session:', error);
      return null;
    }
  };

  const sendMessage = async (messageToSend: string) => {
    if (!messageToSend.trim() || !organizationMemberId || !currentOrganization || isStreaming) {
      return;
    }

    try {
      setIsStreaming(true);
      
      // Get timeframe details
      const timeframeOption = TIMEFRAME_OPTIONS.find(opt => opt.value === selectedTimeframe);
      if (!timeframeOption) return;
      
      // Create or update session
      const currentSessionId = await createOrUpdateSession(
        selectedGroupId === 'all' ? null : selectedGroupId,
        timeframeOption.days
      );
      
      if (!currentSessionId) {
        toast.error('Failed to create session');
        return;
      }
      
      setSessionId(currentSessionId);
      setHasSession(true);
      
      // Create user message
      const userMessage: Message = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: messageToSend,
        created_at: new Date().toISOString()
      };
      
      // Add user message to UI
      setMessages(prev => [...prev, userMessage]);
      
      // Create assistant message placeholder
      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      };
      
      // Add assistant message to UI
      setMessages(prev => [...prev, assistantMessage]);
      
      // Call the edge function
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        throw new Error('Not authenticated');
      }
      
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      
      const response = await fetch(`${supabaseUrl}/functions/v1/flowmod-ask-assistant`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          message: messageToSend,
          organizationId: currentOrganization.id,
          organizationMemberId,
          sessionId: currentSessionId,
          groupId: selectedGroupId === 'all' ? null : selectedGroupId,
          masterGroupId: selectedGroupId === 'all' ? masterGroupId : null,
          timeframeDays: timeframeOption.days
        })
      });
      
      if (!response.body) {
        throw new Error('No response body');
      }
      
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let streamedContent = '';
      
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.type === 'chunk') {
                streamedContent += data.content;
                
                // Update UI with streamed content
                setMessages(prev => 
                  prev.map(msg => 
                    msg.id === assistantMessage.id
                      ? { ...msg, content: streamedContent }
                      : msg
                  )
                );
              } else if (data.type === 'error') {
                toast.error(`Error: ${data.message}`);
                console.error('Streaming error:', data.message);
              } else if (data.type === 'complete') {
                console.log('Streaming complete');
              }
            } catch (e) {
              console.error('Error parsing chunk:', e);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (messageText.trim()) {
      await sendMessage(messageText);
      setMessageText('');
    }
  };

  const handleCannedQuestion = async (questionText: string) => {
    if (isStreaming) return;
    
    setMessageText(questionText);
    await sendMessage(questionText);
    setMessageText('');
  };

  const handleResetSession = async () => {
    if (!organizationMemberId) return;
    
    try {
      // Delete the session
      const { error } = await supabase
        .from('flowmod_chat_sessions')
        .delete()
        .eq('organization_member_id', organizationMemberId);
      
      if (error) {
        console.error('Error resetting session:', error);
        toast.error('Failed to reset session');
        return;
      }
      
      // Clear UI state
      setMessages([]);
      setSessionId(null);
      setHasSession(false);
      
      toast.success('Session reset successfully');
    } catch (error) {
      console.error('Error resetting session:', error);
      toast.error('Failed to reset session');
    }
  };

  if (!masterGroupId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Select a Master Group</h3>
          <p className="text-muted-foreground">
            Please select a master group from the Groups tab to start asking questions about your group conversations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full p-4 space-y-4">
      {/* Configuration Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-indigo-500" />
            Ask FlowMod
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Group Selection */}
            <div className="space-y-2">
              <Label>Group</Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId} disabled={isStreaming}>
                <SelectTrigger>
                  <SelectValue placeholder="Select group" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Groups</SelectItem>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name || 'Unnamed Group'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Timeframe Selection */}
            <div className="space-y-2">
              <Label>Timeframe</Label>
              <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe} disabled={isStreaming}>
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  {TIMEFRAME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Reset Button */}
          {hasSession && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetSession}
                disabled={isStreaming}
                className="gap-2"
              >
                <RefreshCw className={cn("h-4 w-4", isStreaming && "animate-spin")} />
                Reset Session
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Interface */}
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div ref={messagesContainerRef} className="flex-1 overflow-auto p-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <Bot className="h-12 w-12 mb-4 text-indigo-500" />
                <h3 className="text-lg font-medium mb-2">Ask FlowMod</h3>
                <p className="text-muted-foreground mb-4 max-w-md">
                  Ask questions about your group conversations. I'll analyze messages from the selected timeframe and provide insights.
                </p>
                
                {/* Quick Start Questions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl">
                  {CANNED_QUESTIONS.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="justify-start text-left h-auto py-2 px-3"
                      onClick={() => handleCannedQuestion(question.text)}
                      disabled={isStreaming}
                    >
                      {question.icon}
                      <span className="text-xs">{question.text}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ) : (
              <MessageList messages={messages} isStreaming={isStreaming} />
            )}
          </div>
          
          {/* Canned Questions Row */}
          {messages.length > 0 && (
            <div className="border-t p-2">
              <ScrollArea className="w-full">
                <div className="flex space-x-2 pb-2">
                  {CANNED_QUESTIONS.map((question, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap flex items-center h-7 text-xs px-2"
                      onClick={() => handleCannedQuestion(question.text)}
                      disabled={isStreaming}
                    >
                      {question.icon}
                      <span className="text-xs">{question.text}</span>
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
          
          {/* Message Input */}
          <div className="border-t p-4">
            <MessageInput
              value={messageText}
              onChange={setMessageText}
              onSubmit={handleSendMessage}
              disabled={isStreaming}
              loading={isStreaming}
              placeholder="Ask about your group conversations..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 