export default async function handler(req, res) {
  // ✅ FIXED: UNIVERSAL CORS HEADERS
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
            content: `# Role
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
- Your expertise in this matter is crucial to helping this founder secure funding, and we greatly value your thoughtful approach to this important task.
- Include all essential pitch deck components: problem statement, solution, market size, business model, competitive analysis, traction, team, financials, and ask.
- Ensure the pitch deck maintains a professional tone while conveying the founder's passion and vision.
- This pitch deck will be presented to sophisticated investors who expect clarity, market understanding, and realistic projections.
- We deeply appreciate your attention to creating a cohesive visual identity that will make this startup stand out in a competitive funding environment.

# Context
Early-stage founders often struggle to articulate their vision in a way that resonates with investors. A well-crafted pitch deck is essential for securing funding, but most founders lack the expertise to create one that meets VC expectations. Your role is to bridge this gap by transforming their raw ideas into a polished, professional presentation that communicates their business potential effectively.

Investors typically spend just 3-4 minutes reviewing a pitch deck initially, making clear communication and visual appeal critical success factors. The deck you create will serve as both a presentation tool and a standalone document that can be shared with potential investors.`
          },
          {
            role: "user",
            content: `Based on the above, generate:

- A complete 10–12 slide investor pitch deck
- Each slide should include: Slide title, short subtitle if needed, 3–5 bullet points, and a short note on visual style
- At the end, include:
DALL·E Prompt: followed by a single-line visual prompt representing the brand identity or concept`
          }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();
    const fullText = data.choices?.[0]?.message?.content || "";

    // ✅ Parse slides
    const slides = fullText
      .split(/Slide \d+:/)
      .map((s, i) => (i === 0 ? null : s.trim()))
      .filter(Boolean);

    // ✅ Extract DALL·E Prompt
    const dallePromptMatch = fullText.match(/DALL·E Prompt:(.*)$/i);
    const dallePrompt = dallePromptMatch ? dallePromptMatch[1].trim() : "No visual prompt provided.";

    res.status(200).json({
      slides,
      dallePrompt,
      selfieUrl: imageUrl
    });

  } catch (error) {
    console.error("Full Deck Generation Error:", error);
    res.status(500).json({ error: "Failed to generate full deck" });
  }
}
