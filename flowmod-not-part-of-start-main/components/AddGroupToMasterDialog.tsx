import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";
import { GroupSelector, EnhancedGroupOption } from "./GroupSelector";

interface AddGroupToMasterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  masterGroupId: string | null;
  enhancedGroupOptions: EnhancedGroupOption[];
  onGroupAdded: () => void;
}

export function AddGroupToMasterDialog({ 
  open, 
  onOpenChange, 
  masterGroupId, 
  enhancedGroupOptions, 
  onGroupAdded 
}: AddGroupToMasterDialogProps) {
  const { currentOrganization } = useOrganization();
  const [selectedGroupOption, setSelectedGroupOption] = useState<EnhancedGroupOption | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const createDatabaseGroup = async (groupOption: EnhancedGroupOption): Promise<string> => {
    try {
      console.log(`Creating database entry for group: ${groupOption.name}`);
      
      const { data, error } = await supabase
        .from('flowmod_groups')
        .insert([{
          name: groupOption.name,
          whatsapp_group_id: groupOption.uuid || null,
          organization_id: currentOrganization?.id
          // Note: master_group_id will be set separately when adding to master group
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

  const handleCreate = async () => {
    try {
      if (!masterGroupId) {
        toast.error("No master group selected");
        return;
      }
      
      if (!selectedGroupOption) {
        toast.error("Please select a group first");
        return;
      }
      
      setIsCreating(true);
      
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
          .update({ master_group_id: masterGroupId })
          .eq('id', groupDatabaseId);
          
        if (updateError) throw updateError;
      } else {
        // Create new database entry with master group assignment
        const { data, error } = await supabase
          .from("flowmod_groups")
          .insert([{
            name: selectedGroupOption.name,
            whatsapp_group_id: selectedGroupOption.uuid || null,
            master_group_id: masterGroupId,
            organization_id: currentOrganization?.id
          }])
          .select();
        
        if (error) throw error;
      }
      
      toast.success(`Group ${selectedGroupOption.name} added to master group successfully`);
      handleClose();
      onGroupAdded();
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to add group to master group");
    } finally {
      setIsCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedGroupOption(null);
    onOpenChange(false);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleClose();
    } else {
      onOpenChange(newOpen);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Group to Master Group</DialogTitle>
          <DialogDescription>
            Select a WhatsApp group to add to the master group. Groups can come from your WhatsApp API or database.
          </DialogDescription>
        </DialogHeader>
        
        {/* Informational section about enhanced group system */}
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
        
        <div className="space-y-4 py-2">
          <GroupSelector
            enhancedGroupOptions={enhancedGroupOptions}
            selectedGroupOption={selectedGroupOption}
            onGroupSelect={setSelectedGroupOption}
            disabled={isCreating}
          />
        </div>
        
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={!selectedGroupOption || isCreating}
          >
            {isCreating 
              ? (selectedGroupOption?.source === 'api' && !selectedGroupOption.hasExistingEntry 
                ? 'Creating & Adding...' 
                : 'Adding...') 
              : (selectedGroupOption?.source === 'api' && !selectedGroupOption.hasExistingEntry 
                ? 'Create in DB & Add to Master Group' 
                : 'Add to Master Group')
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 