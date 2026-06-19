import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT || 3001,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseKey: process.env.SUPABASE_SERVICE_KEY,
  whatsapp: {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID,
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN,
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'searock-crm-dev-secret',
  admin: {
    email: process.env.ADMIN_EMAIL || 'ssearockcrm@gmail.com',
    password: process.env.ADMIN_PASSWORD || 'admin1234',
  },
};
