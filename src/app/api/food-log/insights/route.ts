export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI, SchemaType, Schema } from "@google/generative-ai";


const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Explicitly type the schema using the SDK's Schema interface
const schema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    calories: { type: SchemaType.NUMBER },
    advice: { type: SchemaType.STRING },
  },
  required: ["calories", "advice"],
};

export async function POST(req: Request) {
  try {
    // 1️⃣ Defensively parse the incoming JSON request body
    let body;
    try {
      body = await req.json();
    } catch (parseErr) {
      return NextResponse.json(
        { error: "Invalid or missing JSON payload in request body" }, 
        { status: 400 }
      );
    }

    const { user_id, meal_type, food_items, mood } = body;

    // 2️⃣ Validate required fields before running heavy logic
    if (!user_id || !food_items) {
      return NextResponse.json(
        { error: "Missing required fields: user_id and food_items are mandatory." }, 
        { status: 400 }
      );
    }

    const foodText = Array.isArray(food_items)
      ? food_items.join(", ")
      : String(food_items);

    // Default fallback values if Gemini fails
    let aiResult = { calories: null, advice: "Unable to analyze meal accurately." };

    // 3️⃣ Run Gemini Block safely inside its own isolated try/catch
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("GEMINI_API_KEY environment variable is not configured");

      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({
        model: "gemini-3.5-flash",
        systemInstruction: "You are a certified nutritionist.",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const prompt = `Estimate the approximate calorie count for the following meal: "${foodText}". Also give one short, realistic health suggestion related to this meal.`;
      
      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      
      if (responseText) {
        aiResult = JSON.parse(responseText);
      }
    } catch (aiError: any) {
      // Log the AI error to terminal but don't crash the request, let the meal save with fallbacks
      console.error("💥 Gemini processing failed:", aiError.message || aiError);
    }

    // 4️⃣ Save to Supabase
    const { data, error } = await supabase.from("food_logs").insert([
      {
        user_id,
        meal_type,
        food_items,
        calories: aiResult.calories,
        mood,
        ai_advice: aiResult.advice,
      },
    ]);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      data,
      aiResult,
    });

  } catch (err: any) {
    // We now send the exact error details back to the client for clear visibility
    console.error("💥 Error saving meal:", err.message || err);
    return NextResponse.json(
      { error: "Failed to log meal with AI", details: err.message || err },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("food_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ data });
  } catch (err: any) {
    console.error("Fetch error:", err.message);
    return NextResponse.json(
      { error: "Failed to fetch food logs", details: err.message },
      { status: 500 }
    );
  }
}