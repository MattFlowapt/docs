import { useState } from "react";
import { Check, ChevronsUpDown, Cloud, Database, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

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

export interface EnhancedGroupOption {
  id: string;
  name: string;
  uuid?: string;
  source: 'api' | 'database' | 'both';
  hasExistingEntry: boolean;
  size?: number;
  databaseId?: string;
  apiData?: WhatsAppGroup;
  databaseData?: DatabaseGroup;
  isInMasterGroup?: boolean;
  masterGroupId?: string;
}

interface GroupSelectorProps {
  enhancedGroupOptions: EnhancedGroupOption[];
  selectedGroupOption: EnhancedGroupOption | null;
  onGroupSelect: (group: EnhancedGroupOption | null) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function GroupSelector({ 
  enhancedGroupOptions, 
  selectedGroupOption, 
  onGroupSelect, 
  disabled = false,
  placeholder = "Select a WhatsApp group"
}: GroupSelectorProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (selectedId: string) => {
    // Find group by unique ID instead of name to avoid duplicates
    const selectedGroup = enhancedGroupOptions.find(opt => opt.id === selectedId);
    onGroupSelect(selectedGroup || null);
    setOpen(false);
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">Select WhatsApp Group</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between",
              !selectedGroupOption && "text-muted-foreground"
            )}
            disabled={disabled}
          >
            <span className="truncate">
              {selectedGroupOption?.name || placeholder}
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
                        onSelect={() => handleSelect(group.id)}
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
                        onSelect={() => handleSelect(group.id)}
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
                        onSelect={() => handleSelect(group.id)}
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
                        <Clock className="mr-2 h-4 w-4 opacity-50" />
                        <div className="flex items-center gap-2 flex-1">
                          <span className="truncate flex-1 opacity-50">{group.name}</span>
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
  );
} 