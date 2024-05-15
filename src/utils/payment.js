import Stripe from "stripe";

export const paymentFunction = async ({
  payment_method_types,
  mode,
  metadata,
  customer_email,
  success_url,
  cancel_url,
  discounts,
  line_items,
}) => {
  const stripe = new Stripe(process.env.STRIPE_KEY);

  const paymentData = await stripe.checkout.sessions.create({
    payment_method_types,
    mode,
    metadata,
    customer_email,
    success_url,
    cancel_url,
    discounts,
    line_items,
  });
  return paymentData;
};

//  [
//       {
//         price_data: {
//           currency,
//           unit_amount,
//           product_data: { name, description, images },
//         },
//         quantity,

//       },
//     ],

export const stripeCoupons = async (coupon) => {
  const stripe = new Stripe(process.env.STRIPE_KEY);

  let stripeCoupon;

  if (coupon?.isPercentage) {
    stripeCoupon = await stripe.coupons.create({
      amount_off: coupon.couponAmount,
      currency: "EGP",
    });
  }

  if (coupon?.isFixedAmount) {
    stripeCoupon = await stripe.coupons.create({
      percent_off: coupon.couponAmount,
    });
  }

  return stripeCoupon;
};
