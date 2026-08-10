"use client";
export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { createClient } from "@supabase/supabase-js";
import { Spin, message } from "antd";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

/* ---------- Supabase client ---------- */
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type HeightUnit = "cm" | "ftin";

export default function SetupProfilePage() {
  const router = useRouter();
  const user = useSelector((state: any) => state.user);

  /* ---------- form state ---------- */
  const [step, setStep] = useState(0); 
  const totalSteps = 7;

  const [age, setAge] = useState<string>(user?.age?.toString() || "");
  const [name, setName] = useState<string>(user?.displayName || "");
  const [gender, setGender] = useState<string>("male");

  const [heightUnit, setHeightUnit] = useState<HeightUnit>("cm");
  const [heightCm, setHeightCm] = useState<string>("");
  const [heightFt, setHeightFt] = useState<string>(""); 
  const [heightIn, setHeightIn] = useState<string>(""); 

  const [weight, setWeight] = useState<string>("");
  const [activityLevel, setActivityLevel] = useState<string>("moderate");
  const [goal, setGoal] = useState<string>("maintain");

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  /* ---------- fetch existing profile ---------- */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user?.email) {
        setFetching(false);
        return;
      }
      setFetching(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("email", user.email)
          .maybeSingle();

        if (error) throw error;
        if (data) {
          if (data.age) setAge(String(data.age));
          if (data.name) setName(data.name);
          if (data.gender) setGender(data.gender);
          if (data.height) {
            setHeightCm(String(data.height));
            setHeightUnit("cm");
          }
          if (data.weight) setWeight(String(data.weight));
          if (data.activity_level) setActivityLevel(data.activity_level);
          if (data.goal) setGoal(data.goal);
        }
      } catch (err) {
        console.error("Error fetching profile:", err);
        message.error("Failed to load profile.");
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user]);

  /* ---------- helpers ---------- */
  const heightInCm = useMemo(() => {
    if (heightUnit === "cm") {
      const n = parseFloat(heightCm || "0");
      return isNaN(n) ? null : n;
    } else {
      const ft = parseFloat(heightFt || "0");
      const inch = parseFloat(heightIn || "0");
      if (isNaN(ft) && isNaN(inch)) return null;
      const totalInches = (isNaN(ft) ? 0 : ft * 12) + (isNaN(inch) ? 0 : inch);
      if (totalInches <= 0) return null;
      return totalInches * 2.54;
    }
  }, [heightUnit, heightCm, heightFt, heightIn]);

  const bmiValue = useMemo(() => {
    const h = heightInCm;
    const w = parseFloat(weight || "0");
    if (!h || isNaN(w) || w <= 0) return null;
    const m = h / 100;
    const bmi = w / (m * m);
    return isNaN(bmi) ? null : bmi;
  }, [heightInCm, weight]);

  const bmiCategory = useMemo(() => {
    if (bmiValue == null) return "";
    if (bmiValue < 18.5) return "Underweight";
    if (bmiValue < 25) return "Normal";
    if (bmiValue < 30) return "Overweight";
    return "Obese";
  }, [bmiValue]);

  const suggestedGoal = useMemo(() => {
    if (bmiValue == null) return "maintain";
    if (bmiValue < 18.5) return "gain";
    if (bmiValue >= 18.5 && bmiValue < 25) return "maintain";
    return "lose";
  }, [bmiValue]);

  /* ---------- navigation ---------- */
  const goNext = () => {
    if (step < totalSteps - 1) setStep((s) => s + 1);
  };
  const goBack = () => {
    if (step > 0) setStep((s) => s - 1);
  };

  const validateCurrentStep = (): boolean => {
    switch (step) {
      case 0: return !!age && parseInt(age) > 0 && parseInt(age) < 120;
      case 1: return name.trim().length >= 2;
      case 2: return ["male", "female"].includes(gender);
      case 3:
        if (heightUnit === "cm") {
          const v = parseFloat(heightCm || "0");
          return !isNaN(v) && v > 50 && v < 300;
        } else {
          const ft = parseInt(heightFt || "0");
          const inch = parseInt(heightIn || "0");
          return (ft > 0 && ft < 9) && (inch >= 0 && inch < 12);
        }
      case 4:
        const w = parseFloat(weight || "0");
        return !isNaN(w) && w > 10 && w < 500 && heightInCm != null;
      case 5: return ["sedentary", "light", "moderate", "active", "very-active"].includes(activityLevel);
      case 6: return ["lose", "maintain", "gain"].includes(goal);
      default: return true;
    }
  };

  /* ---------- submit to supabase ---------- */
  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      message.error("Please complete the final step correctly before submitting.");
      return;
    }
    setLoading(true);

    const finalBmi = bmiValue ? parseFloat(bmiValue.toFixed(1)) : null;
    const profileData = {
      user_id: user?.uid || null,
      email: user?.email || null,
      name: name || null,
      age: age ? parseInt(age) : null,
      gender,
      height: heightInCm || null,
      weight: weight ? parseFloat(weight) : null,
      bmi: finalBmi,
      bmi_category: bmiCategory || null,
      activity_level: activityLevel,
      goal,
      updated_at: new Date(),
      created_at: new Date(),
    };

    try {
      const { data: existingProfile, error: existErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", user?.email)
        .maybeSingle();

      if (existErr) throw existErr;

      let result;
      if (existingProfile && existingProfile.id) {
        result = await supabase.from("profiles").update(profileData).eq("email", user?.email);
      } else {
        result = await supabase.from("profiles").insert([profileData]);
      }

      if (result.error) throw result.error;

      message.success("Profile saved successfully!");
      // STRATEGY 2: Send directly to dashboard. Paywall triggers later on usage.
      router.push("/dashboard?new=true"); 
    } catch (err) {
      console.error("Error saving profile:", err);
      message.error("Failed to save profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fetching)
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 transition-colors">
        <Spin tip="Loading your data..." size="large" />
      </div>
    );

  const progressPercent = Math.round(((step + 1) / totalSteps) * 100);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      
      {/* Container */}
      <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col min-h-[600px] transition-colors">
        
        {/* Header / Progress Bar */}
        <div className="px-8 pt-8 pb-4">
          <div className="bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 w-full overflow-hidden mb-3">
            <div
              className="h-full bg-emerald-500 transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            <span>Step {step + 1} of {totalSteps}</span>
            <span>{progressPercent}% Complete</span>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 px-8 py-6 overflow-y-auto">
          
          {step === 0 && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Nutritional goals? No problem.
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Choose your age group to help us personalize your macro calculations.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full mt-6">
                {[
                  { id: "teen", label: "13–19", img: "/boy.png" },
                  { id: "adult", label: "20–35", img: "/boy1.jpg" },
                  { id: "middle", label: "36–55", img: "/man.png" },
                  { id: "senior", label: "56+", img: "/old.jpg" },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setAge(item.label)}
                    className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all duration-200 ${
                      age === item.label
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md"
                        : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <div className="relative w-20 h-20 mb-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <Image src={item.img} alt={item.label} fill className="object-cover" />
                    </div>
                    <span className={`font-semibold ${age === item.label ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                What should we call you?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                We'll use this to personalize your dashboard and recipes.
              </p>
              <div className="w-full max-w-md space-y-3">
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <p className="text-xs text-slate-400">You can change this later in settings.</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                What is your biological sex?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Metabolic rates differ biologically. We need this for exact calorie calculations.
              </p>
              <div className="grid grid-cols-2 gap-4 max-w-sm w-full mt-4">
                {[
                  { id: "female", label: "Female", emoji: "🙋‍♀️" },
                  { id: "male", label: "Male", emoji: "🙋‍♂️" },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => setGender(option.id)}
                    type="button"
                    className={`flex flex-col items-center justify-center p-6 rounded-2xl border-2 transition-all ${
                      gender === option.id
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md"
                        : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/50 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <span className="text-4xl mb-3">{option.emoji}</span>
                    <span className={`font-semibold ${gender === option.id ? "text-emerald-700 dark:text-emerald-400" : "text-slate-700 dark:text-slate-300"}`}>
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                How tall are you?
              </h2>
              <p className="text-slate-500 dark:text-slate-400 max-w-md">
                Choose your preferred unit and enter your height below.
              </p>
              <div className="w-full max-w-sm space-y-4">
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setHeightUnit("cm")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      heightUnit === "cm"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    Centimeters
                  </button>
                  <button
                    type="button"
                    onClick={() => setHeightUnit("ftin")}
                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
                      heightUnit === "ftin"
                        ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
                        : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    }`}
                  >
                    Feet & Inches
                  </button>
                </div>

                {heightUnit === "cm" ? (
                  <input
                    type="number"
                    min={50} max={300}
                    placeholder="e.g. 175"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    value={heightCm}
                    onChange={(e) => setHeightCm(e.target.value)}
                  />
                ) : (
                  <div className="flex gap-4">
                    <input
                      type="number" min={0} max={8}
                      placeholder="Ft"
                      className="w-1/2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={heightFt}
                      onChange={(e) => setHeightFt(e.target.value)}
                    />
                    <input
                      type="number" min={0} max={11}
                      placeholder="In"
                      className="w-1/2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                      value={heightIn}
                      onChange={(e) => setHeightIn(e.target.value)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                What is your current weight?
              </h2>
              <div className="w-full max-w-sm space-y-6">
                <input
                  type="number" min={10} max={500}
                  placeholder="Weight in kg (e.g. 68)"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center text-2xl font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                />
                
                {/* Advanced BMI Card Preview */}
                <div className={`p-5 rounded-2xl border transition-all ${bmiValue ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/30" : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700"}`}>
                  {bmiValue != null ? (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-emerald-800 dark:text-emerald-400">Current BMI</span>
                        <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{bmiValue.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-slate-600 dark:text-slate-400">Category:</span>
                        <span className="font-bold text-slate-900 dark:text-white">{bmiCategory}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400">Enter weight to preview BMI stats</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                How active are you?
              </h2>
              <div className="w-full max-w-md space-y-3 text-left">
                {[
                  { val: "sedentary", label: "Sedentary", desc: "Little or no exercise" },
                  { val: "light", label: "Lightly Active", desc: "1–3 days/week" },
                  { val: "moderate", label: "Moderately Active", desc: "3–5 days/week" },
                  { val: "active", label: "Active", desc: "6–7 days/week" },
                  { val: "very-active", label: "Very Active", desc: "Intense daily exercise" },
                ].map((lvl) => (
                  <button
                    key={lvl.val}
                    onClick={() => setActivityLevel(lvl.val)}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                      activityLevel === lvl.val
                        ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm"
                        : "border-slate-200 dark:border-slate-700 hover:border-emerald-300 bg-white dark:bg-slate-800"
                    }`}
                  >
                    <div className="text-left">
                      <p className={`font-bold ${activityLevel === lvl.val ? "text-emerald-700 dark:text-emerald-400" : "text-slate-900 dark:text-white"}`}>{lvl.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{lvl.desc}</p>
                    </div>
                    {activityLevel === lvl.val && <Check className="h-5 w-5 text-emerald-500" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="flex flex-col items-center text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                What is your main goal?
              </h2>
              <div className="w-full max-w-md">
                <div className="grid grid-cols-1 gap-4 mb-8">
                  {[
                    { val: "lose", label: "Lose Fat", icon: "🔥", color: "hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-500/10", active: "border-orange-500 bg-orange-50 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400" },
                    { val: "maintain", label: "Maintain Weight", icon: "⚖️", color: "hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10", active: "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" },
                    { val: "gain", label: "Build Muscle", icon: "💪", color: "hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10", active: "border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400" },
                  ].map((g) => (
                    <button
                      key={g.val}
                      onClick={() => setGoal(g.val)}
                      className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${
                        goal === g.val ? g.active : `border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 ${g.color}`
                      }`}
                    >
                      <span className="text-2xl">{g.icon}</span>
                      <span className="font-bold text-lg">{g.label}</span>
                    </button>
                  ))}
                </div>

                {/* Final Review Card */}
                <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Profile Summary</h4>
                  <div className="grid grid-cols-2 gap-y-3 text-sm">
                    <div className="text-slate-500">Name</div><div className="font-semibold text-slate-900 dark:text-white">{name || "—"}</div>
                    <div className="text-slate-500">Age / Sex</div><div className="font-semibold text-slate-900 dark:text-white">{age || "—"} • <span className="capitalize">{gender}</span></div>
                    <div className="text-slate-500">Stats</div><div className="font-semibold text-slate-900 dark:text-white">{heightInCm ? `${heightInCm.toFixed(1)} cm` : "—"} • {weight ? `${parseFloat(weight).toFixed(1)} kg` : "—"}</div>
                    <div className="text-slate-500">AI Setup</div><div className="font-semibold text-emerald-600 dark:text-emerald-400 capitalize">{goal} • {activityLevel.replace("-", " ")}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Controls */}
        <div className="px-8 py-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-between items-center">
          <button
            onClick={goBack}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-all ${
              step > 0 ? "text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800" : "opacity-0 pointer-events-none"
            }`}
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>

          {step < totalSteps - 1 ? (
            <button
              onClick={() => {
                if (!validateCurrentStep()) {
                  message.error("Please fill this step correctly before continuing.");
                  return;
                }
                goNext();
              }}

              style={{color:'black'}}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:bg-slate-800 dark:hover:bg-slate-200 transition-all shadow-md"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-70"
            >
              {loading ? <Spin className="mr-2" size="small" /> : "Save Profile & Enter App"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}