import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { Users, Plus, Cloud, Database, MessageSquare, PlusCircle, Edit, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { SendGroupMessageDialog } from "./SendGroupMessageDialog";
import { CreateMasterGroupDialog } from "./components/CreateMasterGroupDialog";
import { EnhancedGroupOption } from "./components/GroupSelector";
import { processEnhancedGroupOptions, loadWhatsAppGroups } from "./utils/groupUtils";

type MasterGroupType = {
  id: string;
  name: string;
  description: string | null;
  custom_signature: string;
  created_at: string;
  updated_at: string;
  groups?: GroupType[];
};

type GroupType = {
  id: string;
  name: string | null;
  whatsapp_group_id: string | null;
  master_group_id: string | null;
  created_at: string;
  updated_at: string;
};

interface WhatsAppGroup {
  id: string;
  name: string;
  uuid: string;
  wa_group_id?: string;
  size?: number;
  wa_subject?: string;
  is_muted?: boolean;
}

interface DatabaseGroup {
  id: string;
  name: string | null;
  whatsapp_group_id: string | null;
  master_group_id: string | null;
  created_at: string;
  updated_at: string;
  organization_id: string;
}

interface GroupsTabProps {
  onMasterGroupSelect: (masterGroupId: string) => void;
  isLoading: boolean;
}

export function GroupsTab({ onMasterGroupSelect, isLoading }: GroupsTabProps) {
  const { currentOrganization } = useOrganization();
  const [masterGroups, setMasterGroups] = useState<MasterGroupType[]>([]);
  const [whatsappGroups, setWhatsappGroups] = useState<WhatsAppGroup[]>([]);
  const [databaseGroups, setDatabaseGroups] = useState<DatabaseGroup[]>([]);
  const [enhancedGroupOptions, setEnhancedGroupOptions] = useState<EnhancedGroupOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendMessageDialogOpen, setSendMessageDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Master group creation states
  const [newMasterGroup, setNewMasterGroup] = useState({
    name: "",
    description: "",
    customSignature: "Message from FlowMod Network"
  });
  
  // Edit master group states
  const [editingMasterGroup, setEditingMasterGroup] = useState<MasterGroupType | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  // Group addition states
  const [selectedMasterGroupId, setSelectedMasterGroupId] = useState<string | null>(null);
  const [selectedGroupOption, setSelectedGroupOption] = useState<EnhancedGroupOption | null>(null);
  const [selectedGroupName, setSelectedGroupName] = useState<string>('');
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);

  useEffect(() => {
    if (currentOrganization) {
      loadAllData();
    }
  }, [currentOrganization]);

  // Combine and process groups when data changes
  useEffect(() => {
    const enhancedOptions = processEnhancedGroupOptions(whatsappGroups, databaseGroups, masterGroups);
    setEnhancedGroupOptions(enhancedOptions);
  }, [whatsappGroups, databaseGroups, masterGroups]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchMasterGroups(),
        loadWhatsAppGroupsData(),
        loadDatabaseGroups()
      ]);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWhatsAppGroupsData = async () => {
    if (!currentOrganization?.id) return;
    
    try {
      const groups = await loadWhatsAppGroups(currentOrganization.id);
      setWhatsappGroups(groups);
    } catch (error: any) {
      console.error('Error loading WhatsApp groups:', error);
      setWhatsappGroups([]);
      
      // Only show toast if it's not a configuration issue
      if (!error.message.includes('not configured') && !error.message.includes('not properly configured')) {
        toast.error(`Failed to load WhatsApp groups: ${error.message}`);
      }
    }
  };

  const loadDatabaseGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('flowmod_groups')
        .select('*')
        .eq('organization_id', currentOrganization?.id);

      if (error) throw error;
      
      setDatabaseGroups(data || []);
      console.log(`✅ Loaded ${data?.length || 0} groups from database`);
    } catch (error: any) {
      console.error('Error loading database groups:', error);
      setDatabaseGroups([]);
    }
  };

  const fetchMasterGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("flowmod_master_groups")
        .select(`
          id,
          name,
          description,
          custom_signature,
          created_at,
          updated_at,
          groups:flowmod_groups(
            id,
            name,
            whatsapp_group_id
          )
        `)
        .eq("organization_id", currentOrganization?.id);
      
      if (error) throw error;
      
      setMasterGroups(data || []);
    } catch (error) {
      console.error("Error fetching master groups:", error);
    }
  };

  const createDatabaseGroup = async (groupOption: EnhancedGroupOption): Promise<string> => {
    try {
      console.log(`Creating database entry for group: ${groupOption.name}`);
      
      const { data, error } = await supabase
        .from('flowmod_groups')
        .insert([{
          name: groupOption.name,
          whatsapp_group_id: groupOption.uuid || null,
          organization_id: currentOrganization?.id
        }])
        .select('id')
        .single();

      if (error) throw error;
      
      console.log(`✅ Created database group with ID: ${data.id}`);
      return data.id;
    } catch (error: any) {
      console.error('Error creating database group:', error);
      throw new Error(`Failed to create group in database: ${error.message}`);
    }
  };

  const handleCreateMasterGroup = async () => {
    try {
      if (!newMasterGroup.name.trim()) {
        toast.error("Master group name is required");
        return;
      }
      
      setIsSaving(true);
      
      const { data, error } = await supabase
        .from("flowmod_master_groups")
        .insert([{
          name: newMasterGroup.name.trim(),
          description: newMasterGroup.description.trim() || null,
          custom_signature: newMasterGroup.customSignature.trim() || "Message from FlowMod Network",
          organization_id: currentOrganization?.id
        }])
        .select();
      
      if (error) throw error;
      
      toast.success("Master group created successfully");
      setNewMasterGroup({ 
        name: "", 
        description: "", 
        customSignature: "Message from FlowMod Network" 
      });
      await loadAllData();
    } catch (error) {
      console.error("Error creating master group:", error);
      toast.error("Failed to create master group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddGroupToMaster = async () => {
    try {
      if (!selectedMasterGroupId) {
        toast.error("Please select a master group first");
        return;
      }
      
      if (!selectedGroupOption) {
        toast.error("Please select a group first");
        return;
      }
      
      setIsSaving(true);
      
      let groupDatabaseId = selectedGroupOption.databaseId;
      
      // If group is not in database, create it first
      if (!groupDatabaseId && selectedGroupOption.source === 'api') {
        toast.info(`Creating database entry for ${selectedGroupOption.name}...`);
        groupDatabaseId = await createDatabaseGroup(selectedGroupOption);
        toast.success(`Group ${selectedGroupOption.name} added to database`);
      }
      
      // Update the group to be part of the master group
      if (groupDatabaseId) {
        const { error: updateError } = await supabase
          .from('flowmod_groups')
          .update({ master_group_id: selectedMasterGroupId })
          .eq('id', groupDatabaseId);
          
        if (updateError) throw updateError;
      } else {
        // Create new database entry with master group assignment
        const { data, error } = await supabase
          .from("flowmod_groups")
          .insert([{
            name: selectedGroupOption.name,
            whatsapp_group_id: selectedGroupOption.uuid || null,
            master_group_id: selectedMasterGroupId,
            organization_id: currentOrganization?.id
          }])
          .select();
        
        if (error) throw error;
      }
      
      toast.success(`Group ${selectedGroupOption.name} added to master group successfully`);
      setSelectedGroupOption(null);
      setSelectedGroupName('');
      setSelectedMasterGroupId(null);
      
      // Reload all data
      await loadAllData();
    } catch (error) {
      console.error("Error adding group to master:", error);
      toast.error("Failed to add group to master group");
    } finally {
      setIsSaving(false);
    }
  };

  const handleMasterGroupClick = (masterGroupId: string) => {
    onMasterGroupSelect(masterGroupId);
  };

  const handleEditMasterGroup = (masterGroup: MasterGroupType) => {
    setEditingMasterGroup(masterGroup);
    setEditDialogOpen(true);
  };

  const handleMasterGroupUpdated = () => {
    setEditingMasterGroup(null);
    setEditDialogOpen(false);
    loadAllData();
  };

  if (loading || isLoading) {
    return (
      <div className="p-4">
        <Card>
          <CardHeader>
            <CardTitle>Moderation Groups</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Moderation Groups</h2>
        <Button 
          variant="outline"
          className="gap-2"
          onClick={() => setSendMessageDialogOpen(true)}
          disabled={masterGroups.length === 0}
        >
          <MessageSquare className="h-4 w-4" />
          <span>Send Message</span>
        </Button>
      </div>

      {/* Send Message Dialog */}
      <SendGroupMessageDialog
        open={sendMessageDialogOpen}
        onOpenChange={setSendMessageDialogOpen}
        masterGroups={masterGroups}
      />

      {/* Edit Master Group Dialog */}
      <CreateMasterGroupDialog
        onMasterGroupCreated={handleMasterGroupUpdated}
        editingMasterGroup={editingMasterGroup}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      {/* Existing Master Groups */}
      {masterGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Existing Master Groups
            </CardTitle>
            <CardDescription>
              Manage your master groups and their custom signatures
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {masterGroups.map((masterGroup) => (
              <div key={masterGroup.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{masterGroup.name}</h4>
                    <Badge variant="outline" className="text-xs">
                      {masterGroup.groups?.length || 0} groups
                    </Badge>
                  </div>
                  {masterGroup.description && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {masterGroup.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>Signature:</strong> {masterGroup.custom_signature}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditMasterGroup(masterGroup)}
                    className="gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleMasterGroupClick(masterGroup.id)}
                    className="gap-1"
                  >
                    <Users className="h-3 w-3" />
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Create Master Group Section */}
      <CreateMasterGroupDialog onMasterGroupCreated={loadAllData} />

      <Separator />

      {/* Add Group to Master Group Section */}
      {masterGroups.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Add Group to Master Group
              {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <CardDescription>
              Select a WhatsApp group and add it to a master group. Groups can come from your WhatsApp API or database.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Informational section */}
            <div className="rounded-lg bg-blue-50 p-3 border border-blue-200">
              <div className="flex items-start gap-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                <div>
                  <h4 className="text-sm font-medium text-blue-800 mb-1">
                    Enhanced Group Management
                  </h4>
                  <p className="text-xs text-blue-700 mb-2">
                    Groups can come from your WhatsApp API or be stored in the database:
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• <strong>API groups:</strong> Will be automatically added to the database when selected</li>
                    <li>• <strong>Database groups:</strong> Already stored and ready to be assigned</li>
                    <li>• <strong>Synced groups:</strong> Exist in both API and database</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Master Group Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Select Master Group</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-full justify-between",
                        !selectedMasterGroupId && "text-muted-foreground"
                      )}
                      disabled={isSaving}
                    >
                      <span className="truncate">
                        {selectedMasterGroupId 
                          ? masterGroups.find(mg => mg.id === selectedMasterGroupId)?.name || "Select master group"
                          : "Select master group"
                        }
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search master groups..." />
                      <CommandList>
                        <CommandEmpty>No master groups found.</CommandEmpty>
                        <CommandGroup>
                          {masterGroups.map((masterGroup) => (
                            <CommandItem
                              key={masterGroup.id}
                              value={masterGroup.id}
                              onSelect={(selectedId) => {
                                setSelectedMasterGroupId(selectedId);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedMasterGroupId === masterGroup.id ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <div className="flex items-center gap-2 flex-1">
                                <Users className="h-3 w-3 text-muted-foreground" />
                                <span className="truncate">{masterGroup.name}</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {masterGroup.groups?.length || 0} groups
                              </Badge>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>

              {/* WhatsApp Group Selection */}
              <div className="space-y-2">
                <Label className="text-sm">Select WhatsApp Group</Label>
                <Popover open={groupDropdownOpen} onOpenChange={setGroupDropdownOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={groupDropdownOpen}
                      className={cn(
                        "w-full justify-between",
                        !selectedGroupName && "text-muted-foreground"
                      )}
                      disabled={isSaving}
                    >
                      <span className="truncate">
                        {selectedGroupName || "Select a WhatsApp group"}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search groups..." />
                      <CommandList>
                        <CommandEmpty>No groups found.</CommandEmpty>
                        
                        {/* Available API Groups Section */}
                        {enhancedGroupOptions.filter(group => 
                          !group.isInMasterGroup && group.source === 'api'
                        ).length > 0 && (
                          <CommandGroup heading="WhatsApp API Groups (Available)">
                            {enhancedGroupOptions
                              .filter(group => !group.isInMasterGroup && group.source === 'api')
                              .map((group) => (
                                <CommandItem
                                  key={`api-${group.id}`}
                                  value={group.id}
                                  onSelect={(selectedId) => {
                                    const selectedOption = enhancedGroupOptions.find(opt => opt.id === selectedId);
                                    setSelectedGroupOption(selectedOption || null);
                                    setSelectedGroupName(selectedOption?.name || '');
                                    setGroupDropdownOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedGroupOption?.id === group.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <Cloud className="h-3 w-3 text-blue-500" />
                                    <span className="truncate flex-1">{group.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-auto">
                                    {group.size && (
                                      <span className="text-xs text-muted-foreground">
                                        {group.size} members
                                      </span>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      Will create in DB
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}
                        
                        {/* Available Synced Groups Section */}
                        {enhancedGroupOptions.filter(group => 
                          !group.isInMasterGroup && group.source === 'both'
                        ).length > 0 && (
                          <CommandGroup heading="Synced Groups (Available)">
                            {enhancedGroupOptions
                              .filter(group => !group.isInMasterGroup && group.source === 'both')
                              .map((group) => (
                                <CommandItem
                                  key={`both-${group.id}`}
                                  value={group.id}
                                  onSelect={(selectedId) => {
                                    const selectedOption = enhancedGroupOptions.find(opt => opt.id === selectedId);
                                    setSelectedGroupOption(selectedOption || null);
                                    setSelectedGroupName(selectedOption?.name || '');
                                    setGroupDropdownOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedGroupOption?.id === group.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <div className="flex items-center gap-0.5">
                                      <Cloud className="h-3 w-3 text-blue-500" />
                                      <Database className="h-3 w-3 text-green-500" />
                                    </div>
                                    <span className="truncate flex-1">{group.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-auto">
                                    {group.size && (
                                      <span className="text-xs text-muted-foreground">
                                        {group.size} members
                                      </span>
                                    )}
                                    <Badge variant="outline" className="text-xs">
                                      Ready
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}
                        
                        {/* Available Database Only Groups Section */}
                        {enhancedGroupOptions.filter(group => 
                          !group.isInMasterGroup && group.source === 'database'
                        ).length > 0 && (
                          <CommandGroup heading="Database Groups (Available)">
                            {enhancedGroupOptions
                              .filter(group => !group.isInMasterGroup && group.source === 'database')
                              .map((group) => (
                                <CommandItem
                                  key={`db-${group.id}`}
                                  value={group.id}
                                  onSelect={(selectedId) => {
                                    const selectedOption = enhancedGroupOptions.find(opt => opt.id === selectedId);
                                    setSelectedGroupOption(selectedOption || null);
                                    setSelectedGroupName(selectedOption?.name || '');
                                    setGroupDropdownOpen(false);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      selectedGroupOption?.id === group.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  <div className="flex items-center gap-2 flex-1">
                                    <Database className="h-3 w-3 text-green-500" />
                                    <span className="truncate flex-1">{group.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1 ml-auto">
                                    <Badge variant="outline" className="text-xs">
                                      DB Only
                                    </Badge>
                                  </div>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}
                        
                        {/* Groups Already in Master Groups Section */}
                        {enhancedGroupOptions.filter(group => group.isInMasterGroup).length > 0 && (
                          <CommandGroup heading="Already in Master Groups">
                            {enhancedGroupOptions
                              .filter(group => group.isInMasterGroup)
                              .map((group) => (
                                <CommandItem
                                  key={`assigned-${group.id}`}
                                  value={group.id}
                                  disabled
                                >
                                  <div className="flex items-center gap-2 flex-1 opacity-50">
                                    <span className="truncate flex-1">{group.name}</span>
                                  </div>
                                  <Badge variant="secondary" className="text-xs">
                                    Already assigned
                                  </Badge>
                                </CommandItem>
                              ))}
                          </CommandGroup>
                        )}
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Group source indicators:</p>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="flex items-center gap-1">
                      <Cloud className="h-3 w-3 text-blue-500" />
                      <span>WhatsApp API</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="h-3 w-3 text-green-500" />
                      <span>Database</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Cloud className="h-3 w-3 text-blue-500" />
                      <Database className="h-3 w-3 text-green-500" />
                      <span>Synced</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <Button 
              onClick={handleAddGroupToMaster}
              disabled={!selectedMasterGroupId || !selectedGroupOption || isSaving}
              className="w-full"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {selectedGroupOption?.source === 'api' && !selectedGroupOption.hasExistingEntry ? 'Creating & Adding...' : 'Adding...'}
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  {selectedGroupOption?.source === 'api' && !selectedGroupOption.hasExistingEntry ? 'Create in DB & Add to Master Group' : 'Add to Master Group'}
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 