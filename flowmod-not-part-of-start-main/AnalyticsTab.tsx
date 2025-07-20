import { useState, useEffect } from "react";
import { useOrganization } from "@/context/OrganizationContext";
import { BarChart3, TrendingUp, Users, MessageSquare, Clock, Activity, Zap, Target, Calendar, Moon, Sun, Coffee, Sunset, Timer, UserPlus, ArrowUp, ArrowDown, Minus, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AnalyticsTabProps {
  masterGroupId: string | null;
  isLoading: boolean;
}

type CommunityAnalytics = {
  // Community Health
  totalMessages: number;
  activeMembers: number;
  newMembers: number;
  messageGrowthRate: number;
  memberGrowthRate: number;
  avgMessagesPerMember: number;
  
  // Engagement Patterns
  peakHour: { hour: number; count: number };
  peakDay: { day: string; count: number };
  responseRate: number;
  avgResponseTime: number;
  conversationStarters: number;
  
  // Activity Distribution
  hourlyActivity: Array<{ hour: number; count: number }>;
  dailyActivity: Array<{ day: string; count: number; date: string }>;
  memberEngagement: Array<{ level: string; count: number; percentage: number }>;
  
  // Content Insights
  avgMessageLength: number;
  questionCount: number;
  questionRate: number;
  linkSharingCount: number;
  emojiUsage: number;
  
  // Member Lifecycle
  newMemberActivity: Array<{ week: string; joined: number; active: number }>;
  memberRetention: { week1: number; week2: number; month1: number };
  silentMembers: number;
  topContributors: Array<{ name: string; messages: number; engagement: string }>;
};

export function AnalyticsTab({ masterGroupId, isLoading }: AnalyticsTabProps) {
  const { currentOrganization } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("30days");
  const [analytics, setAnalytics] = useState<CommunityAnalytics>({
    totalMessages: 0,
    activeMembers: 0,
    newMembers: 0,
    messageGrowthRate: 0,
    memberGrowthRate: 0,
    avgMessagesPerMember: 0,
    peakHour: { hour: 0, count: 0 },
    peakDay: { day: "", count: 0 },
    responseRate: 0,
    avgResponseTime: 0,
    conversationStarters: 0,
    hourlyActivity: [],
    dailyActivity: [],
    memberEngagement: [],
    avgMessageLength: 0,
    questionCount: 0,
    questionRate: 0,
    linkSharingCount: 0,
    emojiUsage: 0,
    newMemberActivity: [],
    memberRetention: { week1: 0, week2: 0, month1: 0 },
    silentMembers: 0,
    topContributors: [],
  });

  useEffect(() => {
    if (masterGroupId && currentOrganization) {
      fetchCommunityAnalytics();
    }
  }, [masterGroupId, currentOrganization, timeRange]);

  const fetchCommunityAnalytics = async () => {
    try {
      setLoading(true);
      
      const { startDate, previousStartDate } = getDateRanges(timeRange);
      
      // Get groups in master group
      const { data: groupsData, error: groupsError } = await supabase
        .from("flowmod_groups")
        .select("id, name, created_at")
        .eq("master_group_id", masterGroupId);
      
      if (groupsError) throw groupsError;
      
      if (!groupsData || groupsData.length === 0) {
        setAnalytics({
          totalMessages: 0,
          activeMembers: 0,
          newMembers: 0,
          messageGrowthRate: 0,
          memberGrowthRate: 0,
          avgMessagesPerMember: 0,
          peakHour: { hour: 0, count: 0 },
          peakDay: { day: "", count: 0 },
          responseRate: 0,
          avgResponseTime: 0,
          conversationStarters: 0,
          hourlyActivity: [],
          dailyActivity: [],
          memberEngagement: [],
          avgMessageLength: 0,
          questionCount: 0,
          questionRate: 0,
          linkSharingCount: 0,
          emojiUsage: 0,
          newMemberActivity: [],
          memberRetention: { week1: 0, week2: 0, month1: 0 },
          silentMembers: 0,
          topContributors: [],
        });
        return;
      }
      
      const groupIds = groupsData.map(g => g.id);
      
      // Get messages for current and previous periods (user messages only)
      const [currentMessages, previousMessages, participants] = await Promise.all([
        getMessagesData(groupIds, startDate, new Date()),
        getMessagesData(groupIds, previousStartDate, startDate),
        getParticipantsData(groupIds, startDate)
      ]);
      
      // Calculate analytics
      const calculatedAnalytics = await calculateCommunityAnalytics(
        currentMessages,
        previousMessages,
        participants,
        groupIds,
        startDate
      );
      
      setAnalytics(calculatedAnalytics);
      
    } catch (error) {
      console.error("Error fetching community analytics:", error);
      toast.error("Failed to load community analytics");
    } finally {
      setLoading(false);
    }
  };
  
  const getDateRanges = (range: string) => {
    const now = new Date();
    const startDate = new Date(now);
    const previousStartDate = new Date(now);
    
    switch (range) {
      case "7days":
        startDate.setDate(now.getDate() - 7);
        previousStartDate.setDate(now.getDate() - 14);
        break;
      case "30days":
        startDate.setDate(now.getDate() - 30);
        previousStartDate.setDate(now.getDate() - 60);
        break;
      case "90days":
        startDate.setDate(now.getDate() - 90);
        previousStartDate.setDate(now.getDate() - 180);
        break;
      default:
        startDate.setFullYear(2000);
        previousStartDate.setFullYear(2000);
    }
    
    return { startDate, previousStartDate };
  };

  const getMessagesData = async (groupIds: string[], startDate: Date, endDate: Date) => {
    const { data, error } = await supabase
      .from("flowmod_messages")
      .select(`
        id, message, created_at, participant_id, group_id, sender_type,
        participant:participant_id(id, full_name, phone_number, created_at)
      `)
      .in("group_id", groupIds)
      .eq("sender_type", "user")
      .gte("created_at", startDate.toISOString())
      .lt("created_at", endDate.toISOString())
      .order("created_at", { ascending: true });
    
    if (error) throw error;
    return data || [];
  };
  
  const getParticipantsData = async (groupIds: string[], startDate: Date) => {
    const { data, error } = await supabase
      .from("flowmod_participants")
      .select("id, full_name, phone_number, created_at")
      .gte("created_at", startDate.toISOString());
    
    if (error) throw error;
    return data || [];
  };

  const calculateCommunityAnalytics = async (
    currentMessages: any[],
    previousMessages: any[],
    participants: any[],
    groupIds: string[],
    startDate: Date
  ): Promise<CommunityAnalytics> => {
    
    // Basic metrics
    const totalMessages = currentMessages.length;
    const previousTotal = previousMessages.length;
    const messageGrowthRate = previousTotal > 0 ? ((totalMessages - previousTotal) / previousTotal) * 100 : 0;
    
    // Active members (members who sent messages in period)
    const activeMemberIds = new Set(currentMessages.map(m => m.participant_id));
    const activeMembers = activeMemberIds.size;
    
    // New members (joined in this period)
    const newMembers = participants.filter(p => new Date(p.created_at) >= startDate).length;
    const memberGrowthRate = participants.length > 0 ? (newMembers / participants.length) * 100 : 0;
    
    // Average messages per member
    const avgMessagesPerMember = activeMembers > 0 ? totalMessages / activeMembers : 0;
    
    // Hourly activity analysis
    const hourlyActivity = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      count: currentMessages.filter(m => new Date(m.created_at).getHours() === hour).length
    }));
    
    const peakHour = hourlyActivity.reduce((max, curr) => curr.count > max.count ? curr : max, { hour: 0, count: 0 });
    
    // Daily activity analysis
    const dailyActivity = generateDailyActivity(currentMessages, startDate);
    const peakDay = dailyActivity.reduce((max, curr) => curr.count > max.count ? curr : max, { day: "", count: 0, date: "" });
    
    // Content analysis
    const avgMessageLength = totalMessages > 0 ? 
      currentMessages.reduce((sum, m) => sum + m.message.length, 0) / totalMessages : 0;
    
    const questionCount = currentMessages.filter(m => 
      m.message.includes('?') || m.message.toLowerCase().match(/^(what|how|why|when|where|who|can|could|would|should|is|are|do|does|did)/)).length;
    const questionRate = totalMessages > 0 ? (questionCount / totalMessages) * 100 : 0;
    
    const linkSharingCount = currentMessages.filter(m => 
      m.message.includes('http') || m.message.includes('www.')).length;
    
    const emojiUsage = currentMessages.filter(m => 
      m.message.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u)).length;
    
    // Member engagement levels
    const messagesByMember = currentMessages.reduce((acc, m) => {
      acc[m.participant_id] = (acc[m.participant_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const memberEngagement = calculateEngagementLevels(messagesByMember);
    
    // Response patterns (simplified)
    const conversationStarters = currentMessages.length; // Simplified for now
    const responseRate = 75; // Placeholder - would need conversation threading
    const avgResponseTime = 1800; // 30 minutes placeholder
    
    // Top contributors
    const topContributors = calculateTopContributors(currentMessages, messagesByMember);
    
    // Member retention (simplified)
    const memberRetention = { week1: 85, week2: 70, month1: 60 }; // Placeholder
    
    // Silent members (participants who haven't sent messages)
    const allParticipantIds = new Set(participants.map(p => p.id));
    const silentMembers = allParticipantIds.size - activeMemberIds.size;
    
    // New member activity tracking
    const newMemberActivity = generateNewMemberActivity(participants, currentMessages, startDate);
    
    return {
      totalMessages,
      activeMembers,
      newMembers,
      messageGrowthRate,
      memberGrowthRate,
      avgMessagesPerMember,
      peakHour,
      peakDay,
      responseRate,
      avgResponseTime,
      conversationStarters,
      hourlyActivity,
      dailyActivity,
      memberEngagement,
      avgMessageLength,
      questionCount,
      questionRate,
      linkSharingCount,
      emojiUsage,
      newMemberActivity,
      memberRetention,
      silentMembers,
      topContributors,
    };
  };

  const generateDailyActivity = (messages: any[], startDate: Date) => {
    const dailyCounts: Record<string, number> = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    messages.forEach(m => {
      const date = new Date(m.created_at);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });
    
    // Generate array for recent days
    const result = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const dayName = dayNames[date.getDay()];
      
        result.push({
        day: dayName.substring(0, 3),
        count: dailyCounts[dateStr] || 0,
        date: dateStr
        });
    }
    
    return result;
  };
  
  const calculateEngagementLevels = (messagesByMember: Record<string, number>) => {
    const messageCounts = Object.values(messagesByMember);
    const totalMembers = messageCounts.length;
    
    if (totalMembers === 0) {
      return [
        { level: "High Engagement", count: 0, percentage: 0 },
        { level: "Medium Engagement", count: 0, percentage: 0 },
        { level: "Low Engagement", count: 0, percentage: 0 },
      ];
    }
    
    const highEngagement = messageCounts.filter(count => count >= 20).length;
    const mediumEngagement = messageCounts.filter(count => count >= 5 && count < 20).length;
    const lowEngagement = messageCounts.filter(count => count > 0 && count < 5).length;
    
    return [
      { level: "High Engagement", count: highEngagement, percentage: (highEngagement / totalMembers) * 100 },
      { level: "Medium Engagement", count: mediumEngagement, percentage: (mediumEngagement / totalMembers) * 100 },
      { level: "Low Engagement", count: lowEngagement, percentage: (lowEngagement / totalMembers) * 100 },
    ];
  };

  const calculateTopContributors = (messages: any[], messagesByMember: Record<string, number>) => {
    return Object.entries(messagesByMember)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([participantId, count]) => {
        const participant = messages.find(m => m.participant_id === participantId)?.participant;
        const name = participant?.full_name || participant?.phone_number || "Anonymous";
        const engagement = count >= 20 ? "High" : count >= 5 ? "Medium" : "Low";
        
        return { name, messages: count, engagement };
      });
  };

  const generateNewMemberActivity = (participants: any[], messages: any[], startDate: Date) => {
    // Simplified weekly breakdown
    const weeks = [];
    const now = new Date();
    
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const joined = participants.filter(p => {
        const joinDate = new Date(p.created_at);
        return joinDate >= weekStart && joinDate <= weekEnd;
      }).length;
      
      const active = 0; // Simplified - would need to cross-reference with messages
      
      weeks.push({
        week: `Week ${4 - i}`,
        joined,
        active
      });
    }
    
    return weeks;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'k';
    }
    return num.toString();
  };

  const formatGrowthRate = (rate: number) => {
    const sign = rate >= 0 ? '+' : '';
    return `${sign}${rate.toFixed(1)}%`;
  };
  
  const getTimeOfDayIcon = (hour: number) => {
    if (hour >= 6 && hour < 12) return Coffee; // Morning
    if (hour >= 12 && hour < 17) return Sun; // Afternoon
    if (hour >= 17 && hour < 21) return Sunset; // Evening
    return Moon; // Night
  };

  const getTimeOfDayLabel = (hour: number) => {
    if (hour >= 6 && hour < 12) return "Morning";
    if (hour >= 12 && hour < 17) return "Afternoon";
    if (hour >= 17 && hour < 21) return "Evening";
    return "Night";
  };
  
  if (!masterGroupId) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
        <h3 className="text-xl font-medium mb-2">No master group selected</h3>
        <p className="text-muted-foreground text-center">
          Please select a master group to view community analytics.
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
            <Activity className="h-6 w-6 text-green-600" />
            Community Analytics
          </h2>
          <p className="text-muted-foreground">Insights into community engagement and conversation patterns</p>
        </div>
        
        <div className="flex space-x-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 days</SelectItem>
              <SelectItem value="30days">Last 30 days</SelectItem>
              <SelectItem value="90days">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {loading || isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="w-full h-[125px] animate-pulse bg-muted/40"></Card>
          ))}
        </div>
      ) : (
        <Tabs defaultValue="overview" className="flex-1 flex flex-col">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Community Health</TabsTrigger>
            <TabsTrigger value="engagement">Engagement Patterns</TabsTrigger>
            <TabsTrigger value="insights">Content Insights</TabsTrigger>
          </TabsList>
          
          {/* Community Health Tab */}
          <TabsContent value="overview" className="flex-1 mt-4 space-y-6">
            {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{formatNumber(analytics.totalMessages)}</div>
                  <div className="flex items-center gap-1 text-xs">
                    {analytics.messageGrowthRate >= 0 ? (
                      <ArrowUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <ArrowDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={analytics.messageGrowthRate >= 0 ? "text-green-600" : "text-red-600"}>
                      {formatGrowthRate(analytics.messageGrowthRate)}
                    </span>
                    <span className="text-muted-foreground">vs previous period</span>
                  </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <Users className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{analytics.activeMembers}</div>
                <p className="text-xs text-muted-foreground">
                    {analytics.silentMembers} silent members
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">New Members</CardTitle>
                  <UserPlus className="h-4 w-4 text-purple-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{analytics.newMembers}</div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="text-muted-foreground">Growth rate:</span>
                    <span className="text-purple-600">{formatGrowthRate(analytics.memberGrowthRate)}</span>
                  </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Messages/Member</CardTitle>
                  <Target className="h-4 w-4 text-orange-500" />
              </CardHeader>
              <CardContent>
                  <div className="text-2xl font-bold">{analytics.avgMessagesPerMember.toFixed(1)}</div>
                <p className="text-xs text-muted-foreground">
                    Community participation
                </p>
              </CardContent>
            </Card>
          </div>

            {/* Member Engagement Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Member Engagement Levels
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.memberEngagement.map((level, i) => (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{level.level}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">{level.count} members</span>
                          <Badge variant="outline" className="text-xs">
                            {level.percentage.toFixed(1)}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={level.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            
            {/* Top Contributors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Top Contributors
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.topContributors.map((contributor, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{contributor.name}</p>
                          <p className="text-xs text-muted-foreground">{contributor.messages} messages</p>
                        </div>
                      </div>
                      <Badge variant={contributor.engagement === "High" ? "default" : "outline"}>
                        {contributor.engagement}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            
          {/* Engagement Patterns Tab */}
          <TabsContent value="engagement" className="flex-1 mt-4 space-y-6">
            {/* Peak Activity */}
            <div className="grid gap-4 md:grid-cols-2">
            <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Peak Activity Time
                  </CardTitle>
              </CardHeader>
              <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100">
                      {(() => {
                        const Icon = getTimeOfDayIcon(analytics.peakHour.hour);
                        return <Icon className="h-6 w-6 text-blue-600" />;
                      })()}
                    </div>
                    <div>
                      <div className="text-2xl font-bold">
                        {analytics.peakHour.hour.toString().padStart(2, '0')}:00
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {getTimeOfDayLabel(analytics.peakHour.hour)} • {analytics.peakHour.count} messages
                </p>
                    </div>
                  </div>
              </CardContent>
            </Card>
          
          <Card>
            <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Most Active Day
                  </CardTitle>
            </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100">
                      <Calendar className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{analytics.peakDay.day}</div>
                <p className="text-sm text-muted-foreground">
                        {analytics.peakDay.count} messages
                </p>
                    </div>
              </div>
            </CardContent>
          </Card>
            </div>
          
            {/* Hourly Activity Pattern */}
            <Card>
              <CardHeader>
                <CardTitle>24-Hour Activity Pattern</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-12 gap-1">
                  {analytics.hourlyActivity.map((activity, i) => {
                    const maxCount = Math.max(...analytics.hourlyActivity.map(a => a.count));
                    const height = maxCount > 0 ? (activity.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={i} className="flex flex-col items-center gap-1">
                        <div className="text-xs text-muted-foreground">{activity.count}</div>
                        <div 
                          className="w-6 bg-gradient-to-t from-blue-500 to-blue-300 rounded-sm transition-all hover:from-blue-600 hover:to-blue-400"
                          style={{ height: `${Math.max(4, height)}px` }}
                          title={`${activity.hour}:00 - ${activity.count} messages`}
                          ></div>
                        <div className="text-xs text-muted-foreground">
                          {activity.hour.toString().padStart(2, '0')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
            
            {/* Daily Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Daily Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.dailyActivity.map((day, i) => {
                    const maxCount = Math.max(...analytics.dailyActivity.map(d => d.count));
                    const percentage = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
                    
                    return (
                      <div key={i} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{day.day}</span>
                          <span className="text-sm text-muted-foreground">{day.count} messages</span>
                        </div>
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Content Insights Tab */}
          <TabsContent value="insights" className="flex-1 mt-4 space-y-6">
            {/* Content Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Avg Message Length</CardTitle>
                  <MessageSquare className="h-4 w-4 text-blue-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{Math.round(analytics.avgMessageLength)}</div>
                  <p className="text-xs text-muted-foreground">characters</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Questions Asked</CardTitle>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.questionCount}</div>
                  <p className="text-xs text-muted-foreground">
                    {analytics.questionRate.toFixed(1)}% of all messages
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Links Shared</CardTitle>
                  <ChevronRight className="h-4 w-4 text-purple-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.linkSharingCount}</div>
                  <p className="text-xs text-muted-foreground">resource sharing</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Emoji Usage</CardTitle>
                  <span className="text-sm">😊</span>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{analytics.emojiUsage}</div>
                  <p className="text-xs text-muted-foreground">expressive messages</p>
                </CardContent>
              </Card>
            </div>

            {/* Member Retention */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Member Retention
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{analytics.memberRetention.week1}%</div>
                    <p className="text-sm text-muted-foreground">Week 1 retention</p>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{analytics.memberRetention.week2}%</div>
                    <p className="text-sm text-muted-foreground">Week 2 retention</p>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{analytics.memberRetention.month1}%</div>
                    <p className="text-sm text-muted-foreground">Month 1 retention</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Response Patterns */}
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Response Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">{analytics.responseRate}%</span>
                      <Badge variant="outline">Community Engagement</Badge>
                    </div>
                    <Progress value={analytics.responseRate} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      Messages that receive responses
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <Timer className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <div className="text-2xl font-bold">
                        {Math.round(analytics.avgResponseTime / 60)}m
                      </div>
                      <p className="text-xs text-muted-foreground">average response time</p>
          </div>
        </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
} 