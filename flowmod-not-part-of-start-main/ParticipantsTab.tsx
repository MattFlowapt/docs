import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { UserRound, Search, Shield, RefreshCw, Info, CornerDownRight, Lock, Users, AlertTriangle, Heart, Megaphone, Ban, Repeat, Zap, Eye, FileX, HelpCircle, Edit, Phone, CheckCircle, XCircle, Save, X, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow,
} from "@/components/ui/table";

type ParticipantType = {
  id: string;
  organization_id: string;
  full_name: string | null;
  phone_number: string | null;
  real_phone: string | null;
  created_at: string;
  updated_at: string;
  assistance_count: number;
  messages_count: number;
};

type MessageType = {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
  intervened: boolean | null;
  intervened_message_id: string | null;
  intervention_type: string | null;
  intervention_responses?: MessageType[];
  group?: {
    id: string;
    name: string | null;
  };
};

interface ParticipantsTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

export function ParticipantsTab({ masterGroupId, isLoading }: ParticipantsTabProps) {
  const { currentOrganization } = useOrganization();
  const [participants, setParticipants] = useState<ParticipantType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedParticipant, setSelectedParticipant] = useState<ParticipantType | null>(null);
  const [participantMessages, setParticipantMessages] = useState<MessageType[]>([]);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  
  // Real phone editing state
  const [editingParticipant, setEditingParticipant] = useState<string | null>(null);
  const [editingRealPhone, setEditingRealPhone] = useState("");
  const [savingRealPhone, setSavingRealPhone] = useState(false);
  
  useEffect(() => {
    if (masterGroupId && currentOrganization) {
      fetchParticipants();
    }
  }, [masterGroupId, currentOrganization]);
  
  const fetchParticipants = async () => {
    try {
      setLoading(true);
      
      if (!currentOrganization?.id) {
        setParticipants([]);
        return;
      }
      
      // Get ALL participants for this organization (don't filter by group)
      const { data: allParticipantsData, error: allParticipantsError } = await supabase
        .from("flowmod_participants")
        .select("*")
        .eq("organization_id", currentOrganization.id);
      
      if (allParticipantsError) throw allParticipantsError;
      
      if (!allParticipantsData || allParticipantsData.length === 0) {
        setParticipants([]);
        return;
      }
      
      // Get original messages only (not responses) to get message statistics for all participants
      const { data: messagesData, error: messagesError } = await supabase
        .from("flowmod_messages")
        .select("participant_id, intervened")
        .is("intervened_message_id", null) // Only original messages
        .not("participant_id", "is", null);
      
      if (messagesError) throw messagesError;
      
      // Count assistance per participant (changed from flags)
      const participantStats = (messagesData || []).reduce((acc: Record<string, {count: number, assistance: number}>, curr) => {
        const participantId = curr.participant_id as string;
        if (!acc[participantId]) {
          acc[participantId] = { count: 0, assistance: 0 };
        }
        acc[participantId].count += 1;
        if (curr.intervened) {
          acc[participantId].assistance += 1;
        }
        return acc;
      }, {});
      
      // Combine ALL participant details with stats (0 for those with no messages)
      const enrichedParticipants = allParticipantsData.map(participant => ({
        ...participant,
        assistance_count: participantStats[participant.id]?.assistance || 0,
        messages_count: participantStats[participant.id]?.count || 0
      }));
      
      setParticipants(enrichedParticipants);
    } catch (error) {
      console.error("Error fetching participants:", error);
      toast.error("Failed to load participants");
    } finally {
      setLoading(false);
    }
  };

  // Handle real phone editing
  const handleEditRealPhone = (participant: ParticipantType) => {
    setEditingParticipant(participant.id);
    setEditingRealPhone(participant.real_phone || "");
  };

  const handleCancelEditRealPhone = () => {
    setEditingParticipant(null);
    setEditingRealPhone("");
  };

  const handleSaveRealPhone = async (participantId: string) => {
    try {
      setSavingRealPhone(true);
      
      const { error } = await supabase
        .from("flowmod_participants")
        .update({ real_phone: editingRealPhone.trim() || null })
        .eq("id", participantId);
      
      if (error) throw error;
      
      // Update local state
      setParticipants(prev => prev.map(p => 
        p.id === participantId 
          ? { ...p, real_phone: editingRealPhone.trim() || null }
          : p
      ));
      
      toast.success("Real phone number updated successfully");
      setEditingParticipant(null);
      setEditingRealPhone("");
    } catch (error) {
      console.error("Error updating real phone:", error);
      toast.error("Failed to update real phone number");
    } finally {
      setSavingRealPhone(false);
    }
  };

  // Helper to render real phone status indicator
  const getRealPhoneStatusBadge = (realPhone: string | null) => {
    if (realPhone && realPhone.trim()) {
      return (
        <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100 gap-1">
          <CheckCircle className="h-3 w-3" />
          Private Messages Available
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="bg-red-100 text-red-800 hover:bg-red-100 gap-1">
          <XCircle className="h-3 w-3" />
          Private Messages Unavailable
        </Badge>
      );
    }
  };

  // Helper to render real phone cell with editing capability
  const renderRealPhoneCell = (participant: ParticipantType) => {
    const isEditing = editingParticipant === participant.id;
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingRealPhone}
            onChange={(e) => setEditingRealPhone(e.target.value)}
            placeholder="Enter real phone number"
            className="w-40"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSaveRealPhone(participant.id);
              } else if (e.key === 'Escape') {
                handleCancelEditRealPhone();
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => handleSaveRealPhone(participant.id)}
            disabled={savingRealPhone}
          >
            <Save className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleCancelEditRealPhone}
            disabled={savingRealPhone}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      );
    }
    
    return (
      <div className="flex items-center gap-2">
        <div className="flex flex-col">
          <span className="text-sm">
            {participant.real_phone || (
              <span className="text-muted-foreground italic">Not set</span>
            )}
          </span>
          <div className="mt-1">
            {getRealPhoneStatusBadge(participant.real_phone)}
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleEditRealPhone(participant)}
          className="ml-2"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </div>
    );
  };
  
  const fetchParticipantMessages = async (participantId: string) => {
    try {
      setMessagesLoading(true);
      
      // Get ALL messages for this participant (original + responses) to build complete context
      const { data, error } = await supabase
        .from("flowmod_messages")
        .select(`
          id, message, sender_type, created_at, intervened, intervened_message_id, intervention_type,
          group:group_id(id, name)
        `)
        .or(`participant_id.eq.${participantId},and(intervened_message_id.not.is.null,sender_type.in.("bot","private-bot"))`)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      // Process messages to connect original messages with ALL their responses
      const processedMessages = processInterventionMessages(data || [], participantId);
      setParticipantMessages(processedMessages);
    } catch (error) {
      console.error("Error fetching participant messages:", error);
      toast.error("Failed to load participant messages");
    } finally {
      setMessagesLoading(false);
    }
  };

  // Enhanced: Process messages to connect original messages with ALL intervention responses
  const processInterventionMessages = (allMessages: MessageType[], participantId: string): MessageType[] => {
    // Only show original messages from this participant, with their responses attached
    const originalMessages = allMessages.filter(m => 
      !m.intervened_message_id && 
      m.message && // Ensure message content exists
      m.sender_type !== 'bot' && 
      m.sender_type !== 'private-bot'
    );
    
    const responseMessages = allMessages.filter(m => m.intervened_message_id);
    
    const processedMessages: MessageType[] = [];
    
    originalMessages.forEach(message => {
      // Find ALL intervention responses for this message
      const responses = responseMessages.filter(r => r.intervened_message_id === message.id);
      
      // Add all intervention responses to the original message
      const processedMessage = { ...message };
      if (responses.length > 0) {
        processedMessage.intervention_responses = responses;
      }
      
      processedMessages.push(processedMessage);
    });
    
    return processedMessages;
  };
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // Filter is applied in client-side since we've already fetched all participants
  };
  
  const handleViewDetails = (participant: ParticipantType) => {
    setSelectedParticipant(participant);
    fetchParticipantMessages(participant.id);
    setDetailsDialogOpen(true);
  };
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
  
  // Filter participants based on search term
  const filteredParticipants = participants.filter(participant => {
    if (!searchTerm) return true;
    
    const fullName = (participant.full_name || "").toLowerCase();
    const phoneNumber = (participant.phone_number || "").toLowerCase();
    const realPhone = (participant.real_phone || "").toLowerCase();
    const searchLower = searchTerm.toLowerCase();
    
    return fullName.includes(searchLower) || phoneNumber.includes(searchLower) || realPhone.includes(searchLower);
  });
  
  if (!masterGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <UserRound className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No master group selected</h3>
        <p className="text-muted-foreground text-center">
          Please select a master group from the dropdown above or create one in the Groups tab.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Participants</h2>
        
        <div className="flex items-center gap-2">
          <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
            <Input
              type="search"
              placeholder="Search participants..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Button type="submit" variant="secondary">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </form>
          
          <Button variant="outline" onClick={fetchParticipants} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading || isLoading ? (
          <Card className="w-full animate-pulse bg-muted/40 h-96"></Card>
        ) : filteredParticipants.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <UserRound className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No participants found</h3>
            <p className="text-muted-foreground mb-4">There are no participants in this master group yet</p>
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>WhatsApp Phone</TableHead>
                    <TableHead>Real Phone & Private Messages</TableHead>
                    <TableHead>Messages</TableHead>
                    <TableHead>Assisted</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredParticipants.map((participant) => (
                    <TableRow key={participant.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <span>{participant.full_name || "Anonymous"}</span>
                          {participant.messages_count === 0 && (
                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 gap-1">
                              <Clock className="h-3 w-3" />
                              No messages yet
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{participant.phone_number || "Unknown"}</TableCell>
                      <TableCell className="min-w-[300px]">
                        {renderRealPhoneCell(participant)}
                      </TableCell>
                      <TableCell>{participant.messages_count}</TableCell>
                      <TableCell>
                        {participant.assistance_count > 0 ? (
                          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
                            <Shield className="h-3 w-3" />
                            {participant.assistance_count}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-gray-100 text-gray-600 hover:bg-gray-100">
                            0
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatTime(participant.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(participant)}
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Participant details dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserRound className="h-5 w-5" />
              {selectedParticipant?.full_name || "Anonymous"} 
              {selectedParticipant?.assistance_count > 0 && (
                <Badge variant="outline" className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-100 gap-1">
                  <Shield className="h-3 w-3" />
                  {selectedParticipant?.assistance_count} assisted
                </Badge>
              )}
              {selectedParticipant && (
                <div className="ml-4">
                  {getRealPhoneStatusBadge(selectedParticipant.real_phone)}
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              WhatsApp Phone: {selectedParticipant?.phone_number || "Unknown"} • 
              Real Phone: {selectedParticipant?.real_phone || "Not set"} • 
              Joined: {selectedParticipant ? formatTime(selectedParticipant.created_at) : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-auto mt-2">
            <h3 className="text-lg font-medium mb-3">Message History</h3>
            
            {messagesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="w-full animate-pulse bg-muted/40 h-24"></Card>
                ))}
              </div>
            ) : participantMessages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No messages found for this participant
              </div>
            ) : (
              <div className="space-y-4">
                {participantMessages.map((message) => {
                  const interventionBadge = getInterventionBadge(message.intervention_responses);
                  const interventionTypeInfo = getInterventionTypeInfo(message.intervention_type);
                  
                  return (
                    <Card 
                      key={message.id} 
                      className={`overflow-hidden ${message.intervened ? 'border-blue-200 bg-blue-50/30' : ''}`}
                    >
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                          <Badge variant="outline" className="bg-gray-100 text-gray-800">Member</Badge>
                          <span>{selectedParticipant?.full_name || 'Anonymous'}</span>
                          {interventionBadge && (
                            <Badge variant={interventionBadge.variant} className={`ml-2 ${interventionBadge.className}`}>
                              <interventionBadge.icon className="h-3 w-3 mr-1" />
                              {interventionBadge.text}
                            </Badge>
                          )}
                          {interventionTypeInfo && (
                            <Badge variant="outline" className={`ml-2 ${interventionTypeInfo.className}`}>
                              <interventionTypeInfo.icon className="h-3 w-3 mr-1" />
                              {interventionTypeInfo.text}
                            </Badge>
                          )}
                        </CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Info className="h-3 w-3 mr-1" />
                          <span>
                            {message.group?.name ? `in ${message.group.name}` : 'Unknown group'} • {formatTime(message.created_at)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="whitespace-pre-wrap">{message.message}</p>
                        
                        {/* ALL Intervention Responses */}
                        {message.intervention_responses && message.intervention_responses.length > 0 && (
                          <div className="mt-4">
                            {message.intervention_responses.map((response, index) => 
                              renderInterventionResponse(response, index)
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 