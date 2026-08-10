"use client";
export const dynamic = 'force-dynamic';
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { message } from "antd"; // Kept only for toast notifications
import { createClient } from "@supabase/supabase-js";
import {
  RefreshCw,
  Lightbulb,
  Smile,
  Flame,
  Heart,
  Coffee,
  Utensils,
  Apple,
  Moon,
  Loader2,
  Clock,
  ArrowRight,
  Shield,
  HelpCircle,
  Zap
} from "lucide-react";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function AIFoodPlan() {
  const user = useSelector((state: any) => state.user);
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("breakfast");

  // 🌿 AI Tips States
  const [aiTips, setAiTips] = useState<string[]>([]);
  const [loadingTips, setLoadingTips] = useState<boolean>(false);

  const fetchData = async () => {
    if (!user?.email) {
      message.warning("Please log in to view your AI meal plan.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("bmi, goal, gender")
        .eq("email", user.email)
        .single();

      if (error || !profileData) {
        message.error("Profile not found for this user.");
        setLoading(false);
        return;
      }

      setProfile(profileData);

      const res = await fetch("/api/aiMealPlan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });

      const result = await res.json();

      if (res.ok && !result.error) {
        setPlan(result);
        message.success("Meal Plan Loaded Successfully!");
      } else {
        message.error(result.error || "Failed to load meal plan");
      }
    } catch (err) {
      console.error(err);
      message.error("Error loading meal plan");
    } finally {
      setLoading(false);
    }
  };

  // 🧠 Fetch AI Health Tips
  useEffect(() => {
    const fetchAiHealthTips = async () => {
      if (!profile) return;
      try {
        setLoadingTips(true);
        const res = await fetch("/api/aiHealthTips", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bmi: profile.bmi,
            goal: profile.goal,
            gender: profile.gender,
          }),
        });

        const data = await res.json();
        setAiTips(data.aiTips || []);
      } catch (err) {
        console.error("💥 Error fetching AI health tips:", err);
      } finally {
        setLoadingTips(false);
      }
    };

    fetchAiHealthTips();
  }, [profile]);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  // 🧠 Helper
  const getGoalMessage = (bmi: number, goal: string) => {
    if (goal === "lose")
      return `Focus on nutrient-dense meals and stay consistent. You're closer than you think! 💪`;
    if (goal === "maintain")
      return `Consistency is your superpower 🧘‍♂️ — keep balanced meals and hydration steady.`;
    if (goal === "gain")
      return `Fuel your progress 🍗 — lean proteins and carbs will build your strength steadily.`;

    if (bmi < 18.5)
      return `Include more calorie-rich, wholesome foods in your diet 🍠.`;
    if (bmi >= 25)
      return `Stay mindful of portions 🥗 — small adjustments can make big changes.`;

    return `Follow this meal plan for your health goals 🌱.`;
  };

  const mealSchedule = [
    { time: "8:00 AM", meal: "Breakfast", icon: <Coffee className="w-5 h-5" /> },
    { time: "12:30 PM", meal: "Lunch", icon: <Utensils className="w-5 h-5" /> },
    { time: "4:30 PM", meal: "Snacks", icon: <Apple className="w-5 h-5" /> },
    { time: "8:00 PM", meal: "Dinner", icon: <Moon className="w-5 h-5" /> },
  ];

  const mealTabs = [
    { id: "breakfast", label: "Breakfast", icon: <Coffee className="w-4 h-4" /> },
    { id: "lunch", label: "Lunch", icon: <Utensils className="w-4 h-4" /> },
    { id: "snacks", label: "Snacks", icon: <Apple className="w-4 h-4" /> },
    { id: "dinner", label: "Dinner", icon: <Moon className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4 text-center px-4">
        <Loader2 className="w-10 h-10 text-emerald-500 animate-spin" />
        <p className="text-slate-500 dark:text-slate-400 font-medium">
          AI is analyzing your nutrition data... 🤖
        </p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="flex flex-col justify-center items-center h-[50vh] gap-6 px-4 text-center">
        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-full">
          <Utensils className="w-8 h-8 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-md">
          No meal plan available yet. Click below to generate your first AI personalized plan.
        </p>
        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-lg shadow-emerald-600/20"
        >
          <RefreshCw className="w-5 h-5" />
          Generate Meal Plan
        </button>
      </div>
    );
  }

  return (
    <div className=" mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="text-center sm:text-left space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Hello, {user?.displayName || "Health Enthusiast"} 👋
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          Here is your AI-personalized meal plan based on your exact macros.
        </p>
      </div>

      {/* Profile Summary */}
      {profile && (
        <div className="bg-white dark:bg-slate-900 shadow-sm rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full mb-4">
            <Badge label="Current BMI" value={profile.bmi} color="emerald" />
            <Badge label="Your Goal" value={profile.goal} color="blue" className="capitalize" />
            <Badge label="Gender" value={profile.gender} color="amber" className="capitalize" />
          </div>
          <p className="text-slate-600 dark:text-slate-400 italic font-medium bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            {getGoalMessage(profile.bmi, profile.goal)}
          </p>
        </div>
      )}

      {/* Tabs & Plan Content */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Tab Switcher */}
        <div className="flex overflow-x-auto border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
          {mealTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-4 text-sm font-bold transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? "border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-900"
                  : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              Recommended Items
            </h2>
            <button
              onClick={fetchData}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 rounded-lg font-bold hover:bg-emerald-200 dark:hover:bg-emerald-500/30 transition-colors text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate Plan
            </button>
          </div>

          {plan[activeTab]?.items?.length > 0 ? (
            <ul className="space-y-3 mb-6">
              {plan[activeTab].items.map((food: string, i: number) => (
                <li key={i} className="flex items-start gap-3 text-slate-700 dark:text-slate-300 font-medium">
                  <div className="mt-1 h-2 w-2 rounded-full bg-emerald-500 shrink-0"></div>
                  {food}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 italic mb-6">
              No suggestions available for this meal yet.
            </p>
          )}

          {plan[activeTab]?.calories && (
            <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="font-bold text-slate-900 dark:text-white">
                Estimated Calories: <span className="text-orange-600 dark:text-orange-400">{plan[activeTab].calories}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Grid for Tips & Schedule */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 🌿 AI Tips Section */}
        <div className="bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="text-emerald-600 dark:text-emerald-400 w-6 h-6" />
            <h2 className="font-bold text-xl text-emerald-800 dark:text-emerald-400">
              AI Health Tips
            </h2>
          </div>
          {loadingTips ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
            </div>
          ) : (
            <ul className="space-y-3 text-emerald-900 dark:text-emerald-100/70 font-medium">
              {aiTips.map((tip, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="text-emerald-500 mt-0.5">•</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Suggested Meal Schedule */}
        <div className="bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="text-blue-600 dark:text-blue-400 w-6 h-6" />
            <h2 className="font-bold text-xl text-blue-800 dark:text-blue-400">
              Suggested Schedule
            </h2>
          </div>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-blue-200 dark:before:via-blue-800 before:to-transparent">
            {mealSchedule.map((m, idx) => (
              <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-blue-50 dark:border-slate-950 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow-sm z-10">
                  {m.icon}
                </div>
                <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white">{m.meal}</h3>
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded-md">{m.time}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Goal Motivation Section */}
      <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-500/10 dark:to-rose-500/10 border border-pink-100 dark:border-pink-500/20 text-center shadow-sm p-8 rounded-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col items-center">
          <Smile className="text-pink-500 w-10 h-10 mb-3" />
          <h2 className="font-bold text-xl text-pink-800 dark:text-pink-400 mb-2">
            Goal Motivation
          </h2>
          <p className="text-pink-900/70 dark:text-pink-200/70 italic font-medium text-lg max-w-xl">
            "Every bite you take is a step closer to the best version of yourself."
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center gap-4 py-4">
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 italic text-sm font-medium">
          <Heart className="w-4 h-4 text-red-500" fill="currentColor" />
          Stay kind to your body
        </div>
        <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1"></div>
      </div>

      {/* ---------------- DASHBOARD FOOTER & CTA ---------------- */}
      <footer className="mt-12 bg-slate-900 dark:bg-slate-950 rounded-3xl overflow-hidden shadow-xl border border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* CTA Section */}
          <div className="p-8 sm:p-10 flex flex-col justify-center bg-gradient-to-br from-slate-900 to-slate-800">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold uppercase tracking-wider w-max mb-4">
              <Zap className="h-3.5 w-3.5" fill="currentColor" />
              Pro Feature
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-3">
              Unlock Unlimited Meals
            </h2>
            <p className="text-slate-400 font-medium mb-8 max-w-md">
              You are currently using 1 of your 3 free daily AI generations. Upgrade to Pro to remove all limits and customize every macro.
            </p>
            <a
              href="/upgrade"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-400 transition-all duration-300 hover:-translate-y-0.5 w-max"
            >
              Upgrade to Pro Now
              <ArrowRight className="h-5 w-5" />
            </a>
          </div>

          {/* Links Section */}
          <div className="p-8 sm:p-10 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <div className="grid grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-white font-bold mb-4">Support</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Help Center</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center gap-2"><Utensils className="w-4 h-4" /> Nutrition Guide</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold mb-4">Legal</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Privacy Policy</a></li>
                  <li><a href="#" className="text-slate-400 hover:text-emerald-400 transition-colors text-sm flex items-center gap-2"><Shield className="w-4 h-4" /> Terms of Service</a></li>
                </ul>
              </div>
            </div>
            
            <p className="text-slate-500 text-xs font-medium border-t border-slate-800 pt-6 mt-auto">
              &copy; {new Date().getFullYear()} SmartMealAI. Empowering your fitness journey.
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
}

// Small reusable badge
function Badge({ label, value, color, className = "" }: any) {
  const colorMap: any = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    blue: "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
    amber: "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  };
  return (
    <div
      className={`flex flex-col justify-center px-4 py-4 rounded-xl border shadow-sm text-center w-full ${colorMap[color]}`}
    >
      <p className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1">{label}</p>
      <p className={`font-black text-xl ${className}`}>{value || "—"}</p>
    </div>
  );
}