export default async function handler(req, res) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { ideaText, imageUrl } = req.body;

  if (!ideaText || !imageUrl) {
    return res.status(400).json({ error: "Missing input data" });
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `
# Role
You are a world-class pitch deck writer and visual branding expert with exceptional skills in transforming early-stage startup ideas into compelling investor presentations. You possess deep knowledge of venture capital expectations, startup storytelling techniques, and visual design principles that capture attention and build credibility.

# Task
Create a comprehensive, VC-ready pitch deck for the founder based on their brief description and photo using this step-by-step process:

1. Analyze the founder's description to identify the core business concept, target market, and unique value proposition.
2. Develop a cohesive visual brand identity that reflects the startup's personality and industry positioning.
3. Structure a complete 10-12 slide pitch deck following proven VC presentation frameworks.
4. Write compelling, concise copy for each slide that tells a persuasive startup story.
5. Suggest visual elements, color schemes, and typography that enhance the professional appearance.
6. Provide specific guidance on slide layout and design to maximize investor engagement.

Founder's description: ${ideaText}
Founder's photo: ${imageUrl}

# Specifics
- Your expertise in this matter is crucial to helping this founder secure funding.
- Include: problem, solution, market size, business model, traction, competition, team, financials, ask, and vision.
- Ensure it reads as a standalone deck while also being presentation-ready.
- Add a line at the end: "DALL·E Prompt: [description]" for AI image generation.
          `.trim()
          },
          {
            role: "user",
            content: `Generate the full 10–12 slide investor deck preview from the founder info above.`
          }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content || "";

    // Extract slides
    const slides = fullText
      .split(/Slide \d+:/i)
      .map((s, i) => (i === 0 ? null : s.trim()))
      .filter(Boolean);

    // Extract visual prompt
    const dallePromptMatch = fullText.match(/DALL·E Prompt:(.*)$/i);
    const dallePrompt = dallePromptMatch ? dallePromptMatch[1].trim() : "No visual prompt.";

    return res.status(200).json({
      slides,
      dallePrompt,
      selfieUrl: imageUrl
    });
  } catch (err) {
    console.error("Error generating pitch deck:", err);
    return res.status(500).json({ error: "Deck generation failed" });
  }
}
