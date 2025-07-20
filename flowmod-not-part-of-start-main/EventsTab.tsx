import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { Calendar, PlusCircle, Edit, Trash2, FileText, Clock, MapPin, Users, Link, FileIcon, ImageIcon, Globe2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FileUpload } from "./components/FileUpload";
import { uploadEventFile, deleteEventFile, getFileTypeFromUrl } from "./utils/fileUpload";
import { updateEventsMarkdown } from "./utils/markdownGenerator";
import { COMMON_TIMEZONES, getCurrentTimezone, formatTimezoneDisplay } from "./utils/timezoneUtils";
import { v4 as uuidv4 } from "uuid";

type EventType = {
  id: string;
  organization_id: string;
  event_type: string;
  title: string;
  description: string;
  location: string | null;
  presenter: string | null;
  special_guest: string | null;
  registration_url: string | null;
  file_url: string | null;
  created_at: string;
  updated_at: string;
  start_datetime: string;
  end_datetime: string;
  timezone: string | null;
  master_group_id: string;
};

interface EventsTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

export function EventsTab({ masterGroupId, isLoading }: EventsTabProps) {
  const { currentOrganization } = useOrganization();
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [eventDetailsOpen, setEventDetailsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  
  const [newEvent, setNewEvent] = useState({
    eventType: "",
    customEventType: "",
    title: "",
    description: "",
    location: "",
    presenter: "",
    specialGuest: "",
    registrationUrl: "",
    startDate: new Date(),
    startTime: "09:00",
    endDate: new Date(),
    endTime: "10:00",
    isMultiDay: false,
    timezone: getCurrentTimezone(),
  });

  // File upload state
  const [eventFile, setEventFile] = useState<File | null>(null);
  const [eventFileUrl, setEventFileUrl] = useState<string | null>(null);
  
  // Edit file state
  const [editEventFile, setEditEventFile] = useState<File | null>(null);
  const [editEventFileUrl, setEditEventFileUrl] = useState<string | null>(null);
  
  // Edit form state for date ranges
  const [editForm, setEditForm] = useState({
    startDate: new Date(),
    startTime: "09:00",
    endDate: new Date(), 
    endTime: "10:00",
    isMultiDay: false,
    timezone: getCurrentTimezone(),
  });

  // Input validations
  const [errors, setErrors] = useState({
    eventType: false,
    title: false,
    description: false,
  });
  
  useEffect(() => {
    if (masterGroupId && currentOrganization) {
      fetchEvents();
    }
  }, [masterGroupId, currentOrganization, eventTypeFilter]);
  
  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from("flowmod_events")
        .select("*")
        .eq("master_group_id", masterGroupId)
        .eq("organization_id", currentOrganization?.id);
      
      if (eventTypeFilter !== "all") {
        query = query.eq("event_type", eventTypeFilter);
      }
      
              query = query.order("start_datetime", { ascending: false });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      setEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
      toast.error("Failed to load events");
    } finally {
      setLoading(false);
    }
  };
  
  const prepareNewEventData = () => {
    const finalEventType = newEvent.eventType === "custom" 
      ? newEvent.customEventType.trim() 
      : newEvent.eventType.trim();
    
    // Combine date and time for start datetime
    const [startHours, startMinutes] = newEvent.startTime.split(':').map(Number);
    const startDateTime = new Date(newEvent.startDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    
    // Combine date and time for end datetime
    const [endHours, endMinutes] = newEvent.endTime.split(':').map(Number);
    const endDateTime = new Date(newEvent.isMultiDay ? newEvent.endDate : newEvent.startDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);
      
    return {
      event_type: finalEventType,
      title: newEvent.title.trim(),
      description: newEvent.description.trim(),
      location: newEvent.location.trim() || null,
      presenter: newEvent.presenter.trim() || null,
      special_guest: newEvent.specialGuest.trim() || null,
      registration_url: newEvent.registrationUrl.trim() || null,
      master_group_id: masterGroupId,
      organization_id: currentOrganization?.id,
      // Using start_datetime and end_datetime for date ranges
      start_datetime: startDateTime.toISOString(),
      end_datetime: endDateTime.toISOString(),
      timezone: newEvent.timezone,
      file_url: null // Will be updated after file upload
    };
  };
  
  const validateEventForm = () => {
    const newErrors = {
      eventType: false,
      title: false,
      description: false,
    };
    
    let isValid = true;
    
    if (newEvent.eventType === "") {
      newErrors.eventType = true;
      isValid = false;
    }
    
    if (newEvent.eventType === "custom" && !newEvent.customEventType.trim()) {
      newErrors.eventType = true;
      isValid = false;
    }
    
    if (!newEvent.title.trim()) {
      newErrors.title = true;
      isValid = false;
    }
    
    if (!newEvent.description.trim()) {
      newErrors.description = true;
      isValid = false;
    }
    
    setErrors(newErrors);
    return isValid;
  };
  
  const handleCreateEvent = async () => {
    try {
      if (!validateEventForm()) {
        toast.error("Please fill in all required fields");
        return;
      }
      
      const eventData = prepareNewEventData();
      
      // Create the event first to get the ID
      const { data: createdEvent, error } = await supabase
        .from("flowmod_events")
        .insert([eventData])
        .select()
        .single();
      
      if (error) throw error;
      
      let fileUrl = null;
      
      // Upload file if one is selected
      if (eventFile && currentOrganization?.id) {
        try {
          fileUrl = await uploadEventFile(
            currentOrganization.id,
            createdEvent.id,
            eventFile
          );
          
          // Update the event with the file URL
          const { error: updateError } = await supabase
            .from("flowmod_events")
            .update({ file_url: fileUrl })
            .eq("id", createdEvent.id);
          
          if (updateError) throw updateError;
        } catch (uploadError: any) {
          console.error("Error uploading file:", uploadError);
          toast.error(`Error uploading file: ${uploadError.message}`);
          // Don't fail the entire operation if file upload fails
        }
      }
      
      // Automatically regenerate events markdown
      if (masterGroupId) {
        try {
          await updateEventsMarkdown(masterGroupId);
          console.log("Events markdown automatically updated after creation");
        } catch (markdownError) {
          console.error("Error auto-updating events markdown:", markdownError);
          // Don't fail the operation if markdown update fails
        }
      }
      
      toast.success("Event created successfully");
      setCreateDialogOpen(false);
      resetEventForm();
      fetchEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      toast.error("Failed to create event");
    }
  };
  
  const handleUpdateEvent = async () => {
    try {
      if (!selectedEvent) return;
      
      // Prepare updated date range data from edit form
      const [startHours, startMinutes] = editForm.startTime.split(':').map(Number);
      const startDateTime = new Date(editForm.startDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);
      
      const [endHours, endMinutes] = editForm.endTime.split(':').map(Number);
      const endDateTime = new Date(editForm.isMultiDay ? editForm.endDate : editForm.startDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);
      
      let fileUrl = editEventFileUrl;
      
      // Handle file upload if a new file is selected
      if (editEventFile && currentOrganization?.id) {
        try {
          // Delete old file if it exists and we're replacing it
          if (selectedEvent.file_url && selectedEvent.file_url !== editEventFileUrl) {
            await deleteEventFile(selectedEvent.file_url);
          }
          
          // Upload new file
          fileUrl = await uploadEventFile(
            currentOrganization.id,
            selectedEvent.id,
            editEventFile
          );
        } catch (uploadError: any) {
          console.error("Error uploading file:", uploadError);
          toast.error(`Error uploading file: ${uploadError.message}`);
          // Don't fail the entire operation if file upload fails
        }
      } else if (!editEventFileUrl && selectedEvent.file_url) {
        // File was removed, delete the old file
        try {
          await deleteEventFile(selectedEvent.file_url);
          fileUrl = null;
        } catch (deleteError: any) {
          console.error("Error deleting file:", deleteError);
          // Don't fail the operation if file deletion fails
        }
      }
      
      const { data, error } = await supabase
        .from("flowmod_events")
        .update({
          event_type: selectedEvent.event_type,
          title: selectedEvent.title,
          description: selectedEvent.description,
          location: selectedEvent.location,
          presenter: selectedEvent.presenter,
          special_guest: selectedEvent.special_guest,
          registration_url: selectedEvent.registration_url,
          // Using calculated date range from edit form
          start_datetime: startDateTime.toISOString(),
          end_datetime: endDateTime.toISOString(),
          timezone: editForm.timezone,
          file_url: fileUrl
        })
        .eq("id", selectedEvent.id)
        .select();
      
      if (error) throw error;
      
      // Automatically regenerate events markdown
      if (masterGroupId) {
        try {
          await updateEventsMarkdown(masterGroupId);
          console.log("Events markdown automatically updated after update");
        } catch (markdownError) {
          console.error("Error auto-updating events markdown:", markdownError);
          // Don't fail the operation if markdown update fails
        }
      }
      
      toast.success("Event updated successfully");
      setEditDialogOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      toast.error("Failed to update event");
    }
  };
  
  const handleDeleteEvent = async (eventId: string) => {
    try {
      // Delete associated file if it exists
      if (selectedEvent?.file_url) {
        try {
          await deleteEventFile(selectedEvent.file_url);
        } catch (fileError) {
          console.error("Error deleting file:", fileError);
          // Don't fail the entire operation if file deletion fails
        }
      }
      
      const { error } = await supabase
        .from("flowmod_events")
        .delete()
        .eq("id", eventId);
      
      if (error) throw error;
      
      // Automatically regenerate events markdown
      if (masterGroupId) {
        try {
          await updateEventsMarkdown(masterGroupId);
          console.log("Events markdown automatically updated after deletion");
        } catch (markdownError) {
          console.error("Error auto-updating events markdown:", markdownError);
          // Don't fail the operation if markdown update fails
        }
      }
      
      toast.success("Event deleted successfully");
      setEventDetailsOpen(false);
      fetchEvents();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Failed to delete event");
    }
  };
  
  const handleEventClick = (event: EventType) => {
    setSelectedEvent(event);
    setEventDetailsOpen(true);
  };
  
  const handleEditClick = (event: EventType) => {
    setSelectedEvent(event);
    setEditEventFile(null);
    setEditEventFileUrl(event.file_url);
    
    // Populate edit form with existing event data
    const startDate = new Date(event.start_datetime);
    const endDate = new Date(event.end_datetime);
    const isMultiDay = startDate.toDateString() !== endDate.toDateString();
    
    setEditForm({
      startDate: startDate,
      startTime: startDate.toTimeString().slice(0, 5), // HH:MM format
      endDate: endDate,
      endTime: endDate.toTimeString().slice(0, 5), // HH:MM format
      isMultiDay: isMultiDay,
      timezone: event.timezone || getCurrentTimezone(),
    });
    
    setEditDialogOpen(true);
  };
  
  const resetEventForm = () => {
    setNewEvent({
      eventType: "",
      customEventType: "",
      title: "",
      description: "",
      location: "",
      presenter: "",
      specialGuest: "",
      registrationUrl: "",
      startDate: new Date(),
      startTime: "09:00",
      endDate: new Date(),
      endTime: "10:00",
      isMultiDay: false,
      timezone: getCurrentTimezone(),
    });
    
    setErrors({
      eventType: false,
      title: false,
      description: false,
    });
    
    // Reset file state
    setEventFile(null);
    setEventFileUrl(null);
  };
  
  const formatDateTime = (event: EventType) => {
    // Clean implementation - only uses new start_datetime and end_datetime fields
    const startDate = event.start_datetime;
    if (!startDate) return "No date";
    
    const start = new Date(startDate);
    const end = event.end_datetime ? new Date(event.end_datetime) : null;
    
    // Format options
    const dateOptions: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: event.timezone || 'UTC'
    };
    
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: event.timezone || 'UTC'
    };
    
    // Check if multi-day event
    if (end && end.toDateString() !== start.toDateString()) {
      const endDateFormatted = end.toLocaleDateString('en-US', dateOptions);
      const endTimeFormatted = end.toLocaleTimeString('en-US', timeOptions);
      const startDateFormatted = start.toLocaleDateString('en-US', dateOptions);
      const startTimeFormatted = start.toLocaleTimeString('en-US', timeOptions);
      
      return `${startDateFormatted} ${startTimeFormatted} - ${endDateFormatted} ${endTimeFormatted}`;
    }
    
    // Same day or single time
    const dateFormatted = start.toLocaleDateString('en-US', dateOptions);
    const startTimeFormatted = start.toLocaleTimeString('en-US', timeOptions);
    
    if (end && end.getTime() !== start.getTime()) {
      const endTimeFormatted = end.toLocaleTimeString('en-US', timeOptions);
      return `${dateFormatted} ${startTimeFormatted} - ${endTimeFormatted}`;
    }
    
    return `${dateFormatted} ${startTimeFormatted}`;
  };
  
  // Get unique event types for filtering
  const eventTypes = ["all", ...new Set(events.map(event => event.event_type))];
  
  // Common event types for selection
  const commonEventTypes = [
    "Wellness Wednesday",
    "Community Meeting", 
    "Training Session",
    "Workshop",
    "Webinar",
    "Conference",
    "Social Gathering",
    "custom"
  ];
  

  
  if (!masterGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No master group selected</h3>
        <p className="text-muted-foreground text-center">
          Please select a master group from the dropdown above or create one in the Groups tab.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Events</h2>
        
        <div className="flex flex-wrap gap-2 items-center">
          <div className="flex items-center space-x-2">
            <Label htmlFor="eventTypeFilter" className="whitespace-nowrap">Filter by type:</Label>
            <select
              id="eventTypeFilter"
              className="h-9 w-[200px] rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
            >
              {eventTypes.map(type => (
                <option key={type} value={type}>
                  {type === "all" ? "All event types" : type}
                </option>
              ))}
            </select>
          </div>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white border-0">
                <PlusCircle className="h-4 w-4" />
                <span>Create Event</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Event</DialogTitle>
                <DialogDescription>
                  Add an event that the AI moderator can reference when moderating conversations.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-2">
                <Tabs defaultValue="details" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="details">Event Details</TabsTrigger>
                    <TabsTrigger value="datetime">Date & Location</TabsTrigger>
                    <TabsTrigger value="file">File Attachment</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label htmlFor="eventType" className={errors.eventType ? "text-destructive" : ""}>
                        Event Type <span className="text-destructive">*</span>
                      </Label>
                      <select
                        id="eventType"
                        className={`h-9 w-full rounded-md border ${errors.eventType ? 'border-destructive' : 'border-input'} bg-background px-3 py-1 text-sm shadow-sm transition-colors`}
                        value={newEvent.eventType}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, eventType: e.target.value }))}
                      >
                        <option value="">Select event type</option>
                        {commonEventTypes.map(type => (
                          <option key={type} value={type}>
                            {type === "custom" ? "Custom event type..." : type}
                          </option>
                        ))}
                      </select>
                      {errors.eventType && <p className="text-xs text-destructive">Event type is required</p>}
                    </div>
                    
                    {newEvent.eventType === "custom" && (
                      <div className="space-y-2">
                        <Label htmlFor="customEventType" className={errors.eventType ? "text-destructive" : ""}>
                          Custom Event Type <span className="text-destructive">*</span>
                        </Label>
                        <Input 
                          id="customEventType" 
                          placeholder="Enter custom event type" 
                          value={newEvent.customEventType}
                          onChange={(e) => setNewEvent(prev => ({ ...prev, customEventType: e.target.value }))}
                          className={errors.eventType ? "border-destructive" : ""}
                        />
                        {errors.eventType && <p className="text-xs text-destructive">Custom event type is required</p>}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="title" className={errors.title ? "text-destructive" : ""}>
                        Event Title <span className="text-destructive">*</span>
                      </Label>
                      <Input 
                        id="title" 
                        placeholder="Enter event title" 
                        value={newEvent.title}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                        className={errors.title ? "border-destructive" : ""}
                      />
                      {errors.title && <p className="text-xs text-destructive">Event title is required</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="description" className={errors.description ? "text-destructive" : ""}>
                        Description <span className="text-destructive">*</span>
                      </Label>
                      <Textarea 
                        id="description" 
                        placeholder="Provide details about the event" 
                        value={newEvent.description}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        rows={4}
                        className={errors.description ? "border-destructive" : ""}
                      />
                      {errors.description && <p className="text-xs text-destructive">Description is required</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="presenter">Presenter</Label>
                      <Input 
                        id="presenter" 
                        placeholder="Event presenter (if applicable)" 
                        value={newEvent.presenter}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, presenter: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="specialGuest">Special Guest</Label>
                      <Input 
                        id="specialGuest" 
                        placeholder="Special guest (if applicable)" 
                        value={newEvent.specialGuest}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, specialGuest: e.target.value }))}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="datetime" className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Multi-day Event</Label>
                        <Switch
                          checked={newEvent.isMultiDay}
                          onCheckedChange={(checked) => setNewEvent(prev => ({ 
                            ...prev, 
                            isMultiDay: checked,
                            endDate: checked ? prev.endDate : prev.startDate
                          }))}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enable for events spanning multiple days
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Start Date & Time</Label>
                        <div className="flex flex-col gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" className="w-full justify-start text-left font-normal">
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {newEvent.startDate ? format(newEvent.startDate, "PPP") : <span>Pick start date</span>}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                              <CalendarComponent
                                mode="single"
                                selected={newEvent.startDate}
                                onSelect={(date) => {
                                  if (date) {
                                    setNewEvent(prev => ({ 
                                      ...prev, 
                                      startDate: date,
                                      endDate: prev.isMultiDay ? prev.endDate : date
                                    }));
                                  }
                                }}
                              />
                            </PopoverContent>
                          </Popover>
                          
                          <Input 
                            type="time"
                            value={newEvent.startTime}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                            className="w-full"
                          />
                        </div>
                      </div>
                      
                      {newEvent.isMultiDay && (
                        <div className="space-y-2">
                          <Label>End Date & Time</Label>
                          <div className="flex flex-col gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left font-normal">
                                  <CalendarIcon className="mr-2 h-4 w-4" />
                                  {newEvent.endDate ? format(newEvent.endDate, "PPP") : <span>Pick end date</span>}
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0">
                                <CalendarComponent
                                  mode="single"
                                  selected={newEvent.endDate}
                                  onSelect={(date) => date && setNewEvent(prev => ({ ...prev, endDate: date }))}
                                  disabled={(date) => date < newEvent.startDate}
                                />
                              </PopoverContent>
                            </Popover>
                            
                            <Input 
                              type="time"
                              value={newEvent.endTime}
                              onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                              className="w-full"
                            />
                          </div>
                        </div>
                      )}
                      
                      {!newEvent.isMultiDay && (
                        <div className="space-y-2">
                          <Label>End Time (Same Day)</Label>
                          <Input 
                            type="time"
                            value={newEvent.endTime}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="timezone">
                        <Globe2 className="inline h-4 w-4 mr-1" />
                        Timezone
                      </Label>
                      <Select
                        value={newEvent.timezone}
                        onValueChange={(value) => setNewEvent(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px]">
                          {COMMON_TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Current: {formatTimezoneDisplay(newEvent.timezone)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input 
                        id="location" 
                        placeholder="Event location (if applicable)" 
                        value={newEvent.location}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, location: e.target.value }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="registrationUrl">Registration URL</Label>
                      <Input 
                        id="registrationUrl" 
                        placeholder="Registration link (if applicable)" 
                        value={newEvent.registrationUrl}
                        onChange={(e) => setNewEvent(prev => ({ ...prev, registrationUrl: e.target.value }))}
                      />
                    </div>
                    
                    <Alert>
                      <AlertDescription>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-destructive font-medium">*</span> Fields marked with an asterisk are required.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                  
                  <TabsContent value="file" className="space-y-4 pt-4">
                    <FileUpload
                      file={eventFile}
                      fileUrl={eventFileUrl}
                      onFileChange={setEventFile}
                      onFileUrlChange={setEventFileUrl}
                      label="Event File (Optional)"
                      accept="image/*,.pdf,.doc,.docx,.txt"
                      maxSize={10}
                    />
                    
                    <Alert>
                      <AlertDescription>
                        <p className="text-xs text-muted-foreground">
                          You can attach images, PDFs, or documents related to this event. Maximum file size is 10MB.
                        </p>
                      </AlertDescription>
                    </Alert>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter className="mt-4">
                <Button variant="outline" onClick={() => {
                  setCreateDialogOpen(false);
                  resetEventForm();
                }}>Cancel</Button>
                <Button onClick={handleCreateEvent}>Create Event</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        {loading || isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="w-full h-[220px] animate-pulse bg-muted/40"></Card>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-medium mb-2">No events found</h3>
            <p className="text-muted-foreground mb-6">
              {eventTypeFilter !== "all" 
                ? `No ${eventTypeFilter} events found. Try a different filter or create a new event.`
                : "Create your first event for the AI moderator to reference"
              }
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>Create Your First Event</Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Card 
                key={event.id} 
                className="overflow-hidden cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="mb-2">{event.event_type}</Badge>
                      {event.file_url && (
                        <div className="mb-2">
                          {getFileTypeFromUrl(event.file_url) === 'image' ? (
                            <ImageIcon className="h-4 w-4 text-blue-500" />
                          ) : (
                            <FileIcon className="h-4 w-4 text-green-500" />
                          )}
                        </div>
                      )}
                    </div>
                    <Badge variant="outline">{event.timezone || "No timezone"}</Badge>
                  </div>
                  <CardTitle className="line-clamp-1">{event.title}</CardTitle>
                  
                  <div className="flex items-center text-sm text-muted-foreground mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1.5" />
                                                  <span>{formatDateTime(event)}</span>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {event.description}
                  </p>
                  
                  {event.presenter && (
                    <div className="flex items-center mt-2 text-sm">
                      <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span>{event.presenter}</span>
                    </div>
                  )}
                  
                  {event.location && (
                    <div className="flex items-center mt-1 text-sm">
                      <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </CardContent>
                
                <CardFooter className="pt-2 border-t flex justify-between">
                  {event.registration_url ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs flex items-center gap-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(event.registration_url, '_blank');
                      }}
                    >
                      <Link className="h-3.5 w-3.5" />
                      Registration Link
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs">View Details</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Event details dialog */}
      <Dialog open={eventDetailsOpen} onOpenChange={setEventDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <Badge variant="outline">{selectedEvent?.event_type}</Badge>
              <Badge variant="outline">{selectedEvent?.timezone || "No timezone"}</Badge>
            </div>
            <DialogTitle className="text-xl mt-2">{selectedEvent?.title}</DialogTitle>
            <DialogDescription>
                                {selectedEvent && formatDateTime(selectedEvent)}
            </DialogDescription>
            {selectedEvent && (
              <span className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>{formatDateTime(selectedEvent)}</span>
              </span>
            )}
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <div>
              <h3 className="text-sm font-medium mb-1">Description</h3>
              <p className="text-sm whitespace-pre-wrap">
                {selectedEvent?.description}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2">
              {selectedEvent?.presenter && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Presenter</h3>
                  <p className="text-sm flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {selectedEvent.presenter}
                  </p>
                </div>
              )}
              
              {selectedEvent?.special_guest && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Special Guest</h3>
                  <p className="text-sm flex items-center">
                    <Users className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {selectedEvent.special_guest}
                  </p>
                </div>
              )}
              
              {selectedEvent?.location && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Location</h3>
                  <p className="text-sm flex items-center">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {selectedEvent.location}
                  </p>
                </div>
              )}
            </div>
            
            {selectedEvent?.registration_url && (
              <div>
                <h3 className="text-sm font-medium mb-1">Registration Link</h3>
                <a 
                  href={selectedEvent.registration_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center text-sm text-blue-600 hover:underline"
                >
                  <Link className="h-3.5 w-3.5 mr-1.5" />
                  Register for this event
                </a>
              </div>
            )}
            
            {selectedEvent?.file_url && (
              <div>
                <h3 className="text-sm font-medium mb-2">Attached File</h3>
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/20">
                  <div className="w-12 h-12 bg-muted rounded flex items-center justify-center overflow-hidden border">
                    {getFileTypeFromUrl(selectedEvent.file_url) === 'image' ? (
                      <img 
                        src={selectedEvent.file_url} 
                        alt="Event attachment" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFileTypeFromUrl(selectedEvent.file_url) === 'pdf' ? (
                        <FileText className="h-6 w-6 text-red-500" />
                      ) : (
                        <FileIcon className="h-6 w-6 text-muted-foreground" />
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {selectedEvent.file_url.split('/').pop() || 'Attachment'}
                    </p>
                    <a 
                      href={selectedEvent.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline"
                    >
                      View file
                    </a>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <h3 className="text-sm font-medium mb-1">Created</h3>
              <p className="text-xs text-muted-foreground">
                {selectedEvent ? new Date(selectedEvent.created_at).toLocaleString('en-US', {
                  weekday: 'short',
                  year: 'numeric', 
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : ""}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between mt-4">
            <Button
              variant="destructive"
              className="gap-1"
              onClick={() => selectedEvent && handleDeleteEvent(selectedEvent.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete Event
            </Button>
            
            <Button
              variant="outline"
              className="gap-1"
              onClick={() => {
                setEventDetailsOpen(false);
                handleEditClick(selectedEvent!);
              }}
            >
              <Edit className="h-4 w-4" />
              Edit Event
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit event dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
            <DialogDescription>
              Update event details for the AI moderator.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-2">
            <Tabs defaultValue="details" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Event Details</TabsTrigger>
                <TabsTrigger value="datetime">Date & Location</TabsTrigger>
                <TabsTrigger value="file">File Attachment</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="editEventType">Event Type</Label>
                  <Input 
                    id="editEventType" 
                    value={selectedEvent?.event_type || ""}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, event_type: e.target.value } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editTitle">Event Title</Label>
                  <Input 
                    id="editTitle" 
                    value={selectedEvent?.title || ""}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, title: e.target.value } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editDescription">Description</Label>
                  <Textarea 
                    id="editDescription" 
                    value={selectedEvent?.description || ""}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, description: e.target.value } : null)}
                    rows={4}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editPresenter">Presenter</Label>
                  <Input 
                    id="editPresenter" 
                    value={selectedEvent?.presenter || ""}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, presenter: e.target.value } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editSpecialGuest">Special Guest</Label>
                  <Input 
                    id="editSpecialGuest" 
                    value={selectedEvent?.special_guest || ""}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, special_guest: e.target.value } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editLocation">Location</Label>
                  <Input 
                    id="editLocation" 
                    value={selectedEvent?.location || ""}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, location: e.target.value } : null)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editRegistrationUrl">Registration URL</Label>
                  <Input 
                    id="editRegistrationUrl" 
                    value={selectedEvent?.registration_url || ""}
                    onChange={(e) => setSelectedEvent(prev => prev ? { ...prev, registration_url: e.target.value } : null)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="datetime" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Multi-day Event</Label>
                    <Switch
                      checked={editForm.isMultiDay}
                      onCheckedChange={(checked) => setEditForm(prev => ({ 
                        ...prev, 
                        isMultiDay: checked,
                        endDate: checked ? prev.endDate : prev.startDate
                      }))}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enable for events spanning multiple days
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date & Time</Label>
                    <div className="flex flex-col gap-2">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start text-left font-normal">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {editForm.startDate ? format(editForm.startDate, "PPP") : <span>Pick start date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <CalendarComponent
                            mode="single"
                            selected={editForm.startDate}
                            onSelect={(date) => {
                              if (date) {
                                setEditForm(prev => ({ 
                                  ...prev, 
                                  startDate: date,
                                  endDate: prev.isMultiDay ? prev.endDate : date
                                }));
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                      
                      <Input 
                        type="time"
                        value={editForm.startTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>
                  
                  {editForm.isMultiDay && (
                    <div className="space-y-2">
                      <Label>End Date & Time</Label>
                      <div className="flex flex-col gap-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left font-normal">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {editForm.endDate ? format(editForm.endDate, "PPP") : <span>Pick end date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <CalendarComponent
                              mode="single"
                              selected={editForm.endDate}
                              onSelect={(date) => date && setEditForm(prev => ({ ...prev, endDate: date }))}
                              disabled={(date) => date < editForm.startDate}
                            />
                          </PopoverContent>
                        </Popover>
                        
                        <Input 
                          type="time"
                          value={editForm.endTime}
                          onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}
                  
                  {!editForm.isMultiDay && (
                    <div className="space-y-2">
                      <Label>End Time (Same Day)</Label>
                      <Input 
                        type="time"
                        value={editForm.endTime}
                        onChange={(e) => setEditForm(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="editTimezone">
                    <Globe2 className="inline h-4 w-4 mr-1" />
                    Timezone
                  </Label>
                  <Select
                    value={editForm.timezone}
                    onValueChange={(value) => setEditForm(prev => ({ ...prev, timezone: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent className="max-h-[300px]">
                      {COMMON_TIMEZONES.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Current: {formatTimezoneDisplay(editForm.timezone)}
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="file" className="space-y-4 pt-4">
                <FileUpload
                  file={editEventFile}
                  fileUrl={editEventFileUrl}
                  onFileChange={setEditEventFile}
                  onFileUrlChange={setEditEventFileUrl}
                  label="Event File (Optional)"
                  accept="image/*,.pdf,.doc,.docx,.txt"
                  maxSize={10}
                />
                
                <Alert>
                  <AlertDescription>
                    <p className="text-xs text-muted-foreground">
                      You can attach images, PDFs, or documents related to this event. Maximum file size is 10MB.
                    </p>
                  </AlertDescription>
                </Alert>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleUpdateEvent}>Update Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 