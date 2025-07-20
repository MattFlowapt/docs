import { supabase } from "@/integrations/supabase/client";

interface MasterGroup {
  id: string;
  name: string;
  description: string | null;
}

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_datetime: string;
  end_datetime: string;
  timezone: string | null;
  location: string | null;
  presenter: string | null;
  special_guest: string | null;
  registration_url: string | null;
  file_url: string | null;
}

/**
 * Generates markdown content for a master group's events
 * This content is intended to be easily readable by AI agents
 */
export async function generateEventsMarkdown(masterGroupId: string): Promise<string> {
  try {
    // Fetch master group details
    const { data: masterGroupData, error: masterGroupError } = await supabase
      .from('flowmod_master_groups')
      .select('*')
      .eq('id', masterGroupId)
      .single();
    
    if (masterGroupError) throw masterGroupError;
    if (!masterGroupData) return "# Master Group not found";
    
    const masterGroup = masterGroupData as MasterGroup;
    
    // Fetch events for this master group
    const { data: eventsData, error: eventsError } = await supabase
      .from('flowmod_events')
      .select('*')
      .eq('master_group_id', masterGroupId)
      .order('start_datetime', { ascending: true });
    
    if (eventsError) throw eventsError;
    const events = eventsData || [];
    
    // Separate upcoming and past events using start_datetime
    const now = new Date();
    const upcomingEvents = events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate >= now;
    });
    const pastEvents = events.filter(event => {
      const eventDate = new Date(event.start_datetime);
      return eventDate < now;
    });
    
    // Generate markdown
    let markdown = `# ${masterGroup.name} Events\n\n`;
    
    // Add master group details
    if (masterGroup.description) {
      markdown += `${masterGroup.description}\n\n`;
    }
    
    markdown += `## Event Summary\n\n`;
    markdown += `- **Upcoming Events**: ${upcomingEvents.length}\n`;
    markdown += `- **Past Events**: ${pastEvents.length}\n`;
    markdown += `- **Total Events**: ${events.length}\n\n`;
    
    // Add upcoming events
    if (upcomingEvents.length > 0) {
      markdown += `## Upcoming Events (${upcomingEvents.length})\n\n`;
      
      upcomingEvents.forEach(event => {
        markdown += formatEventMarkdown(event, 'upcoming');
      });
    } else {
      markdown += `## Upcoming Events\n\nNo upcoming events scheduled.\n\n`;
    }
    
    // Add recent past events (last 10 for better context)
    if (pastEvents.length > 0) {
      const recentPastEvents = pastEvents.slice(-10).reverse(); // Last 10, most recent first
      
      markdown += `## Recent Past Events (${recentPastEvents.length} of ${pastEvents.length})\n\n`;
      
      recentPastEvents.forEach(event => {
        markdown += formatEventMarkdown(event, 'past');
      });
    }
    
    markdown += `\n*Last updated: ${new Date().toISOString()}*\n`;
    
    return markdown;
  } catch (error) {
    console.error("Error generating events markdown:", error);
    return "# Error generating events content";
  }
}

/**
 * Helper function to format event markdown consistently
 */
function formatEventMarkdown(event: Event, type: 'upcoming' | 'past'): string {
  let markdown = '';
  
  // Use start_datetime - clean implementation without fallbacks
  const startDate = new Date(event.start_datetime);
  const endDate = event.end_datetime ? new Date(event.end_datetime) : null;
  
  // Format dates
  const formattedStartDate = startDate.toLocaleDateString('en-US', {
    weekday: type === 'upcoming' ? 'long' : 'short',
    year: 'numeric',
    month: type === 'upcoming' ? 'long' : 'short',
    day: 'numeric'
  });
  
  const formattedStartTime = startDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: event.timezone || 'Africa/Johannesburg'
  });
  
  markdown += `### ${event.title}\n\n`;
  markdown += `**Event Type:** ${event.event_type}\n\n`;
  
  // Date and time display
  if (endDate && endDate.toDateString() !== startDate.toDateString()) {
    // Multi-day event
    const formattedEndDate = endDate.toLocaleDateString('en-US', {
      weekday: type === 'upcoming' ? 'long' : 'short',
      year: 'numeric',
      month: type === 'upcoming' ? 'long' : 'short',
      day: 'numeric'
    });
    const formattedEndTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: event.timezone || 'Africa/Johannesburg'
    });
    
    markdown += `**Event Dates:** ${formattedStartDate} at ${formattedStartTime} - ${formattedEndDate} at ${formattedEndTime}\n\n`;
  } else if (endDate && endDate.getTime() !== startDate.getTime()) {
    // Same day, different times
    const formattedEndTime = endDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: event.timezone || 'Africa/Johannesburg'
    });
    
    markdown += `**Date & Time:** ${formattedStartDate} from ${formattedStartTime} to ${formattedEndTime}\n\n`;
  } else {
    // Single datetime
    markdown += `**Date & Time:** ${formattedStartDate} at ${formattedStartTime}\n\n`;
  }
  
  if (event.timezone) {
    markdown += `**Timezone:** ${event.timezone}\n\n`;
  }
  
  if (event.location) {
    markdown += `**Location:** ${event.location}\n\n`;
  }
  
  if (event.presenter) {
    markdown += `**Presenter:** ${event.presenter}\n\n`;
  }
  
  if (event.special_guest) {
    markdown += `**Special Guest:** ${event.special_guest}\n\n`;
  }
  
  if (event.registration_url) {
    markdown += `**Registration:** ${event.registration_url}\n\n`;
  }
  
  if (event.description) {
    markdown += `**Description:** ${event.description}\n\n`;
  }
  
  // Include file attachment for BOTH upcoming AND past events
  if (event.file_url) {
    markdown += `**Attachment:** ${event.file_url}\n\n`;
  }
  
  markdown += `**Event ID:** ${event.id}\n\n`;
  markdown += "---\n\n";
  
  return markdown;
}

/**
 * Updates the events markdown content for a master group
 */
export async function updateEventsMarkdown(masterGroupId: string): Promise<void> {
  try {
    const markdown = await generateEventsMarkdown(masterGroupId);
    
    const { error } = await supabase
      .from('flowmod_master_groups')
      .update({ events_markdown: markdown })
      .eq('id', masterGroupId);
    
    if (error) throw error;
    
    console.log("Events markdown updated successfully for master group:", masterGroupId);
  } catch (error) {
    console.error("Error updating events markdown:", error);
  }
} 