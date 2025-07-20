import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { MessageSquare, User, Bot, Clock, Filter, Search, Shield, Info, Eye, CornerDownRight, Lock, Users, AlertTriangle, Heart, Megaphone, Ban, Repeat, Zap, FileX, HelpCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type MessageType = {
  id: string;
  organization_id: string;
  message: string;
  sender_type: string;
  created_at: string;
  updated_at: string;
  participant_id: string | null;
  group_id: string | null;
  intervened: boolean | null;
  intervened_message_id: string | null;
  intervention_type: string | null;
  intervention_responses?: MessageType[];
  participant?: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
  };
  group?: {
    id: string;
    name: string | null;
  };
};

type GroupType = {
  id: string;
  name: string | null;
  master_group_id: string | null;
};

interface MessagesTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

export function MessagesTab({ masterGroupId, isLoading }: MessagesTabProps) {
  const { currentOrganization } = useOrganization();
  const [messages, setMessages] = useState<MessageType[]>([]);
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [senderFilter, setSenderFilter] = useState<string>("all");
  const [selectedMessage, setSelectedMessage] = useState<MessageType | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMessages, setTotalMessages] = useState(0);
  const messagesPerPage = 50;
  
  // Fetch groups when master group changes
  useEffect(() => {
    if (masterGroupId && currentOrganization) {
      fetchGroups();
    }
  }, [masterGroupId, currentOrganization]);
  
  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [masterGroupId, selectedGroupId, senderFilter, searchTerm]);
  
  // Fetch messages when group selection, filters, or page change
  useEffect(() => {
    if (masterGroupId && currentOrganization) {
      fetchMessages();
    }
  }, [masterGroupId, selectedGroupId, senderFilter, currentOrganization, currentPage]);
  
  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("flowmod_groups")
        .select("id, name, master_group_id")
        .eq("master_group_id", masterGroupId);
      
      if (error) throw error;
      
      setGroups(data || []);
      
      // Select the first group by default if none is selected
      if (data && data.length > 0 && !selectedGroupId) {
        setSelectedGroupId(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };
  
  const fetchMessages = async () => {
    try {
      setLoading(true);
      
      // First get total count
      let countQuery = supabase
        .from("flowmod_messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", currentOrganization?.id);
      
      // Base query for actual data
      let dataQuery = supabase
        .from("flowmod_messages")
        .select(`
          *,
          participant:participant_id(id, full_name, phone_number),
          group:group_id(id, name)
        `)
        .eq("organization_id", currentOrganization?.id)
        .order("created_at", { ascending: false })
        .range((currentPage - 1) * messagesPerPage, currentPage * messagesPerPage - 1);
      
      // Add group filter if selected
      if (selectedGroupId) {
        countQuery = countQuery.eq("group_id", selectedGroupId);
        dataQuery = dataQuery.eq("group_id", selectedGroupId);
      } else if (masterGroupId) {
        // If no specific group is selected, get messages from all groups in this master group
        const groupIds = groups.map(g => g.id);
        if (groupIds.length > 0) {
          countQuery = countQuery.in("group_id", groupIds);
          dataQuery = dataQuery.in("group_id", groupIds);
        }
      }
      
      // Add sender filter
      if (senderFilter !== "all") {
        if (senderFilter === "members") {
          countQuery = countQuery.eq("sender_type", "user");
          dataQuery = dataQuery.eq("sender_type", "user");
        } else if (senderFilter === "bots") {
          countQuery = countQuery.in("sender_type", ["bot", "private-bot"]);
          dataQuery = dataQuery.in("sender_type", ["bot", "private-bot"]);
        }
      }
      
      // Execute both queries
      const [{ count, error: countError }, { data, error: dataError }] = await Promise.all([
        countQuery,
        dataQuery
      ]);
      
      if (countError) throw countError;
      if (dataError) throw dataError;
      
      setTotalMessages(count || 0);
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  };
  
  const handleGroupChange = (groupId: string) => {
    setSelectedGroupId(groupId === "all" ? null : groupId);
  };
  
  const filteredMessages = messages.filter(message => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        message.message.toLowerCase().includes(searchLower) ||
        message.participant?.full_name?.toLowerCase().includes(searchLower) ||
        message.group?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });
  
  // Helper to format the time
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  // Helper to get sender display info
  const getSenderInfo = (message: MessageType) => {
    if (message.sender_type === "user") {
      return {
        type: "Member",
        name: message.participant?.full_name || "Anonymous",
        icon: User,
        className: "bg-blue-100 text-blue-800"
      };
    } else if (message.sender_type === "bot") {
      return {
        type: "Group Bot",
        name: "FlowMod Assistant",
        icon: Bot,
        className: "bg-green-100 text-green-800"
      };
    } else if (message.sender_type === "private-bot") {
      return {
        type: "Private Bot",
        name: "FlowMod Assistant",
        icon: Bot,
        className: "bg-purple-100 text-purple-800"
      };
    }
    return {
      type: "Unknown",
      name: "Unknown",
      icon: User,
      className: "bg-gray-100 text-gray-800"
    };
  };
  
  // Fetch intervention details for a specific message
  const fetchInterventionDetails = async (message: MessageType) => {
    try {
      setDetailsLoading(true);
      
      // Clear previous intervention responses immediately
      const messageWithoutResponses = { ...message, intervention_responses: [] };
      setSelectedMessage(messageWithoutResponses);
      
      // Get all groups in master group
      const { data: groupsData, error: groupsError } = await supabase
        .from("flowmod_groups")
        .select("id")
        .eq("master_group_id", masterGroupId);
      
      if (groupsError) throw groupsError;
      
      if (!groupsData || groupsData.length === 0) {
        console.warn("No groups found for master group:", masterGroupId);
        return;
      }
      
      const groupIds = groupsData.map(g => g.id);
      
      // Get intervention responses for this message
      const { data: responsesData, error: responsesError } = await supabase
        .from("flowmod_messages")
        .select(`
          id, message, sender_type, created_at, intervened_message_id,
          group:group_id(id, name)
        `)
        .eq("intervened_message_id", message.id)
        .in("group_id", groupIds)
        .in("sender_type", ["bot", "private-bot"])
        .order("created_at", { ascending: true });
      
      if (responsesError) throw responsesError;
      
      console.log(`Found ${responsesData?.length || 0} intervention responses for message ${message.id}`);
      
      // Update the selected message with intervention responses
      setSelectedMessage({
        ...message,
        intervention_responses: responsesData || []
      });
      
    } catch (error) {
      console.error("Error fetching intervention details:", error);
      toast.error("Failed to load intervention details");
      // Set message without responses on error
      setSelectedMessage({ ...message, intervention_responses: [] });
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleViewInterventionDetails = (message: MessageType) => {
    // Close dialog first to reset state
    if (detailsDialogOpen) {
      setDetailsDialogOpen(false);
      setTimeout(() => {
        setSelectedMessage(message);
        setDetailsDialogOpen(true);
        fetchInterventionDetails(message);
      }, 100);
    } else {
      setSelectedMessage(message);
      setDetailsDialogOpen(true);
      fetchInterventionDetails(message);
    }
  };

  // Helper to get intervention type info
  const getInterventionTypeInfo = (interventionType: string | null) => {
    if (!interventionType) return null;
    
    const typeMap = {
      medical_verification: {
        text: "Medical Verification",
        icon: Heart,
        className: "bg-red-100 text-red-800"
      },
      profanity: {
        text: "Profanity",
        icon: Ban,
        className: "bg-orange-100 text-orange-800"
      },
      self_promotion: {
        text: "Self Promotion",
        icon: Megaphone,
        className: "bg-yellow-100 text-yellow-800"
      },
      harassment: {
        text: "Harassment",
        icon: AlertTriangle,
        className: "bg-red-100 text-red-800"
      },
      spam: {
        text: "Spam",
        icon: Repeat,
        className: "bg-orange-100 text-orange-800"
      },
      threats: {
        text: "Threats",
        icon: Zap,
        className: "bg-red-100 text-red-800"
      },
      hate_speech: {
        text: "Hate Speech",
        icon: Eye,
        className: "bg-red-100 text-red-800"
      },
      inappropriate_content: {
        text: "Inappropriate Content",
        icon: FileX,
        className: "bg-orange-100 text-orange-800"
      },
      dangerous_advice: {
        text: "Dangerous Advice",
        icon: AlertTriangle,
        className: "bg-red-100 text-red-800"
      },
      general_assistance: {
        text: "General Assistance",
        icon: HelpCircle,
        className: "bg-blue-100 text-blue-800"
      }
    };
    
    return typeMap[interventionType as keyof typeof typeMap] || {
      text: interventionType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      icon: HelpCircle,
      className: "bg-gray-100 text-gray-800"
    };
  };

  // Helper to get intervention badge info
  const getInterventionBadge = (responses?: MessageType[]) => {
    if (!responses || responses.length === 0) return null;
    
    const hasPrivate = responses.some(r => r.sender_type === 'private-bot');
    const hasGroup = responses.some(r => r.sender_type === 'bot');
    
    if (hasPrivate && hasGroup) {
      return { 
        text: "Dual Assistance", 
        variant: "secondary" as const, 
        className: "bg-blue-100 text-blue-800 hover:bg-blue-100",
        icon: Shield
      };
    } else if (hasPrivate) {
      return { 
        text: "Private Assistance", 
        variant: "outline" as const, 
        className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
        icon: Lock
      };
    } else if (hasGroup) {
      return { 
        text: "Group Assistance", 
        variant: "outline" as const, 
        className: "bg-green-100 text-green-800 hover:bg-green-100",
        icon: Users
      };
    }
    
    return null;
  };

  // Helper to render intervention response
  const renderInterventionResponse = (response: MessageType, index: number) => {
    const isPrivate = response.sender_type === 'private-bot';
    const colorClass = isPrivate 
      ? "border-purple-300 bg-purple-50" 
      : "border-green-300 bg-green-50";
    const badgeClass = isPrivate
      ? "bg-purple-100 text-purple-800 hover:bg-purple-100"
      : "bg-green-100 text-green-800 hover:bg-green-100";
    
    return (
      <div key={response.id} className={`mt-4 p-4 rounded-lg border ${colorClass}`}>
        <div className="flex items-center gap-2 mb-2">
          <CornerDownRight className="h-4 w-4 text-gray-500" />
          <Badge variant="outline" className={badgeClass}>
            {isPrivate ? <Lock className="h-3 w-3 mr-1" /> : <Users className="h-3 w-3 mr-1" />}
            {isPrivate ? "Private Response" : "Group Response"}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {formatTime(response.created_at)}
          </span>
        </div>
        <p className="whitespace-pre-wrap text-sm">
          {response.message}
        </p>
        {isPrivate && (
          <p className="text-xs text-purple-600 mt-2">
            ✓ Sent privately to this participant
          </p>
        )}
      </div>
    );
  };
  
  if (!masterGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No master group selected</h3>
        <p className="text-muted-foreground text-center">
          Please select a master group from the dropdown above or create one in the Groups tab.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Group Messages</h2>
          <p className="text-muted-foreground">View all conversation activity in your groups</p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={senderFilter} onValueChange={setSenderFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by sender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All messages</SelectItem>
              <SelectItem value="members">Members only</SelectItem>
              <SelectItem value="bots">Bots only</SelectItem>
            </SelectContent>
          </Select>
          
          <Select 
            value={selectedGroupId || "all"} 
            onValueChange={handleGroupChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All groups</SelectItem>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name || "Unnamed group"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
        </div>
      </div>
      
      {/* Pagination Controls */}
      {!loading && !isLoading && totalMessages > 0 && (
        <div className="flex items-center justify-between py-4 px-2 border-b bg-background">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * messagesPerPage) + 1} to {Math.min(currentPage * messagesPerPage, totalMessages)} of {totalMessages} messages
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            
            <div className="flex items-center space-x-1">
              <span className="text-sm text-muted-foreground">Page</span>
              <span className="text-sm font-medium">{currentPage}</span>
              <span className="text-sm text-muted-foreground">of</span>
              <span className="text-sm font-medium">{Math.ceil(totalMessages / messagesPerPage)}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(prev => prev + 1)}
              disabled={currentPage >= Math.ceil(totalMessages / messagesPerPage)}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
      
      {/* Messages Table */}
      <div className="flex-1 overflow-auto w-full">
        {loading || isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i} className="w-full animate-pulse bg-muted/40 h-20"></Card>
            ))}
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No messages found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm ? "No messages match your search" : "No messages available for the selected filters"}
            </p>
          </div>
        ) : (
          <Card>
            <div className="w-full overflow-hidden">
              <Table className="table-fixed w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[30%]">Sender</TableHead>
                    <TableHead className="w-[25%]">Group</TableHead>
                    <TableHead className="w-[30%]">Message</TableHead>
                    <TableHead className="w-[15%]">Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => {
                    const senderInfo = getSenderInfo(message);
                    const isIntervenedMember = message.sender_type === "user" && message.intervened;
                    
                    return (
                      <TableRow 
                        key={message.id} 
                        className={`hover:bg-muted/50 ${isIntervenedMember ? 'cursor-pointer hover:bg-blue-50/50' : ''}`}
                        onClick={isIntervenedMember ? () => handleViewInterventionDetails(message) : undefined}
                      >
                        <TableCell className="w-[30%] max-w-0 pr-1">
                          <div className="flex items-center gap-1 overflow-hidden">
                            <Badge variant="outline" className={`${senderInfo.className} flex-shrink-0 text-xs px-1 py-0`}>
                              <senderInfo.icon className="h-3 w-3 mr-1" />
                              {senderInfo.type}
                            </Badge>
                            <span className="font-medium text-sm truncate min-w-0">
                              {senderInfo.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="w-[25%] max-w-0 pr-1">
                          <span className="text-sm text-muted-foreground truncate block">
                            {message.group?.name || "Unknown group"}
                          </span>
                        </TableCell>
                        <TableCell className="w-[30%] max-w-0 pr-1">
                          <div className="flex items-start gap-1 overflow-hidden">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm truncate">
                                {message.message}
                              </p>
                            </div>
                            {isIntervenedMember && (
                              <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 flex-shrink-0 text-xs px-1 py-0">
                                <Shield className="h-3 w-3 mr-1" />
                                Assisted
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="w-[15%] max-w-0 pr-1">
                          <div className="text-xs text-muted-foreground truncate">
                            {formatTime(message.created_at)}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </Card>
        )}
      </div>
      
      {/* Message count */}
      {filteredMessages.length > 0 && (
        <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing {filteredMessages.length} messages</span>
          {searchTerm && (
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSearchTerm("")}
            >
              Clear search
            </Button>
          )}
        </div>
      )}

      {/* Intervention details dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Intervention Details
              {selectedMessage?.intervened && (
                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
                  <Shield className="h-3 w-3" />
                  Assisted
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>
              Message from {selectedMessage?.participant?.full_name || "Anonymous"} • 
              {selectedMessage ? formatTime(selectedMessage.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-2">
            {selectedMessage && (
              <div className="space-y-4">
                {/* Original Message */}
                <Card className="border-blue-200 bg-blue-50/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Badge variant="outline" className="bg-blue-100 text-blue-800">Member</Badge>
                      <span>{selectedMessage.participant?.full_name || 'Anonymous'}</span>
                      {selectedMessage.intervention_type && (
                        <Badge variant="outline" className={getInterventionTypeInfo(selectedMessage.intervention_type)?.className}>
                          <HelpCircle className="h-3 w-3 mr-1" />
                          {getInterventionTypeInfo(selectedMessage.intervention_type)?.text}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center text-sm text-muted-foreground mt-1">
                      <Info className="h-3 w-3 mr-1" />
                      <span>
                        {selectedMessage.group?.name ? `in ${selectedMessage.group.name}` : 'Unknown group'} • {formatTime(selectedMessage.created_at)}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="whitespace-pre-wrap">{selectedMessage.message}</p>
                  </CardContent>
                </Card>

                {/* Intervention Responses */}
                {detailsLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map(i => (
                      <Card key={i} className="w-full animate-pulse bg-muted/40 h-24"></Card>
                    ))}
                  </div>
                ) : selectedMessage.intervention_responses && selectedMessage.intervention_responses.length > 0 ? (
                  <div>
                    <h4 className="font-medium mb-3">Intervention Responses</h4>
                    {selectedMessage.intervention_responses.map((response, index) => 
                      renderInterventionResponse(response, index)
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No intervention responses found</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 