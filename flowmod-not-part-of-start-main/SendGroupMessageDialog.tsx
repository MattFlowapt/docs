import { useState } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { MessageSquare, Send, Users, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { sendMessageToGroups, GroupMessageResponse } from "@/services/groupMessagingService";

type GroupType = {
  id: string;
  name: string | null;
  whatsapp_group_id: string | null;
  master_group_id: string | null;
};

interface SendGroupMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterGroups: Array<{
    id: string;
    name: string;
    groups?: GroupType[];
  }>;
}

export function SendGroupMessageDialog({ 
  open, 
  onOpenChange, 
  masterGroups 
}: SendGroupMessageDialogProps) {
  const { currentOrganization } = useOrganization();
  const [message, setMessage] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [lastResults, setLastResults] = useState<GroupMessageResponse | null>(null);

  // Get all groups with WhatsApp IDs from all master groups
  const allGroups = masterGroups.flatMap(mg => 
    (mg.groups || []).filter(g => g.whatsapp_group_id) // Only groups with WhatsApp IDs
  );

  const handleGroupToggle = (groupId: string) => {
    const newSelected = new Set(selectedGroupIds);
    if (newSelected.has(groupId)) {
      newSelected.delete(groupId);
    } else {
      newSelected.add(groupId);
    }
    setSelectedGroupIds(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedGroupIds.size === allGroups.length) {
      setSelectedGroupIds(new Set());
    } else {
      setSelectedGroupIds(new Set(allGroups.map(g => g.id)));
    }
  };

  const handleSendMessage = async () => {
    if (!currentOrganization?.id) {
      toast.error("No organization selected");
      return;
    }

    if (!message.trim()) {
      toast.error("Please enter a message");
      return;
    }

    if (selectedGroupIds.size === 0) {
      toast.error("Please select at least one group");
      return;
    }

    setIsSending(true);
    
    try {
      const result = await sendMessageToGroups(
        currentOrganization.id,
        Array.from(selectedGroupIds),
        message.trim()
      );
      
      setLastResults(result);
      setShowResults(true);
      
      // Reset form if all messages were successful
      if (result.summary.failed === 0) {
        setMessage("");
        setSelectedGroupIds(new Set());
      }
    } catch (error) {
      console.error("Error sending messages:", error);
    } finally {
      setIsSending(false);
    }
  };

  const handleCloseDialog = () => {
    setShowResults(false);
    setLastResults(null);
    onOpenChange(false);
  };

  const selectedGroupsCount = selectedGroupIds.size;
  const allGroupsSelected = selectedGroupsCount === allGroups.length;

  if (showResults && lastResults) {
    return (
      <Dialog open={open} onOpenChange={handleCloseDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Message Sending Results
            </DialogTitle>
            <DialogDescription>
              Results for sending message to {lastResults.summary.total} groups
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary */}
            <Card>
              <CardContent className="pt-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {lastResults.summary.successful}
                    </div>
                    <div className="text-sm text-muted-foreground">Successful</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-red-600">
                      {lastResults.summary.failed}
                    </div>
                    <div className="text-sm text-muted-foreground">Failed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      {lastResults.summary.total}
                    </div>
                    <div className="text-sm text-muted-foreground">Total</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lastResults.results.map((result) => (
                <div 
                  key={result.groupId}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      result.success ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <span className="font-medium">{result.groupName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={result.success ? "default" : "destructive"}>
                      {result.success ? "Sent" : "Failed"}
                    </Badge>
                    {result.error && (
                      <span className="text-xs text-red-600 max-w-48 truncate">
                        {result.error}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Send Message to Groups
          </DialogTitle>
          <DialogDescription>
            Send a message to selected WhatsApp groups. Only groups with WhatsApp IDs can receive messages.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Input */}
          <div className="space-y-2">
            <Label htmlFor="message">Message</Label>
            <Textarea
              id="message"
              placeholder="Enter your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <div className="text-xs text-muted-foreground">
              {message.length}/4000 characters
            </div>
          </div>

          {/* Group Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Select Groups ({selectedGroupsCount} of {allGroups.length})</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSelectAll}
                disabled={allGroups.length === 0}
              >
                {allGroupsSelected ? "Deselect All" : "Select All"}
              </Button>
            </div>
            
            {allGroups.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No groups with WhatsApp IDs found</p>
                <p className="text-sm">Groups need WhatsApp group IDs to receive messages</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2">
                {masterGroups.map((masterGroup) => {
                  const groupsWithWhatsApp = (masterGroup.groups || []).filter(g => g.whatsapp_group_id);
                  if (groupsWithWhatsApp.length === 0) return null;

                  return (
                    <div key={masterGroup.id} className="space-y-2">
                      <div className="font-medium text-sm text-muted-foreground border-b pb-1">
                        {masterGroup.name}
                      </div>
                      {groupsWithWhatsApp.map((group) => (
                        <div key={group.id} className="flex items-center space-x-2 pl-4">
                          <Checkbox
                            id={group.id}
                            checked={selectedGroupIds.has(group.id)}
                            onCheckedChange={() => handleGroupToggle(group.id)}
                          />
                          <label 
                            htmlFor={group.id}
                            className="text-sm flex-1 cursor-pointer"
                          >
                            {group.name || "Unnamed Group"}
                          </label>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendMessage}
            disabled={isSending || !message.trim() || selectedGroupIds.size === 0}
            className="gap-2"
          >
            {isSending ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send to {selectedGroupsCount} group{selectedGroupsCount !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 