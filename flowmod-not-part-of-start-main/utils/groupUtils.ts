import { EnhancedGroupOption } from "../components/GroupSelector";

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

interface GroupType {
  id: string;
  name: string | null;
  whatsapp_group_id: string | null;
  master_group_id: string | null;
  created_at: string;
  updated_at: string;
}

interface MasterGroupType {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  groups?: GroupType[];
}

export function processEnhancedGroupOptions(
  whatsappGroups: WhatsAppGroup[],
  databaseGroups: DatabaseGroup[],
  masterGroups: MasterGroupType[]
): EnhancedGroupOption[] {
  const enhancedOptions: EnhancedGroupOption[] = [];
  const processedIds = new Set<string>();

  // Get all groups that are already in master groups
  const groupsInMasterGroups = masterGroups.flatMap(mg => mg.groups || []);

  // First, process WhatsApp API groups
  whatsappGroups.forEach((apiGroup) => {
    // Create a unique ID for API groups using the uuid
    const uniqueId = `api-${apiGroup.uuid}`;
    
    if (processedIds.has(uniqueId)) {
      return; // Skip if already processed
    }

    // Check if this group already exists in any master group
    const existingGroupInMaster = groupsInMasterGroups.find(g => 
      g.whatsapp_group_id === apiGroup.uuid || g.name === apiGroup.name
    );

    // Check if this group also exists in database
    const databaseMatch = databaseGroups.find(dbGroup => 
      dbGroup.whatsapp_group_id === apiGroup.uuid || 
      (dbGroup.name === apiGroup.name && dbGroup.whatsapp_group_id === null)
    );

    enhancedOptions.push({
      id: uniqueId,
      name: apiGroup.name,
      uuid: apiGroup.uuid,
      source: databaseMatch ? 'both' : 'api',
      hasExistingEntry: !!databaseMatch,
      size: apiGroup.size,
      databaseId: databaseMatch?.id,
      apiData: apiGroup,
      databaseData: databaseMatch,
      isInMasterGroup: !!existingGroupInMaster,
      masterGroupId: existingGroupInMaster?.master_group_id || undefined
    });

    processedIds.add(uniqueId);
  });

  // Then, process database groups that weren't matched with API groups
  databaseGroups.forEach((dbGroup) => {
    if (!dbGroup.name) return; // Skip groups without names

    // Create a unique ID for database groups
    const uniqueId = `db-${dbGroup.id}`;
    
    if (processedIds.has(uniqueId)) {
      return; // Skip if already processed
    }

    // Check if this database group was already included as part of an API group
    const alreadyIncluded = enhancedOptions.some(option => 
      option.databaseId === dbGroup.id || 
      (option.uuid === dbGroup.whatsapp_group_id && dbGroup.whatsapp_group_id)
    );

    if (alreadyIncluded) {
      return; // Skip if already included
    }

    // Check if this group is already in a master group
    const existingGroupInMaster = groupsInMasterGroups.find(g => g.id === dbGroup.id);

    enhancedOptions.push({
      id: uniqueId,
      name: dbGroup.name,
      uuid: dbGroup.whatsapp_group_id || undefined,
      source: 'database',
      hasExistingEntry: true,
      databaseId: dbGroup.id,
      databaseData: dbGroup,
      isInMasterGroup: !!existingGroupInMaster,
      masterGroupId: existingGroupInMaster?.master_group_id || undefined
    });

    processedIds.add(uniqueId);
  });

  // Sort options: available groups first, then groups already in master groups
  enhancedOptions.sort((a, b) => {
    // First sort by availability (available groups first)
    if (a.isInMasterGroup !== b.isInMasterGroup) {
      return a.isInMasterGroup ? 1 : -1;
    }
    
    // Then sort by source preference
    if (a.source !== b.source) {
      const sourceOrder = { 'api': 0, 'both': 1, 'database': 2 };
      return sourceOrder[a.source] - sourceOrder[b.source];
    }
    
    // Finally sort by name
    return a.name.localeCompare(b.name);
  });

  return enhancedOptions;
}

export async function loadWhatsAppGroups(organizationId: string): Promise<WhatsAppGroup[]> {
  try {
    const API_BASE_URL = 'https://www.flowiq.live';
    
    const response = await fetch(`${API_BASE_URL}/api/whatsapp-groups?organizationId=${organizationId}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to fetch WhatsApp groups');
    }

    const result = await response.json();
    
    if (!result.success || !result.groups) {
      throw new Error('Invalid response from WhatsApp groups API');
    }

    console.log(`✅ Loaded ${result.groups.length} WhatsApp groups from API`);
    return result.groups;
  } catch (error: any) {
    console.error('Error loading WhatsApp groups:', error);
    return [];
  }
} 