const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: "price_1RGhmqRusnIbocZaBdfug6LF", // 👈 Replace with your actual price ID from Stripe
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: "https://pitchdeck-backend-clean.vercel.app/success",
      cancel_url: "https://pitchdeck-backend-clean.vercel.app"
    });

    res.status(200).json({ url: session.url });

  } catch (err) {
    console.error("Stripe error:", err);
    res.status(500).json({ error: "Stripe checkout session failed" });
  }
}
