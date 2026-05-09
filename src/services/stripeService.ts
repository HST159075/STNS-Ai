import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2026-04-22.dahlia', // Matches latest SDK expectations
});

export const createPaymentIntent = async (amount: number, currency: string = 'usd') => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Stripe works in cents
      currency,
      automatic_payment_methods: { enabled: true },
    });
    return paymentIntent;
  } catch (error: any) {
    console.error('Stripe Payment Intent Error:', error);
    throw new Error(error.message);
  }
};

export const createCheckoutSession = async (amount: number, title: string, successUrl: string, cancelUrl: string) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: title },
          unit_amount: amount * 100,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    return session;
  } catch (error: any) {
    console.error('Stripe Checkout Session Error:', error);
    throw new Error(error.message);
  }
};
