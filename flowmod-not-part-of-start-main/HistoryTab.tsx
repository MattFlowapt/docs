import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { FileText, Clock, Copy, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type GroupType = {
  id: string;
  name: string;
  master_group_id: string | null;
  updated_at: string;
};

type HistoryType = {
  id: string;
  group_id: string;
  history_all: string;
  updated_at: string;
};

interface HistoryTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

export function HistoryTab({ masterGroupId, isLoading }: HistoryTabProps) {
  const { currentOrganization } = useOrganization();
  const [groups, setGroups] = useState<GroupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupType | null>(null);
  const [historyData, setHistoryData] = useState<HistoryType | null>(null);
  
  useEffect(() => {
    if (masterGroupId && currentOrganization) {
      fetchGroups();
    }
  }, [masterGroupId, currentOrganization]);
  
  useEffect(() => {
    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      setSelectedGroup(group || null);
      fetchHistoryData(selectedGroupId);
    } else {
      setSelectedGroup(null);
      setHistoryData(null);
    }
  }, [selectedGroupId, groups]);
  
  const fetchGroups = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("flowmod_groups")
        .select("id, name, master_group_id, updated_at")
        .eq("master_group_id", masterGroupId);
      
      if (error) throw error;
      
      setGroups(data || []);
      
      // Set the first group as selected by default if there are groups
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
  
  const fetchHistoryData = async (groupId: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("flowmod_history")
        .select("id, group_id, history_all, updated_at")
        .eq("group_id", groupId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 means no rows returned
        throw error;
      }
      
      setHistoryData(data || null);
    } catch (error) {
      console.error("Error fetching history data:", error);
      toast.error("Failed to load conversation history");
    } finally {
      setLoading(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };
  
  const handleRefresh = () => {
    fetchGroups();
    if (selectedGroupId) {
      fetchHistoryData(selectedGroupId);
    }
  };
  
  if (!masterGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <FileText className="h-16 w-16 text-muted-foreground mb-4" />
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
        <h2 className="text-2xl font-bold">Conversation History</h2>
        
        <div className="flex items-center space-x-2">
          <Select
            value={selectedGroupId || ""}
            onValueChange={setSelectedGroupId}
          >
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Select a group" />
            </SelectTrigger>
            <SelectContent>
              {groups.map(group => (
                <SelectItem key={group.id} value={group.id}>
                  {group.name || `Group ${group.id.substring(0, 4)}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading || isLoading ? (
          <Card className="w-full h-[300px] animate-pulse bg-muted/40"></Card>
        ) : !selectedGroupId ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No group selected</h3>
            <p className="text-muted-foreground mb-4">Please select a group to view its conversation history</p>
          </div>
        ) : !historyData?.history_all ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No history found</h3>
            <p className="text-muted-foreground mb-4">There is no conversation history for this group yet</p>
          </div>
        ) : (
          <Card className="overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                  <span>
                    {selectedGroup?.name || `Group ${selectedGroup?.id.substring(0, 4)}`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {new Date(historyData.updated_at).toLocaleString()}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0"
                    onClick={() => copyToClipboard(historyData.history_all || "")}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md font-mono text-xs h-[500px] overflow-auto whitespace-pre-wrap">
                {historyData.history_all
                  .split("\n")
                  .filter(line => line.trim() !== '')
                  .reverse()
                  .join("\n")}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 