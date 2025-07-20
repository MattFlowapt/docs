import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { Check, ChevronsUpDown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

type MasterGroupType = {
  id: string;
  name: string;
  description: string | null;
};

interface MasterGroupSelectorProps {
  selectedMasterGroupId: string | null;
  onMasterGroupChange: (masterGroupId: string) => void;
}

export function MasterGroupSelector({ selectedMasterGroupId, onMasterGroupChange }: MasterGroupSelectorProps) {
  const { currentOrganization } = useOrganization();
  const [open, setOpen] = useState(false);
  const [masterGroups, setMasterGroups] = useState<MasterGroupType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMasterGroup, setSelectedMasterGroup] = useState<MasterGroupType | null>(null);

  // Fetch master groups
  useEffect(() => {
    if (currentOrganization) {
      fetchMasterGroups();
    }
  }, [currentOrganization]);

  // Update selected master group when selectedMasterGroupId changes
  useEffect(() => {
    if (selectedMasterGroupId && masterGroups.length > 0) {
      const masterGroup = masterGroups.find(g => g.id === selectedMasterGroupId);
      if (masterGroup) {
        setSelectedMasterGroup(masterGroup);
      }
    }
  }, [selectedMasterGroupId, masterGroups]);

  const fetchMasterGroups = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("flowmod_master_groups")
        .select("id, name, description")
        .eq("organization_id", currentOrganization?.id);
      
      if (error) throw error;
      
      setMasterGroups(data || []);
      
      // If no master group is selected yet and we have master groups, select the first one
      if (!selectedMasterGroupId && data && data.length > 0) {
        onMasterGroupChange(data[0].id);
        setSelectedMasterGroup(data[0]);
      } else if (selectedMasterGroupId && data) {
        const masterGroup = data.find(g => g.id === selectedMasterGroupId);
        if (masterGroup) {
          setSelectedMasterGroup(masterGroup);
        }
      }
    } catch (error) {
      console.error("Error fetching master groups:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMasterGroupSelect = (masterGroupId: string) => {
    const masterGroup = masterGroups.find(g => g.id === masterGroupId);
    if (masterGroup) {
      setSelectedMasterGroup(masterGroup);
      onMasterGroupChange(masterGroupId);
      setOpen(false);
    }
  };

  if (loading) {
    return <Skeleton className="h-9 min-w-[250px]" />;
  }

  if (masterGroups.length === 0) {
    return (
      <div className="flex items-center text-sm text-muted-foreground">
        <Users className="mr-2 h-4 w-4" />
        <span>No master groups available</span>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="min-w-[250px] w-auto justify-between"
        >
          <div className="flex items-center truncate">
            <Users className="mr-2 h-4 w-4 shrink-0" />
            <span className="truncate">
              {selectedMasterGroup?.name || "Select master group..."}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="min-w-[250px] p-0">
        <Command>
          <CommandInput placeholder="Search master group..." />
          <CommandList>
            <CommandEmpty>No master group found.</CommandEmpty>
            <CommandGroup>
              {masterGroups.map((masterGroup) => (
                <CommandItem
                  key={masterGroup.id}
                  value={masterGroup.id}
                  onSelect={() => handleMasterGroupSelect(masterGroup.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedMasterGroup?.id === masterGroup.id
                        ? "opacity-100"
                        : "opacity-0"
                    )}
                  />
                  <span className="truncate">{masterGroup.name}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
} 