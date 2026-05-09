import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: `"NexusMarket" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Email sending failed');
  }
};

export const sendWelcomeEmail = async (email: string, name: string) => {
  const subject = 'Welcome to NexusMarket!';
  const html = `
    <h1>Welcome, ${name}!</h1>
    <p>Thank you for joining NexusMarket, the AI-powered freelance ecosystem.</p>
    <p>Start posting projects or bidding on tasks today!</p>
  `;
  return sendEmail(email, subject, html);
};
