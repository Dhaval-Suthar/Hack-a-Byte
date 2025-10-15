import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

export interface RegistrationEmailParams {
  email: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  playingDevice: string;
  numberOfPlayers: number;
  paymentId: string;
  amount: number;
}

export const sendRegistrationConfirmationEmail = async (params: RegistrationEmailParams) => {
  try {
    const transporter = createTransporter();

    const {
      email,
      eventTitle,
      eventDate,
      eventTime,
      eventLocation,
      playingDevice,
      numberOfPlayers,
      paymentId,
      amount,
    } = params;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Registration Confirmed for ${eventTitle}`,
      headers: {
        'X-Mailer': 'Hack-a-Byte Mailer',
        'List-Unsubscribe': '<mailto:unsubscribe@hackabyte.com>', // Optional for transactional
      },
      text: `
Dear Participant,

Thank you for registering for ${eventTitle}! We are pleased to confirm that your registration has been successfully processed and your payment has been received.

Please note that this registration covers ${numberOfPlayers} player${numberOfPlayers > 1 ? 's' : ''}. You may register multiple times if you need additional spots.

Event Details:
- Event: ${eventTitle}
- Date: ${eventDate}
- Time: ${eventTime}
- Location: ${eventLocation}
- Playing Device: ${playingDevice === 'smartphone' ? 'Smartphone' : 'PC/Laptop'}
- Number of Players: ${numberOfPlayers}
- Email: ${email}

Payment Information:
- Payment ID: ${paymentId}
- Fee per Person: ₹${((amount / 100) / numberOfPlayers).toFixed(2)}
- Total Amount Paid: ₹${(amount / 100).toFixed(2)}
- Status: PAID

Next Steps:
- Save this email as your registration confirmation
- Ensure your device is ready for the event
- Join our community for updates and announcements
- Arrive at the venue 30 minutes before the event starts

We look forward to your participation in ${eventTitle}. Prepare yourself for an exceptional cybersecurity competition experience.

Best regards,
Hack-a-Byte Team

This is an automated confirmation email. Please do not reply to this email.
If you have any questions, please contact our support team.
      `,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #0f0f0f; color: #ffffff; }
            .container { max-width: 600px; margin: 0 auto; background-color: #1a1a1a; border: 1px solid #00ff88; border-radius: 8px; overflow: hidden; }
            .header { background: linear-gradient(135deg, #00ff88, #00ccff); padding: 20px; text-align: center; color: #000000; }
            .content { padding: 30px; }
            .event-details { background-color: #2a2a2a; border: 1px solid #00ff88; border-radius: 6px; padding: 20px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #333; }
            .detail-label { font-weight: bold; color: #00ff88; }
            .detail-value { color: #ffffff; }
            .footer { background-color: #2a2a2a; padding: 20px; text-align: center; font-size: 14px; color: #888; }
            .cyber-text { color: #00ff88; font-weight: bold; }
            .payment-info { background-color: #1e3a1e; border: 1px solid #00ff88; border-radius: 6px; padding: 15px; margin: 15px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎯 Registration Successful!</h1>
              <h2>${eventTitle}</h2>
            </div>
            
            <div class="content">
              <p>Dear Participant,</p>
              <p>Thank you for registering for <strong class="cyber-text">${eventTitle}</strong>! We are pleased to confirm that your registration has been successfully processed and your payment has been received.</p>
              <p>Please note that this registration covers <strong class="cyber-text">${numberOfPlayers} player${numberOfPlayers > 1 ? 's' : ''}</strong>. You may register multiple times if you need additional spots.</p>
              
              <div class="event-details">
                <h3 class="cyber-text">📅 Event Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Event:</span>
                  <span class="detail-value">${eventTitle}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date:</span>
                  <span class="detail-value">${eventDate}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time:</span>
                  <span class="detail-value">${eventTime}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Location:</span>
                  <span class="detail-value">${eventLocation}</span>
                </div>
              </div>

              <div class="event-details">
                <h3 class="cyber-text">👥 Registration Details</h3>
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${email}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Playing Device:</span>
                  <span class="detail-value">${playingDevice === 'smartphone' ? '📱 Smartphone' : '💻 PC/Laptop'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Number of Players:</span>
                  <span class="detail-value">${numberOfPlayers}</span>
                </div>
              </div>

              <div class="payment-info">
                <h3 class="cyber-text">💳 Payment Information</h3>
                <div class="detail-row">
                  <span class="detail-label">Payment ID:</span>
                  <span class="detail-value">${paymentId}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Fee per Person:</span>
                  <span class="detail-value">₹${((amount / 100) / numberOfPlayers).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Total Amount Paid:</span>
                  <span class="detail-value">₹${(amount / 100).toFixed(2)}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Status:</span>
                  <span class="detail-value cyber-text">✅ PAID</span>
                </div>
              </div>

              <div style="margin-top: 30px; padding: 20px; background-color: #2a2a2a; border-radius: 6px; border-left: 4px solid #00ff88;">
                <h4 class="cyber-text">📋 Next Steps:</h4>
                <ul style="color: #ffffff; line-height: 1.6;">
                  <li>Save this email as your registration confirmation</li>
                  <li>Ensure your device is ready for the event</li>
                  <li>Join our community for updates and announcements</li>
                  <li>Arrive at the venue 30 minutes before the event starts</li>
                </ul>
              </div>

              <p style="margin-top: 30px;">
                We look forward to your participation in <strong class="cyber-text">${eventTitle}</strong>. 
                Prepare yourself for an exceptional cybersecurity competition experience.
              </p>
              
              <p>
                Best regards,<br>
                <strong class="cyber-text">Hack-a-Byte Team</strong>
              </p>
            </div>
            
            <div class="footer">
              <p>This is an automated confirmation email. Please do not reply to this email.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch {
    return {
      success: false,
      error: 'Failed to send confirmation email',
    };
  }
};

export interface AccessCodeEmailParams {
  email: string;
  eventTitle: string;
  accessCode: string;
  numberOfPlayers: number;
  playingDevice: string;
  maxUsages: number;
  playspaceName: string;
  walletAddress?: string;
  privateKey?: string;
  deviceId?: string;
  deviceMacAddress?: string;
}

export const sendAccessCodeEmail = async (params: AccessCodeEmailParams) => {
  try {
    const transporter = createTransporter();

    const {
      email,
      eventTitle,
      accessCode,
      numberOfPlayers,
      playingDevice,
      maxUsages,
      playspaceName,
      walletAddress,
      privateKey,
      deviceId,
      deviceMacAddress
    } = params;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `Your Access Code for ${eventTitle}`,
      headers: {
        'X-Mailer': 'Hack-a-Byte Mailer',
        'List-Unsubscribe': '<mailto:unsubscribe@hackabyte.com>', // Optional for transactional
      },
      text: `
Welcome! Your registration is confirmed for ${eventTitle}.

Your Access Code: ${accessCode}
Valid for ${maxUsages} use${maxUsages > 1 ? 's' : ''} • ${numberOfPlayers} player${numberOfPlayers > 1 ? 's' : ''}

${walletAddress && privateKey ? `
Your Wallet Credentials:
Address: ${walletAddress}
Private Key: ${privateKey}
KEEP THESE CREDENTIALS SECURE!
` : ''}

Details:
- Device: ${playingDevice === 'smartphone' ? 'Smartphone' : 'PC/Laptop'}
- Environment: ${playspaceName}
${deviceId ? `- Device ID: ${deviceId}` : ''}
${deviceMacAddress ? `- MAC Address: ${deviceMacAddress}` : ''}
- Email: ${email}

Quick Start:
1. Visit the Hack-a-Byte platform
2. Enter your access code: ${accessCode}
3. Select your device type
4. Start your cybersecurity challenge!

Important: Keep your access code secure. Anyone with this code can access your gaming environment.

Good luck and happy hacking!

— Hack-a-Byte Team

Automated email • Do not reply
Code: ${accessCode} • ${maxUsages} use${maxUsages > 1 ? 's' : ''}
      `,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Access Code - Hack-a-Byte</title>
          <style>
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
              color: #ffffff;
              margin: 0;
              padding: 20px;
              line-height: 1.6;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: rgba(26, 26, 46, 0.95);
              border: 1px solid rgba(0, 255, 136, 0.3);
              border-radius: 16px;
              overflow: hidden;
              box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
            }
            .header {
              background: linear-gradient(135deg, #00ff88 0%, #00ccff 100%);
              padding: 30px 20px;
              text-align: center;
            }
            .header h1 {
              color: #000000;
              font-size: 28px;
              font-weight: 700;
              margin: 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
            }
            .header h2 {
              color: #000000;
              font-size: 16px;
              font-weight: 500;
              margin: 8px 0 0 0;
              opacity: 0.8;
            }
            .content {
              padding: 30px 20px;
            }
            .access-code-section {
              background: linear-gradient(135deg, #00ff88 0%, #00ccff 100%);
              color: #000000;
              padding: 30px 20px;
              margin: 20px 0;
              border-radius: 12px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            }
            .access-code {
              font-family: 'JetBrains Mono', 'Courier New', monospace;
              font-size: 42px;
              font-weight: 700;
              letter-spacing: 8px;
              margin: 15px 0;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .wallet-section {
              background: linear-gradient(135deg, #ff6b6b 0%, #ffa500 100%);
              color: #000000;
              padding: 20px;
              margin: 20px 0;
              border-radius: 12px;
              font-family: 'JetBrains Mono', monospace;
              font-size: 12px;
              word-break: break-all;
            }
            .details {
              background: rgba(42, 42, 58, 0.7);
              border: 1px solid rgba(0, 255, 136, 0.2);
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              margin: 8px 0;
              padding: 8px 0;
              border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 500;
              color: #00ccff;
              font-size: 14px;
            }
            .detail-value {
              color: #ffffff;
              font-weight: 600;
              font-size: 14px;
            }
            .instructions {
              background: rgba(0, 204, 255, 0.1);
              border: 1px solid rgba(0, 204, 255, 0.3);
              border-radius: 12px;
              padding: 20px;
              margin: 20px 0;
            }
            .instructions ol {
              margin: 0;
              padding-left: 20px;
            }
            .instructions li {
              margin: 8px 0;
              color: #e0e6ed;
            }
            .warning {
              background: rgba(255, 107, 107, 0.1);
              border: 1px solid rgba(255, 107, 107, 0.3);
              border-radius: 12px;
              padding: 15px;
              margin: 20px 0;
            }
            .warning strong {
              color: #ff6b6b;
            }
            .footer {
              background: rgba(20, 20, 35, 0.8);
              padding: 20px;
              text-align: center;
              font-size: 12px;
              color: #888;
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            .cyber-text {
              background: linear-gradient(135deg, #00ff88, #00ccff);
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              font-weight: 700;
            }
            @media (max-width: 600px) {
              .container { margin: 10px; }
              .header { padding: 20px 15px; }
              .content { padding: 20px 15px; }
              .access-code { font-size: 32px; letter-spacing: 4px; }
              .detail-row { flex-direction: column; gap: 4px; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 ACCESS GRANTED</h1>
              <h2>${eventTitle}</h2>
            </div>

            <div class="content">
              <p style="text-align: center; font-size: 16px; margin-bottom: 20px;">
                🎉 <strong>Welcome!</strong> Your registration is confirmed.
              </p>

              <div class="access-code-section">
                <div style="font-size: 14px; font-weight: 600; margin-bottom: 10px;">YOUR ACCESS CODE</div>
                <div class="access-code">${accessCode}</div>
                <div style="font-size: 14px; margin-top: 10px;">
                  Valid for ${maxUsages} use${maxUsages > 1 ? 's' : ''} • ${numberOfPlayers} player${numberOfPlayers > 1 ? 's' : ''}
                </div>
              </div>

              ${walletAddress && privateKey ? `
              <div class="wallet-section">
                <div style="font-weight: 700; margin-bottom: 15px;">🔐 YOUR WALLET CREDENTIALS</div>
                <div style="margin-bottom: 10px;">
                  <strong>Address:</strong><br>
                  ${walletAddress}
                </div>
                <div>
                  <strong>Private Key:</strong><br>
                  ${privateKey}
                </div>
                <div style="margin-top: 15px; font-weight: 700; color: #000;">
                  ⚠️ KEEP THESE CREDENTIALS SECURE!
                </div>
              </div>
              ` : ''}

              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Device:</span>
                  <span class="detail-value">${playingDevice === 'smartphone' ? '📱 Smartphone' : '💻 PC/Laptop'}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Environment:</span>
                  <span class="detail-value">${playspaceName}</span>
                </div>
                ${deviceId ? `
                <div class="detail-row">
                  <span class="detail-label">Device ID:</span>
                  <span class="detail-value">${deviceId}</span>
                </div>
                ` : ''}
                ${deviceMacAddress ? `
                <div class="detail-row">
                  <span class="detail-label">MAC Address:</span>
                  <span class="detail-value">${deviceMacAddress}</span>
                </div>
                ` : ''}
                <div class="detail-row">
                  <span class="detail-label">Email:</span>
                  <span class="detail-value">${email}</span>
                </div>
              </div>

              <div class="instructions">
                <h3 style="color: #00ccff; margin: 0 0 15px 0;">🎯 Quick Start:</h3>
                <ol>
                  <li>Visit the Hack-a-Byte platform</li>
                  <li>Enter your access code: <strong class="cyber-text">${accessCode}</strong></li>
                  <li>Select your device type</li>
                  <li>Start your cybersecurity challenge!</li>
                </ol>
              </div>

              <div class="warning">
                <strong>⚠️ Important:</strong> Keep your access code secure. Anyone with this code can access your gaming environment.
              </div>

              <p style="text-align: center; margin: 30px 0 10px 0; color: #e0e6ed;">
                Good luck and happy hacking! 🎮
              </p>
              <p style="text-align: center; margin: 0;">
                <strong class="cyber-text">— Hack-a-Byte Team</strong>
              </p>
            </div>

            <div class="footer">
              <p>🤖 Automated email • Do not reply</p>
              <p style="font-family: 'JetBrains Mono', monospace; margin-top: 10px;">
                Code: ${accessCode} • ${maxUsages} use${maxUsages > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch {
    return {
      success: false,
      error: 'Failed to send access code email',
    };
  }
};

export default createTransporter;
