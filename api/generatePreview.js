export default async function handler(req, res) {
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
            content: "You're a world-class pitch deck writer helping early-stage founders generate clean, investor-friendly slides."
          },
          {
            role: "user",
            content: `Startup idea: ${ideaText}

Write:
1. A Cover Slide: include a possible company name and a short, strong one-line tagline.
2. A Problem Slide: describe the key problem this startup is solving.`
          }
        ],
        temperature: 0.8
      })
    });

    const data = await response.json();
    const slides = data.choices[0].message.content.split("\n\n");

    res.status(200).json({
      coverSlide: slides[0],
      problemSlide: slides[1],
      selfieUrl: imageUrl
    });

  } catch (error) {
    console.error("GPT Error:", error);
    res.status(500).json({ error: "Failed to generate preview" });
  }
}
