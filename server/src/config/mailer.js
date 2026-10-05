import nodemailer from 'nodemailer';
import env from './env.js';

let transporter = null;

const configureMailer = () => {
  if (!env.SMTP_HOST || !env.SMTP_USER || !env.SMTP_PASS) {
    console.warn('SMTP credentials not set. Email sending will be skipped.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });

  console.log('Email transporter configured');
  return transporter;
};

const getTransporter = () => transporter;

const sendEmail = async ({ to, subject, html, text }) => {
  if (!transporter) {
    console.warn('Email not sent - SMTP not configured');
    return null;
  }

  try {
    const info = await transporter.sendMail({
      from: env.EMAIL_FROM || 'DAHA Clothing Store <noreply@dahaclothing.com>',
      to,
      subject,
      html,
      text,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error.message);
    return null;
  }
};

export { configureMailer, getTransporter, sendEmail };
