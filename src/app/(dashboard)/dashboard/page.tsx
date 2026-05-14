import { currentUser } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  FlaskConical,
  AlertTriangle,
  MessageSquare,
  CloudSun,
  ArrowRight,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

async function getUserStats(userId: string) {
  const [fertilizerCount, deficiencyCount, chatCount, weatherCount] = await Promise.all([
    prisma.fertilizerRecommendation.count({ where: { user: { clerkId: userId } } }),
    prisma.deficiencyDetection.count({ where: { user: { clerkId: userId } } }),
    prisma.chatSession.count({ where: { user: { clerkId: userId } } }),
    prisma.weatherAlert.count({ where: { user: { clerkId: userId } } }),
  ]);
  return { fertilizerCount, deficiencyCount, chatCount, weatherCount };
}

async function getRecentActivity(userId: string) {
  const [fertilizers, deficiencies, chats] = await Promise.all([
    prisma.fertilizerRecommendation.findMany({
      where: { user: { clerkId: userId } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, cropType: true, soilType: true, growthStage: true, createdAt: true },
    }),
    prisma.deficiencyDetection.findMany({
      where: { user: { clerkId: userId } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, deficiency: true, cropType: true, createdAt: true },
    }),
    prisma.chatSession.findMany({
      where: { user: { clerkId: userId } },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: { id: true, title: true, language: true, createdAt: true },
    }),
  ]);
  return { fertilizers, deficiencies, chats };
}

export default async function DashboardPage() {
  const user = await currentUser();
  const { userId } = await auth();

  let stats = { fertilizerCount: 0, deficiencyCount: 0, chatCount: 0, weatherCount: 0 };
  let activity = {
    fertilizers: [] as { id: string; cropType: string; soilType: string; growthStage: string | null; createdAt: Date }[],
    deficiencies: [] as { id: string; deficiency: string | null; cropType: string | null; createdAt: Date }[],
    chats: [] as { id: string; title: string | null; language: string; createdAt: Date }[],
  };

  if (userId) {
    try {
      [stats, activity] = await Promise.all([getUserStats(userId), getRecentActivity(userId)]);
    } catch {
      // DB may not be set up yet
    }
  }

  const statCards = [
    {
      label: "Fertilizer Recommendations",
      value: stats.fertilizerCount,
      icon: FlaskConical,
      iconColor: "text-primary",
      iconBg: "bg-secondary",
      href: "/dashboard/fertilizer",
    },
    {
      label: "Deficiency Analyses",
      value: stats.deficiencyCount,
      icon: AlertTriangle,
      iconColor: "text-destructive",
      iconBg: "bg-destructive/10",
      href: "/dashboard/deficiency",
    },
    {
      label: "Chat Sessions",
      value: stats.chatCount,
      icon: MessageSquare,
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      href: "/dashboard/chatbot",
    },
    {
      label: "Weather Alerts",
      value: stats.weatherCount,
      icon: CloudSun,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      href: "/dashboard/weather",
    },
  ];

  const quickActions = [
    { label: "Get Fertilizer Recommendation", href: "/dashboard/fertilizer", icon: FlaskConical },
    { label: "Detect Nutrient Deficiency", href: "/dashboard/deficiency", icon: AlertTriangle },
    { label: "Check Weather", href: "/dashboard/weather", icon: CloudSun },
    { label: "Chat with AI Advisor", href: "/dashboard/chatbot", icon: MessageSquare },
  ];

  const displayName =
    user?.firstName ?? user?.emailAddresses[0]?.emailAddress ?? "Farmer";

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="bg-primary rounded-2xl p-6 text-primary-foreground shadow-md">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-primary-foreground/70 text-xs font-semibold uppercase tracking-widest mb-1">
              Welcome back
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{displayName}!</h1>
            <p className="text-primary-foreground/70 text-sm mt-1.5">
              Your smart fertilizer dashboard is ready. What would you like to do today?
            </p>
          </div>
          <div className="bg-primary-foreground/10 p-3 rounded-xl">
            <TrendingUp className="w-6 h-6 text-primary-foreground" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="hover:shadow-md hover:border-primary/20 transition-all duration-150 cursor-pointer">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground font-medium mb-1">{stat.label}</p>
                      <p className="text-3xl font-bold text-foreground tracking-tight">{stat.value}</p>
                    </div>
                    <div className={`${stat.iconBg} p-3 rounded-xl`}>
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="group bg-secondary hover:bg-primary border border-border hover:border-primary rounded-xl p-4 flex flex-col items-start gap-3 transition-all duration-150"
                  >
                    <Icon className="w-5 h-5 text-primary group-hover:text-primary-foreground transition-colors" />
                    <span className="text-xs font-semibold text-foreground group-hover:text-primary-foreground transition-colors leading-snug">
                      {action.label}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary-foreground self-end transition-colors" />
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activity.fertilizers.map((f) => (
                <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="bg-secondary p-2 rounded-lg shrink-0">
                    <FlaskConical className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate capitalize">
                      Fertilizer: {f.cropType} — {f.soilType} soil
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(f.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {activity.deficiencies.map((d) => (
                <div key={d.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="bg-destructive/10 p-2 rounded-lg shrink-0">
                    <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Deficiency: {d.deficiency ?? "Unknown"} on {d.cropType ?? "plant"}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(d.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {activity.chats.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted transition-colors">
                  <div className="bg-blue-50 p-2 rounded-lg shrink-0">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      Chat: {c.title ?? "Fertilizer Query"} ({c.language})
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
              {activity.fertilizers.length === 0 &&
                activity.deficiencies.length === 0 &&
                activity.chats.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-sm text-muted-foreground">No activity yet.</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Start by getting a fertilizer recommendation!
                    </p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
