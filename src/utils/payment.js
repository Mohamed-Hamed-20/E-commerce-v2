import Stripe from "stripe";

const saintizePayment = (paymentData) => {
  return {
    success_url: paymentData.success_url,
    ui_mode: paymentData.ui_mode,
    cancel_url: paymentData.cancel_url,
    total_details: paymentData.total_details,
    url: paymentData.url,
    id: paymentData.id,
    customer_email: paymentData.customer_email,
    metadata: paymentData.metadata,
  };
};

export const paymentFunction = async ({
  user,
  products,
  order,
  success_url,
  cancel_url,
  discounts,
}) => {
  console.log({
    user,
    products,
    order,
    success_url,
    cancel_url,
    discounts,
  });
  const stripe = new Stripe(process.env.STRIPE_KEY);

  const paymentData = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    metadata: { orderId: order._id.toString() },
    customer_email: user.email,
    success_url,
    cancel_url,
    discounts,
    line_items: products.map((product) => {
      return {
        price_data: {
          currency: "EGP",
          unit_amount: product.priceAfterDiscount * 100,
          product_data: {
            name: product.title,
            description: product.desc,
          },
        },
        quantity: product.quantity,
      };
    }),
  });
  return saintizePayment(paymentData);
};
export const stripeCoupons = async (coupon) => {
  const stripe = new Stripe(process.env.STRIPE_KEY);

  let stripeCoupon;

  if (coupon?.isFixedAmount) {
    stripeCoupon = await stripe.coupons.create({
      amount_off: coupon.couponAmount,
      currency: "EGP",
    });
  }

  if (coupon?.isPercentage) {
    stripeCoupon = await stripe.coupons.create({
      percent_off: coupon.couponAmount,
    });
  }

  return stripeCoupon;
};
