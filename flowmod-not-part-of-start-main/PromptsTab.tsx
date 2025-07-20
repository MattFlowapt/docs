import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { FileText, Copy, Save, Sparkles, MessageSquare, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type PromptType = {
  id: string;
  organization_id: string;
  master_group_id: string;
  type: string;
  text: string;
  created_at: string;
  updated_at: string;
};

interface PromptsTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

export function PromptsTab({ masterGroupId, isLoading }: PromptsTabProps) {
  const { currentOrganization } = useOrganization();
  const [mainPrompt, setMainPrompt] = useState<PromptType | null>(null);
  const [mainPromptText, setMainPromptText] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [masterGroupName, setMasterGroupName] = useState<string>("");
  
  useEffect(() => {
    if (currentOrganization && masterGroupId) {
      fetchMainPrompt();
      fetchMasterGroupName();
    }
  }, [currentOrganization, masterGroupId]);
  
  // Track changes to show unsaved indicator
  useEffect(() => {
    const originalText = mainPrompt?.text || "";
    setHasUnsavedChanges(mainPromptText !== originalText && mainPromptText.trim() !== "");
  }, [mainPromptText, mainPrompt?.text]);
  
  const fetchMasterGroupName = async () => {
    if (!masterGroupId) return;
    
    try {
      const { data, error } = await supabase
        .from("flowmod_master_groups")
        .select("name")
        .eq("id", masterGroupId)
        .single();
      
      if (error) throw error;
      
      setMasterGroupName(data.name || "");
    } catch (error) {
      console.error("Error fetching master group name:", error);
    }
  };
  
  const fetchMainPrompt = async () => {
    if (!masterGroupId) return;
    
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from("flowmod_prompts")
        .select("*")
        .eq("organization_id", currentOrganization?.id)
        .eq("master_group_id", masterGroupId)
        .eq("type", "main")
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      setMainPrompt(data);
      setMainPromptText(data?.text || "");
    } catch (error) {
      console.error("Error fetching main prompt:", error);
      toast.error("Failed to load prompt");
    } finally {
      setLoading(false);
    }
  };
  
  const saveMainPrompt = async () => {
    if (!masterGroupId) {
      toast.error("Please select a master group first");
      return;
    }
    
    try {
      setSaving(true);
      
      if (!mainPromptText.trim()) {
        toast.error("Prompt text cannot be empty");
        return;
      }
      
      if (mainPrompt) {
        // Update existing prompt
        const { error } = await supabase
          .from("flowmod_prompts")
          .update({ 
            text: mainPromptText.trim(),
            updated_at: new Date().toISOString()
          })
          .eq("id", mainPrompt.id);
        
        if (error) throw error;
        
        toast.success("Main prompt updated successfully! 🎉");
      } else {
        // Create new prompt
        const { error } = await supabase
          .from("flowmod_prompts")
          .insert([{
            type: "main",
            text: mainPromptText.trim(),
            organization_id: currentOrganization?.id,
            master_group_id: masterGroupId
          }]);
        
        if (error) throw error;
        
        toast.success("Main prompt created successfully! 🚀");
      }
      
      // Refresh prompt
      fetchMainPrompt();
    } catch (error) {
      console.error("Error saving main prompt:", error);
      toast.error("Failed to save prompt");
    } finally {
      setSaving(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard! 📋");
  };

  const getDefaultPrompt = () => {
    return `You moderate this WhatsApp group. When someone is inappropriate:
1. Use send_private_message to scold them privately (phone number is automatic from message)
2. Use send_group_message to tell group "User has been privately messaged about their behavior"

Only intervene for: swearing, harassment, spam, threats.
Don't respond to normal conversations.

## Tone & Style
* Speak as a helpful human moderator, not a chatbot. Don't sound robotic.
* No trailing "feel free to ask"; answer decisively as you are not a chatbot, you are a moderator who intervenes.
* Use emojis sparingly and naturally.
* Bold in WhatsApp uses single asterisks *like this* and not **like this**
* Italic is _like this_

## Mentioning People
When referring to people, use this exact format: "\`\`\`@Name,\`\`\`" (e.g., "\`\`\`@Matt,\`\`\`" or "\`\`\`@Rowan,\`\`\`").

## 24-Hour "EXIT" Rule
Use this rule to keep the chat tidy and avoid spamming the same answer.
* If 24 hours have elapsed or the question has materially changed, respond normally.
* "Materially changed" means new details, a different angle, or any extra info that makes your previous answer insufficient.

Use this rule rigidly: it's the gatekeeper to maintaining quality control.`;
  };

  const loadDefaultPrompt = () => {
    setMainPromptText(getDefaultPrompt());
  };
  
  if (!masterGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 max-w-md text-center">
          <MessageSquare className="h-16 w-16 text-blue-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-gray-800">No Master Group Selected</h3>
          <p className="text-gray-600">
            Please select a master group from the dropdown above or create one in the Groups tab to configure your AI moderator.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 h-full flex flex-col w-full">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 p-2 rounded-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            AI Moderator Prompt
          </h2>
        </div>
        <p className="text-gray-600 text-lg">
          Configure how your AI moderator behaves in WhatsApp groups for <span className="font-semibold text-gray-800">{masterGroupName}</span>. This prompt defines the personality, rules, and intervention style.
        </p>
      </div>

      {/* Status Banner */}
      {mainPrompt && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">Prompt is active and working</p>
            <p className="text-green-600 text-sm">Last updated: {new Date(mainPrompt.updated_at).toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Main Prompt Editor */}
      <Card className="flex-1 flex flex-col shadow-lg border-0 bg-gradient-to-br from-white to-gray-50">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">Main System Prompt</span>
              {hasUnsavedChanges && (
                <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200">
                  Unsaved changes
                </Badge>
              )}
            </div>
            {!mainPrompt && (
              <Button
                variant="outline"
                size="sm"
                onClick={loadDefaultPrompt}
                className="text-blue-600 border-blue-200 hover:bg-blue-50"
              >
                Load Template
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {loading || isLoading ? (
            <div className="flex-1 animate-pulse bg-gray-100 rounded-xl min-h-[500px]"></div>
          ) : (
            <>
              <div className="flex-1 flex flex-col">
                <Textarea
                  value={mainPromptText}
                  onChange={(e) => setMainPromptText(e.target.value)}
                  placeholder="Define how your AI moderator should behave...

Example:
- What should trigger interventions?
- How should it communicate?
- What tone should it use?
- Any specific rules for your community?"
                  className="flex-1 min-h-[500px] font-mono text-sm resize-none border-2 border-gray-200 focus:border-purple-400 rounded-xl bg-white/80 backdrop-blur-sm transition-all duration-200"
                />
              </div>
              
              {/* Action Buttons */}
              <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-500">
                  {mainPromptText.length} characters
                </div>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 hover:bg-gray-50"
                    onClick={() => copyToClipboard(mainPromptText)}
                    disabled={!mainPromptText.trim()}
                  >
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  
                  <Button
                    size="sm"
                    className="gap-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg transition-all duration-200"
                    onClick={saveMainPrompt}
                    disabled={saving || !mainPromptText.trim() || !hasUnsavedChanges}
                  >
                    <Save className="h-4 w-4" />
                    {saving ? "Saving..." : "Save Prompt"}
                  </Button>
                </div>
              </div>

              {/* Help Section */}
              {!mainPrompt && (
                <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
                  <h4 className="font-medium text-blue-900 mb-2">💡 Getting Started</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Define what behaviors should trigger interventions (swearing, harassment, spam)</li>
                    <li>• Set the tone and personality of your moderator</li>
                    <li>• Specify how it should communicate with users</li>
                    <li>• Click "Load Template" above for a ready-to-use example</li>
                  </ul>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 