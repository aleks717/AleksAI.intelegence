import { Handler } from '@netlify/functions';
import nodemailer from 'nodemailer';

export const handler: Handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  try {
    const { email, code, type } = JSON.parse(event.body || '{}');
    if (!email || !code) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'E-Mail und Code fehlen.' })
      };
    }

    const subject = type === 'reset' 
      ? 'AlerksAI Passwort zurücksetzen - Bestätigungscode' 
      : 'AlerksAI Google Login - Bestätigungscode';

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: 0 auto; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; color: #1e293b;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4f6ef7; margin: 0; font-weight: 800; font-size: 24px; letter-spacing: -0.5px;">AlerksAI Intelegence</h2>
          <p style="color: #64748b; font-size: 13px; margin: 5px 0 0 0;">Sicherheits-Verifizierung</p>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 20px;">
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 15px 0;">
            Hallo,
          </p>
          <p style="font-size: 14px; color: #334155; line-height: 1.5; margin: 0 0 20px 0;">
            ${type === 'reset' 
              ? 'Du hast angefordert, dein Passwort zurückzusetzen. Bitte gib den folgenden 6-stelligen Bestätigungscode ein, um dein Passwort zu ändern:' 
              : 'Du versuchst, dich mit Google anzumelden. Bitte gib den folgenden 6-stelligen Bestätigungscode ein, um deine Anmeldung abzuschließen:'}
          </p>
          <div style="background-color: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 12px; padding: 15px; text-align: center; margin-bottom: 20px;">
            <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #0f172a;">${code}</span>
          </div>
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4; margin: 0 0 15px 0;">
            Aus Sicherheitsgründen ist dieser Code nur für kurze Zeit gültig. Falls du diese Anmeldung oder dieses Zurücksetzen nicht veranlasst hast, kannst du diese E-Mail einfach ignorieren.
          </p>
        </div>
        <div style="border-top: 1px solid #f1f5f9; padding-top: 15px; text-align: center; font-size: 11px; color: #94a3b8;">
          &copy; ${new Date().getFullYear()} AleksAI. Alle Rechte vorbehalten.
        </div>
      </div>
    `;

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const isDummy = (val: string | undefined) => {
      if (!val) return true;
      const lower = val.toLowerCase().trim();
      return lower === '' || 
             lower.includes('your_') || 
             lower.includes('placeholder') || 
             lower.includes('dummy') || 
             lower.includes('example.com') ||
             lower === 'smtp.example.com';
    };

    const hasConfiguredSmtp = smtpHost && !isDummy(smtpHost) &&
                              smtpUser && !isDummy(smtpUser) &&
                              smtpPass && !isDummy(smtpPass);

    let smtpError: string | null = null;

    if (hasConfiguredSmtp) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: Number(smtpPort || 587),
          secure: Number(smtpPort) === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await transporter.sendMail({
          from: `"AleksAI" <${smtpUser}>`,
          to: email,
          subject: subject,
          html: htmlContent
        });

        console.log(`[Email] Sent verification email successfully to ${email}`);
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ success: true, method: 'smtp' })
        };
      } catch (err: any) {
        console.error('[Email] SMTP failed:', err.message);
        smtpError = err.message;
      }
    }

    // Fallback: Code in log print, and let frontend know it's a simulation
    console.log(`[Email Simulation] Code for ${email} is ${code}`);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true, 
        method: smtpError ? 'failed_smtp' : 'simulation', 
        code: code,
        smtpError: smtpError
      })
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: err.message || 'Internal Server Error' })
    };
  }
};
