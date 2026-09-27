export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Only POST requests are allowed"
    });
  }

  const order = req.body;

  console.log("New order received:", order);

  return res.status(200).json({
    success: true,
    message: "Order received successfully!",
    order: order
  });
}
