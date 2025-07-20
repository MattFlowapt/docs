import { useState, useEffect } from "react";
import { PlusCircle, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/context/OrganizationContext";

interface MasterGroupData {
  id?: string;
  name: string;
  description: string | null;
  custom_signature: string;
}

interface CreateMasterGroupDialogProps {
  onMasterGroupCreated: () => void;
  editingMasterGroup?: MasterGroupData | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CreateMasterGroupDialog({ 
  onMasterGroupCreated, 
  editingMasterGroup = null,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: CreateMasterGroupDialogProps) {
  const { currentOrganization } = useOrganization();
  const [internalOpen, setInternalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newMasterGroup, setNewMasterGroup] = useState({
    name: "",
    description: "",
    customSignature: "Message from FlowMod Network"
  });

  // Use external open state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnOpenChange || setInternalOpen;

  const isEditMode = !!editingMasterGroup;

  // Populate form when editing
  useEffect(() => {
    if (editingMasterGroup) {
      setNewMasterGroup({
        name: editingMasterGroup.name || "",
        description: editingMasterGroup.description || "",
        customSignature: editingMasterGroup.custom_signature || "Message from FlowMod Network"
      });
    }
  }, [editingMasterGroup]);

  const handleCreate = async () => {
    try {
      if (!newMasterGroup.name.trim()) {
        toast.error("Master group name is required");
        return;
      }
      
      setIsCreating(true);
      
      if (isEditMode && editingMasterGroup?.id) {
        // Update existing master group
        const { error } = await supabase
          .from("flowmod_master_groups")
          .update({
            name: newMasterGroup.name.trim(),
            description: newMasterGroup.description.trim() || null,
            custom_signature: newMasterGroup.customSignature.trim() || "Message from FlowMod Network",
          })
          .eq('id', editingMasterGroup.id);
        
        if (error) throw error;
        toast.success("Master group updated successfully");
      } else {
        // Create new master group
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
      }
      
      setOpen(false);
      resetForm();
      onMasterGroupCreated();
    } catch (error) {
      console.error("Error saving master group:", error);
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} master group`);
    } finally {
      setIsCreating(false);
    }
  };

  const resetForm = () => {
    setNewMasterGroup({ 
      name: "", 
      description: "", 
      customSignature: "Message from FlowMod Network" 
    });
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen && !isEditMode) {
      resetForm();
    }
  };

  const DialogTriggerButton = () => {
    if (externalOpen !== undefined) {
      // When controlled externally, don't render trigger
      return null;
    }
    
    return (
      <DialogTrigger asChild>
        <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
          <PlusCircle className="h-4 w-4" />
          <span>Create Master Group</span>
        </Button>
      </DialogTrigger>
    );
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTriggerButton />
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Edit className="h-4 w-4" />
                Edit Master Group
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4" />
                Create Master Group
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isEditMode 
              ? "Update the master group details and custom signature."
              : "Create a new master group to organize your WhatsApp groups for moderation."
            }
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input 
              id="name" 
              placeholder="Enter master group name" 
              value={newMasterGroup.name}
              onChange={(e) => setNewMasterGroup(prev => ({ ...prev, name: e.target.value }))}
              disabled={isCreating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea 
              id="description" 
              placeholder="Enter description" 
              value={newMasterGroup.description}
              onChange={(e) => setNewMasterGroup(prev => ({ ...prev, description: e.target.value }))}
              disabled={isCreating}
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="customSignature">Custom Signature</Label>
            <Input 
              id="customSignature" 
              placeholder="e.g., Message from Your Network Name" 
              value={newMasterGroup.customSignature}
              onChange={(e) => setNewMasterGroup(prev => ({ ...prev, customSignature: e.target.value }))}
              disabled={isCreating}
            />
            <div className="text-xs text-muted-foreground">
              This text can be used as a signature for messages from this master group
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={isCreating}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleCreate}
            disabled={isCreating || !newMasterGroup.name.trim()}
          >
            {isCreating 
              ? `${isEditMode ? 'Updating' : 'Creating'}...` 
              : `${isEditMode ? 'Update' : 'Create'}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 