"use client";

export const dynamic = 'force-dynamic';
import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import DashboardHome from "../components/dashboard/DashboardHome";
import AIFoodPlan from "../components/dashboard/AIFoodPlan";
import FoodLog from "../components/dashboard/FoodLog";
import ProgressView from "../components/dashboard/ProgressView";
import { useTheme } from "next-themes";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import {
  LayoutDashboard,
  Utensils,
  Flame,
  LineChart,
  Menu,
  X,
  User,
  Edit,
  Activity,
  SunDim,
  Moon,
  Loader2
} from "lucide-react";

/* ---------- Supabase client ---------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function DashboardPage() {
  type ProfileData = {
    name?: string;
    gender?: string;
    age?: number | null;
    height?: number | null;
    weight?: number | null;
    bmi?: number | null;
    bmi_category?: string | null;
    activity_level?: string | null;
    goal?: string | null;
    updated_at?: string | null;
    [key: string]: any;
  };
  const [activeMenu, setActiveMenu] = useState("1");
  const [isMobile, setIsMobile] = useState(false);
  
  // Custom Drawer States
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  
  const [profileData, setProfileData] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  
  const user = useSelector((state: any) => state.user);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  /* Detect screen size for responsive layout */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* Fetch profile data when drawer opens */
  useEffect(() => {
    if (profileOpen && user?.email) {
      fetchProfileData();
    }
  }, [profileOpen, user?.email]);

  const fetchProfileData = async () => {
    if (!user?.email) return;
    setLoadingProfile(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("email", user.email)
        .maybeSingle();

      if (error) throw error;
      setProfileData(data);
    } catch (err) {
      console.error("Error fetching profile:", err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const formatActivityLevel = (level: string) => {
    const levels: { [key: string]: string } = {
      sedentary: "Sedentary",
      light: "Lightly Active",
      moderate: "Moderately Active",
      active: "Active",
      "very-active": "Very Active",
    };
    return levels[level] || level;
  };

  const formatGoal = (goal: string) => {
    const goals: { [key: string]: string } = {
      lose: "Lose Fat",
      maintain: "Maintain Weight",
      gain: "Build Muscle",
    };
    return goals[goal] || goal;
  };

  const getBMIColor = (category: string) => {
    const colors: { [key: string]: string } = {
      Underweight: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-500/30",
      Normal: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
      Overweight: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
      Obese: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
    };
    return colors[category] || "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700";
  };

  const menuItems = [
    { key: "1", icon: <LayoutDashboard className="h-5 w-5" />, label: "Dashboard" },
    { key: "2", icon: <Utensils className="h-5 w-5" />, label: "AI Meal Plan" },
    { key: "3", icon: <Flame className="h-5 w-5" />, label: "Food Log" },
    { key: "4", icon: <LineChart className="h-5 w-5" />, label: "Progress" },
  ];

  const renderContent = () => {
    switch (activeMenu) {
      case "1": return <DashboardHome />;
      case "2": return <AIFoodPlan />;
      case "3": return <FoodLog />;
      case "4": return <ProgressView />;
      default: return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      
      {/* Desktop Sidebar (Profile button removed, overflow-hidden added to prevent scrollbars) */}
      {!isMobile && (
        <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-colors z-20 overflow-hidden">
          <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <Link href="/" className="flex items-center gap-2">
              <div className="bg-emerald-600 p-1 rounded-md">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                SmartMeal<span className="text-emerald-600 dark:text-emerald-500">AI</span>
              </span>
            </Link>
          </div>
          
          <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
            {menuItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setActiveMenu(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-all ${
                  activeMenu === item.key
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 z-10 transition-colors">
          <div className="flex items-center gap-4">
            {isMobile && (
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                <Menu className="h-6 w-6" />
              </button>
            )}
            <h1 className="text-lg font-bold text-slate-900 dark:text-white hidden sm:block">
              {menuItems.find(m => m.key === activeMenu)?.label || "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                {theme === "dark" ? <SunDim className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>
            )}

            {/* Universal Profile Trigger (Moved to Header) */}
            <button 
              onClick={() => setProfileOpen(true)} 
              className="ml-2 flex items-center gap-2 p-1.5 pr-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full sm:rounded-lg transition-colors"
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-700" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                  <User className="h-4 w-4 text-slate-500" />
                </div>
              )}
              {/* Only show name on screens wider than mobile */}
              <span className="hidden sm:block text-sm font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                {user?.displayName || "Profile"}
              </span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className=" mx-auto">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* ---------------- OVERLAYS ---------------- */}

      {/* Mobile Navigation Drawer */}
      {isMobile && (
        <>
          {/* Backdrop */}
          {mobileMenuOpen && (
            <div 
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}
          {/* Sidebar Panel */}
          <div className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <span className="font-extrabold text-slate-900 dark:text-white">Menu</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
              {menuItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => {
                    setActiveMenu(item.key);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg font-medium transition-all ${
                    activeMenu === item.key
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                      : "text-slate-600 dark:text-slate-400"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </>
      )}

      {/* Profile Slide-Over Drawer */}
      <>
        {/* Backdrop */}
        {profileOpen && (
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setProfileOpen(false)}
          />
        )}
        {/* Profile Panel */}
        <div className={`fixed inset-y-0 right-0 w-full sm:w-[400px] bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${profileOpen ? "translate-x-0" : "translate-x-full"}`}>
          
          <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-800 shrink-0">
            <span className="font-bold text-lg text-slate-900 dark:text-white">Your Profile</span>
            <button onClick={() => setProfileOpen(false)} className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {loadingProfile ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
              </div>
            ) : profileData ? (
              <div className="space-y-8">
                
                {/* Header Profile Info */}
                <div className="flex items-center gap-4">
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-slate-100 dark:border-slate-800" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0">
                      <User className="h-8 w-8 text-slate-400" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                      {profileData.name || user?.displayName || "User"}
                    </h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                  </div>
                </div>

                {/* Personal Information */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Personal Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Gender</p>
                      <p className="font-semibold text-slate-900 dark:text-white capitalize">{profileData.gender || "—"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Age</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{profileData.age ? `${profileData.age} yrs` : "—"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Height</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{profileData.height ? `${profileData.height.toFixed(1)} cm` : "—"}</p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                      <p className="text-xs text-slate-500">Weight</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{profileData.weight ? `${profileData.weight.toFixed(1)} kg` : "—"}</p>
                    </div>
                  </div>
                </div>

                {/* Metrics & Goals */}
                <div>
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Target & Metrics</h3>
                  <div className="space-y-3">
                    {profileData.bmi && (
                      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Current BMI</span>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{profileData.bmi.toFixed(1)}</span>
                          {profileData.bmi_category && (
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${getBMIColor(profileData.bmi_category)}`}>
                              {profileData.bmi_category}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Activity Level</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-white">
                        {formatActivityLevel(profileData.activity_level)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Primary Goal</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                        profileData.goal === 'lose' ? 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30' : 
                        profileData.goal === 'gain' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' : 
                        'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30'
                      }`}>
                        {formatGoal(profileData.goal)}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <p className="text-slate-600 dark:text-slate-400 mb-4">No profile data found.</p>
              </div>
            )}
          </div>

          <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 shrink-0">
            <button
              onClick={() => {
                setProfileOpen(false);
                window.location.href = "/setup-profile";
              }}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-500 transition-colors shadow-sm"
            >
              <Edit className="h-4 w-4" />
              {profileData ? "Edit Profile Settings" : "Complete Your Profile"}
            </button>
            {profileData?.updated_at && (
              <p className="text-xs text-center text-slate-500 mt-4">
                Last updated: {new Date(profileData.updated_at).toLocaleDateString()}
              </p>
            )}
          </div>

        </div>
      </>

    </div>
  );
}