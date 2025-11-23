import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Calendar, Flame, Award, Zap, Activity } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface WorkoutData {
  date: string;
  workouts: number;
  calories: number;
  duration: number;
}

interface WorkoutTypeData {
  type: string;
  count: number;
  percentage: number;
}

interface Milestone {
  title: string;
  description: string;
  achieved: boolean;
  date?: string;
  icon: any;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--warning))'];

const Analytics = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');
  const [weeklyData, setWeeklyData] = useState<WorkoutData[]>([]);
  const [workoutTypes, setWorkoutTypes] = useState<WorkoutTypeData[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    totalCalories: 0,
    totalDuration: 0,
    currentStreak: 0,
    longestStreak: 0,
    avgWorkoutsPerWeek: 0
  });

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }
    fetchAnalyticsData();
  }, [user, authLoading, navigate, timeRange]);

  const fetchAnalyticsData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(endDate.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setDate(endDate.getDate() - 30);
      } else {
        startDate.setDate(endDate.getDate() - 365);
      }

      // Fetch workout history
      const { data: workoutHistory, error: historyError } = await supabase
        .from('workout_history')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_at', startDate.toISOString())
        .order('completed_at', { ascending: true });

      if (historyError) throw historyError;

      // Fetch profile for streak data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('current_streak, longest_streak, total_workouts_completed')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      // Process data
      processWorkoutData(workoutHistory || [], profile);
      processMilestones(profile, workoutHistory || []);

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const processWorkoutData = (workouts: any[], profile: any) => {
    // Calculate stats
    const totalWorkouts = workouts.length;
    const totalCalories = workouts.reduce((sum, w) => sum + (w.calories_burned || 0), 0);
    const totalDuration = workouts.reduce((sum, w) => sum + (w.duration_minutes || 0), 0);
    const weeksInRange = timeRange === 'week' ? 1 : timeRange === 'month' ? 4 : 52;
    const avgWorkoutsPerWeek = Math.round(totalWorkouts / weeksInRange * 10) / 10;

    setStats({
      totalWorkouts,
      totalCalories,
      totalDuration,
      currentStreak: profile?.current_streak || 0,
      longestStreak: profile?.longest_streak || 0,
      avgWorkoutsPerWeek
    });

    // Group by date for trends
    const dateMap = new Map<string, { workouts: number; calories: number; duration: number }>();
    workouts.forEach(workout => {
      const date = new Date(workout.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const existing = dateMap.get(date) || { workouts: 0, calories: 0, duration: 0 };
      dateMap.set(date, {
        workouts: existing.workouts + 1,
        calories: existing.calories + (workout.calories_burned || 0),
        duration: existing.duration + (workout.duration_minutes || 0)
      });
    });

    const weeklyData = Array.from(dateMap.entries()).map(([date, data]) => ({
      date,
      ...data
    }));
    setWeeklyData(weeklyData);

    // Group by type
    const typeMap = new Map<string, number>();
    workouts.forEach(workout => {
      const type = workout.workout_type || 'Unknown';
      typeMap.set(type, (typeMap.get(type) || 0) + 1);
    });

    const total = workouts.length || 1;
    const workoutTypes = Array.from(typeMap.entries()).map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      percentage: Math.round((count / total) * 100)
    }));
    setWorkoutTypes(workoutTypes);
  };

  const processMilestones = (profile: any, workouts: any[]) => {
    const achievements: Milestone[] = [
      {
        title: "First Workout",
        description: "Complete your first workout",
        achieved: workouts.length > 0,
        date: workouts[0]?.completed_at,
        icon: Zap
      },
      {
        title: "Week Warrior",
        description: "Maintain a 7-day streak",
        achieved: (profile?.longest_streak || 0) >= 7,
        icon: Flame
      },
      {
        title: "Month Master",
        description: "Maintain a 30-day streak",
        achieved: (profile?.longest_streak || 0) >= 30,
        icon: Calendar
      },
      {
        title: "Century Club",
        description: "Complete 100 workouts",
        achieved: (profile?.total_workouts_completed || 0) >= 100,
        icon: Award
      },
      {
        title: "Consistency King",
        description: "Work out 5 times in a week",
        achieved: stats.avgWorkoutsPerWeek >= 5,
        icon: TrendingUp
      },
      {
        title: "Calorie Crusher",
        description: "Burn 10,000+ calories total",
        achieved: stats.totalCalories >= 10000,
        icon: Activity
      }
    ];

    setMilestones(achievements);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background p-6 pb-24 max-w-6xl mx-auto">
        <div className="space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  const chartConfig = {
    workouts: {
      label: "Workouts",
      color: "hsl(var(--primary))",
    },
    calories: {
      label: "Calories",
      color: "hsl(var(--secondary))",
    },
    duration: {
      label: "Duration (min)",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="min-h-screen bg-background p-6 pb-24 max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Analytics</h1>
            <p className="text-muted-foreground">Track your progress and achievements</p>
          </div>
          <Activity className="w-8 h-8 text-primary" />
        </div>

        {/* Key Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Workouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalWorkouts}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {stats.avgWorkoutsPerWeek}/week
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Calories Burned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.totalCalories.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Avg {Math.round(stats.totalCalories / (stats.totalWorkouts || 1))}/workout
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Current Streak</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold flex items-center gap-2">
                <Flame className="w-6 h-6 text-warning" />
                {stats.currentStreak}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Best: {stats.longestStreak} days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{Math.round(stats.totalDuration / 60)}h</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stats.totalDuration} minutes
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="trends" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="trends">Trends</TabsTrigger>
            <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
          </TabsList>

          {/* Trends Tab */}
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Workout Trends</CardTitle>
                    <CardDescription>Your activity over time</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge 
                      variant={timeRange === 'week' ? 'default' : 'outline'} 
                      className="cursor-pointer"
                      onClick={() => setTimeRange('week')}
                    >
                      Week
                    </Badge>
                    <Badge 
                      variant={timeRange === 'month' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setTimeRange('month')}
                    >
                      Month
                    </Badge>
                    <Badge 
                      variant={timeRange === 'year' ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => setTimeRange('year')}
                    >
                      Year
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {weeklyData.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No workout data available for this period
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="workouts" 
                          stroke="var(--color-workouts)" 
                          strokeWidth={2}
                          dot={{ fill: "var(--color-workouts)" }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="calories" 
                          stroke="var(--color-calories)" 
                          strokeWidth={2}
                          dot={{ fill: "var(--color-calories)" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Duration Trends</CardTitle>
                <CardDescription>Minutes spent working out</CardDescription>
              </CardHeader>
              <CardContent>
                {weeklyData.length === 0 ? (
                  <div className="h-64 flex items-center justify-center text-muted-foreground">
                    No duration data available
                  </div>
                ) : (
                  <ChartContainer config={chartConfig} className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="date" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                        />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <ChartTooltip content={<ChartTooltipContent />} />
                        <Bar 
                          dataKey="duration" 
                          fill="var(--color-duration)" 
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartContainer>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breakdown Tab */}
          <TabsContent value="breakdown" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Workout Type Distribution</CardTitle>
                <CardDescription>How you split your training</CardDescription>
              </CardHeader>
              <CardContent>
                {workoutTypes.length === 0 ? (
                  <div className="h-80 flex items-center justify-center text-muted-foreground">
                    No workout type data available
                  </div>
                ) : (
                  <div className="grid md:grid-cols-2 gap-8">
                    <ChartContainer config={chartConfig} className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={workoutTypes}
                            dataKey="count"
                            nameKey="type"
                            cx="50%"
                            cy="50%"
                            outerRadius={100}
                            label={({ type, percentage }) => `${type}: ${percentage}%`}
                          >
                            {workoutTypes.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <ChartTooltip content={<ChartTooltipContent />} />
                        </PieChart>
                      </ResponsiveContainer>
                    </ChartContainer>

                    <div className="space-y-4">
                      {workoutTypes.map((type, index) => (
                        <div key={type.type} className="flex items-center justify-between p-4 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-4 h-4 rounded-full" 
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{type.type}</span>
                          </div>
                          <div className="text-right">
                            <div className="font-bold">{type.count}</div>
                            <div className="text-sm text-muted-foreground">{type.percentage}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Milestones Tab */}
          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Milestones</CardTitle>
                <CardDescription>Your fitness journey achievements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {milestones.map((milestone, index) => {
                    const Icon = milestone.icon;
                    return (
                      <div
                        key={index}
                        className={`p-6 rounded-lg border-2 transition-all ${
                          milestone.achieved
                            ? 'bg-primary/5 border-primary'
                            : 'bg-muted/20 border-border opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className={`p-3 rounded-full ${
                            milestone.achieved ? 'bg-primary/10' : 'bg-muted'
                          }`}>
                            <Icon className={`w-6 h-6 ${
                              milestone.achieved ? 'text-primary' : 'text-muted-foreground'
                            }`} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold flex items-center gap-2">
                              {milestone.title}
                              {milestone.achieved && (
                                <Badge variant="default" className="text-xs">Unlocked</Badge>
                              )}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {milestone.description}
                            </p>
                            {milestone.achieved && milestone.date && (
                              <p className="text-xs text-muted-foreground mt-2">
                                Achieved: {new Date(milestone.date).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Analytics;
