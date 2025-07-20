import { supabase } from "@/integrations/supabase/client";

export const uploadEventFile = async (
  organizationId: string,
  eventId: string,
  file: File
): Promise<string | null> => {
  try {
    // Create a unique filename with organization ID and event ID
    const fileExt = file.name.split('.').pop();
    const fileName = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9-_]/g, '_'); // Sanitize filename
    const filePath = `event-files/${organizationId}/${eventId}/${sanitizedFileName}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('flowmod-event-files')
      .upload(filePath, file, {
        upsert: true,
        contentType: file.type
      });
    
    if (uploadError) {
      console.error("Error uploading file:", uploadError);
      throw uploadError;
    }
    
    // Get the public URL
    const { data } = supabase.storage
      .from('flowmod-event-files')
      .getPublicUrl(filePath);
    
    return data.publicUrl;
  } catch (error: any) {
    console.error("Error uploading file:", error);
    throw error;
  }
};

export const deleteEventFile = async (fileUrl: string): Promise<void> => {
  try {
    // Extract the file path from the URL
    const url = new URL(fileUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.findIndex(part => part === 'flowmod-event-files');
    
    if (bucketIndex === -1) {
      throw new Error('Invalid file URL');
    }
    
    const filePath = pathParts.slice(bucketIndex + 1).join('/');
    
    const { error } = await supabase.storage
      .from('flowmod-event-files')
      .remove([filePath]);
    
    if (error) {
      console.error("Error deleting file:", error);
      throw error;
    }
  } catch (error: any) {
    console.error("Error deleting file:", error);
    throw error;
  }
};

export const getFileTypeFromUrl = (url: string): 'image' | 'pdf' | 'document' => {
  const extension = url.split('.').pop()?.toLowerCase();
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension || '')) {
    return 'image';
  }
  
  if (extension === 'pdf') {
    return 'pdf';
  }
  
  return 'document';
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}; 