import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { 
  Shield, 
  TrendingUp, 
  Award, 
  Target, 
  Zap, 
  Heart, 
  Ban, 
  Megaphone, 
  AlertTriangle, 
  Repeat, 
  Eye, 
  FileX, 
  HelpCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  BarChart3,
  Activity,
  Users,
  MessageSquare,
  Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type InterventionMessage = {
  id: string;
  organization_id: string;
  message: string;
  sender_type: string;
  created_at: string;
  intervention_type: string | null;
  intervened: boolean | null;
  intervened_message_id: string | null;
  participant?: {
    id: string;
    full_name: string | null;
    phone_number: string | null;
  };
  group?: {
    id: string;
    name: string | null;
  };
};

type InterventionStats = {
  total: number;
  types: Record<string, number>;
  todayCount: number;
  weekCount: number;
  successRate: number;
};

interface InterventionsTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

const INTERVENTION_TYPES = {
  medical_verification: {
    text: "Medical Verification",
    icon: Heart,
    color: "bg-red-100 text-red-800",
    description: "Health-related claims requiring verification"
  },
  profanity: {
    text: "Profanity",
    icon: Ban,
    color: "bg-orange-100 text-orange-800",
    description: "Inappropriate language and offensive content"
  },
  self_promotion: {
    text: "Self Promotion",
    icon: Megaphone,
    color: "bg-yellow-100 text-yellow-800",
    description: "Unauthorized advertising and promotion"
  },
  harassment: {
    text: "Harassment",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800",
    description: "Bullying and targeted harassment"
  },
  spam: {
    text: "Spam",
    icon: Repeat,
    color: "bg-orange-100 text-orange-800",
    description: "Repetitive and unwanted messages"
  },
  threats: {
    text: "Threats",
    icon: Zap,
    color: "bg-red-100 text-red-800",
    description: "Threatening language and intimidation"
  },
  hate_speech: {
    text: "Hate Speech",
    icon: Eye,
    color: "bg-red-100 text-red-800",
    description: "Discriminatory and hateful content"
  },
  inappropriate_content: {
    text: "Inappropriate Content",
    icon: FileX,
    color: "bg-orange-100 text-orange-800",
    description: "Content not suitable for the group"
  },
  dangerous_advice: {
    text: "Dangerous Advice",
    icon: AlertTriangle,
    color: "bg-red-100 text-red-800",
    description: "Potentially harmful guidance or suggestions"
  },
  helpful_response: {
    text: "Helpful Response",
    icon: HelpCircle,
    color: "bg-blue-100 text-blue-800",
    description: "Positive community assistance"
  }
};

export function InterventionsTab({ masterGroupId, isLoading }: InterventionsTabProps) {
  const { currentOrganization } = useOrganization();
  const [interventions, setInterventions] = useState<InterventionMessage[]>([]);
  const [stats, setStats] = useState<InterventionStats>({
    total: 0,
    types: {},
    todayCount: 0,
    weekCount: 0,
    successRate: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("week");
  const [searchTerm, setSearchTerm] = useState("");
  
  useEffect(() => {
    if (masterGroupId && currentOrganization) {
      fetchInterventions();
    }
  }, [masterGroupId, currentOrganization, timeFilter]);
  
  const fetchInterventions = async () => {
    try {
      setLoading(true);
      
      // Get date range based on filter
      const now = new Date();
      let startDate = new Date();
      
      switch (timeFilter) {
        case "today":
          startDate.setHours(0, 0, 0, 0);
          break;
        case "week":
          startDate.setDate(now.getDate() - 7);
          break;
        case "month":
          startDate.setMonth(now.getMonth() - 1);
          break;
        default:
          startDate = new Date("2020-01-01"); // All time
      }
      
      // Get all groups in master group
      const { data: groups } = await supabase
        .from("flowmod_groups")
        .select("id")
        .eq("master_group_id", masterGroupId);
      
      if (!groups || groups.length === 0) {
        setInterventions([]);
        setStats({ total: 0, types: {}, todayCount: 0, weekCount: 0, successRate: 0 });
        return;
      }
      
      const groupIds = groups.map(g => g.id);
      
      // Fetch intervention messages
      const { data, error } = await supabase
        .from("flowmod_messages")
        .select(`
          *,
          participant:participant_id(id, full_name, phone_number),
          group:group_id(id, name)
        `)
        .eq("organization_id", currentOrganization?.id)
        .in("group_id", groupIds)
        .not("intervention_type", "is", null)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const interventionData = data || [];
      setInterventions(interventionData);
      
      // Calculate statistics
      calculateStats(interventionData);
      
    } catch (error) {
      console.error("Error fetching interventions:", error);
      toast.error("Failed to load intervention data");
    } finally {
      setLoading(false);
    }
  };
  
  const calculateStats = (data: InterventionMessage[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    const types: Record<string, number> = {};
    let todayCount = 0;
    let weekCount = 0;
    let totalResponses = 0;
    
    data.forEach(intervention => {
      const type = intervention.intervention_type || "unknown";
      types[type] = (types[type] || 0) + 1;
      
      const createdAt = new Date(intervention.created_at);
      
      if (createdAt >= today) {
        todayCount++;
      }
      
      if (createdAt >= weekAgo) {
        weekCount++;
      }
      
      // Count if this has a response (intervention_responses)
      if (intervention.intervened) {
        totalResponses++;
      }
    });
    
    const successRate = data.length > 0 ? Math.round((totalResponses / data.length) * 100) : 0;
    
    setStats({
      total: data.length,
      types,
      todayCount,
      weekCount,
      successRate
    });
  };
  
  const filteredInterventions = interventions.filter(intervention => {
    // Type filter
    if (selectedType !== "all" && intervention.intervention_type !== selectedType) {
      return false;
    }
    
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        intervention.message.toLowerCase().includes(searchLower) ||
        intervention.participant?.full_name?.toLowerCase().includes(searchLower) ||
        intervention.group?.name?.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  
  const getInterventionTypeInfo = (type: string | null) => {
    if (!type || !INTERVENTION_TYPES[type as keyof typeof INTERVENTION_TYPES]) {
      return INTERVENTION_TYPES.helpful_response;
    }
    return INTERVENTION_TYPES[type as keyof typeof INTERVENTION_TYPES];
  };
  
  if (!masterGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <Shield className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No master group selected</h3>
        <p className="text-muted-foreground text-center">
          Please select a master group to view intervention analytics.
        </p>
      </div>
    );
  }
  
  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Shield className="h-6 w-6 text-blue-600" />
            Community Interventions
          </h2>
          <p className="text-muted-foreground">Monitor and analyze community moderation actions</p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Past Week</SelectItem>
              <SelectItem value="month">Past Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Interventions</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold text-green-600">{stats.successRate}%</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
            <Progress value={stats.successRate} className="mt-2 h-2" />
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-orange-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-orange-600">{stats.weekCount}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-purple-200 bg-purple-50/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Today</p>
                <p className="text-2xl font-bold text-purple-600">{stats.todayCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs defaultValue="analytics" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="analytics">Analytics & Insights</TabsTrigger>
          <TabsTrigger value="interventions">Intervention Log</TabsTrigger>
        </TabsList>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="flex-1 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            {/* Intervention Types Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Intervention Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats.types)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 8)
                    .map(([type, count]) => {
                      const typeInfo = getInterventionTypeInfo(type);
                      const percentage = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      
                      return (
                        <div key={type} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <typeInfo.icon className="h-4 w-4" />
                              <span className="text-sm font-medium">{typeInfo.text}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">{count}</span>
                              <Badge variant="outline" className="text-xs">
                                {percentage}%
                              </Badge>
                            </div>
                          </div>
                          <Progress value={percentage} className="h-2" />
                        </div>
                      );
                    })}
                  
                  {Object.keys(stats.types).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Award className="h-12 w-12 mx-auto mb-2 text-green-500" />
                      <p>No interventions needed!</p>
                      <p className="text-sm">Your community is behaving excellently.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Intervention Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Intervention Categories
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  {Object.entries(INTERVENTION_TYPES).map(([key, typeInfo]) => {
                    const count = stats.types[key] || 0;
                    const isActive = count > 0;
                    
                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-lg border transition-all ${
                          isActive 
                            ? 'border-blue-200 bg-blue-50/50 hover:bg-blue-50' 
                            : 'border-gray-100 bg-gray-50/50 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-md ${typeInfo.color}`}>
                              <typeInfo.icon className="h-4 w-4" />
                            </div>
                            <div>
                              <p className="font-medium text-sm">{typeInfo.text}</p>
                              <p className="text-xs text-muted-foreground">{typeInfo.description}</p>
                            </div>
                          </div>
                          <Badge variant={isActive ? "default" : "outline"}>
                            {count}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        {/* Interventions Log Tab */}
        <TabsContent value="interventions" className="flex-1 mt-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Recent Interventions</h3>
            
            <div className="flex space-x-2">
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(INTERVENTION_TYPES).map(([key, typeInfo]) => (
                    <SelectItem key={key} value={key}>
                      {typeInfo.text}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search interventions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64"
                />
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto">
            {loading || isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="w-full animate-pulse bg-muted/40 h-32"></Card>
                ))}
              </div>
            ) : filteredInterventions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-xl font-medium mb-2">No interventions found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? "No interventions match your search criteria" 
                    : "Great! No interventions needed for the selected timeframe"
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredInterventions.map((intervention) => {
                  const typeInfo = getInterventionTypeInfo(intervention.intervention_type);
                  
                  return (
                    <Card key={intervention.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className={typeInfo.color}>
                              <typeInfo.icon className="h-3 w-3 mr-1" />
                              {typeInfo.text}
                            </Badge>
                            <span className="font-medium">
                              {intervention.participant?.full_name || "Anonymous"}
                            </span>
                            <span className="text-sm text-muted-foreground">
                              in {intervention.group?.name || "Unknown group"}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTime(intervention.created_at)}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm bg-gray-50 p-3 rounded-md border-l-4 border-blue-200">
                          {intervention.message}
                        </p>
                        {intervention.intervened && (
                          <div className="mt-3 flex items-center gap-2 text-sm text-green-600">
                            <CheckCircle className="h-4 w-4" />
                            Action taken successfully
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Results count */}
          {filteredInterventions.length > 0 && (
            <div className="mt-4 flex justify-between items-center text-sm text-muted-foreground">
              <span>Showing {filteredInterventions.length} interventions</span>
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setSearchTerm("")}
                >
                  Clear search
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 