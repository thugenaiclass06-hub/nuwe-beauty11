// Resend email client integration
import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

export async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendContactNotification(data: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  try {
    const { client, fromEmail } = await getResendClient();
    
    console.log('Sending email with fromEmail:', fromEmail);
    
    const result = await client.emails.send({
      from: 'NUWE <onboarding@resend.dev>',
      to: 'nuweyun@gmail.com',
      subject: `[NUWE 網站] 新訊息：${data.subject}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4A90A4;">NUWE 網站收到新訊息</h2>
          <hr style="border: 1px solid #eee;" />
          <p><strong>姓名：</strong>${data.name}</p>
          <p><strong>Email：</strong>${data.email}</p>
          <p><strong>主旨：</strong>${data.subject}</p>
          <p><strong>訊息內容：</strong></p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px;">
            ${data.message.replace(/\n/g, '<br>')}
          </div>
          <hr style="border: 1px solid #eee; margin-top: 20px;" />
          <p style="color: #666; font-size: 12px;">此郵件由 NUWE 網站自動發送</p>
        </div>
      `
    });
    
    console.log('Email send result:', result);
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return false;
  }
}
