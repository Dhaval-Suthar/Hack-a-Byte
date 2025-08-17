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
      subject: `Registration Confirmed - ${eventTitle}`,
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
    console.log('Email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
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
  instructions?: string;
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
      instructions = "Visit the Hack-a-Byte platform and enter your access code to begin your gaming experience."
    } = params;

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `🎮 Your Access Code for ${eventTitle} - Ready to Hack!`,
      html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Access Code - Hack-a-Byte</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&family=Inter:wght@400;500;600;700&display=swap');
            
            * { 
              margin: 0; 
              padding: 0; 
              box-sizing: border-box; 
            }
            
            body { 
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
              color: #ffffff; 
              line-height: 1.6;
              margin: 0;
              padding: 0;
            }
            
            .email-wrapper {
              background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%);
              min-height: 100vh;
              padding: 20px 10px;
            }
            
            .container { 
              max-width: 650px; 
              margin: 0 auto; 
              background: rgba(26, 26, 46, 0.95);
              backdrop-filter: blur(20px);
              border: 1px solid rgba(0, 255, 136, 0.3);
              border-radius: 20px; 
              overflow: hidden;
              box-shadow: 
                0 20px 40px rgba(0, 0, 0, 0.5),
                0 0 80px rgba(0, 255, 136, 0.1),
                inset 0 1px 0 rgba(255, 255, 255, 0.1);
            }
            
            .header { 
              background: linear-gradient(135deg, #00ff88 0%, #00ccff 100%);
              padding: 40px 30px;
              text-align: center;
              position: relative;
              overflow: hidden;
            }
            
            .header::before {
              content: '';
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: 
                radial-gradient(circle at 20% 80%, rgba(255,255,255,0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255,255,255,0.1) 0%, transparent 50%);
            }
            
            .header h1 { 
              color: #000000; 
              font-size: 32px; 
              font-weight: 700; 
              margin-bottom: 8px;
              text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
              position: relative;
              z-index: 1;
            }
            
            .header h2 { 
              color: #000000; 
              font-size: 18px; 
              font-weight: 500; 
              opacity: 0.8;
              position: relative;
              z-index: 1;
            }
            
            .content { 
              padding: 40px 30px; 
            }
            
            .welcome-text {
              text-align: center;
              margin-bottom: 30px;
            }
            
            .welcome-text p {
              font-size: 16px;
              color: #e0e6ed;
              margin-bottom: 12px;
            }
            
            .access-code-section { 
              background: linear-gradient(135deg, #00ff88 0%, #00ccff 100%);
              color: #000000; 
              padding: 40px 30px;
              margin: 30px 0; 
              border-radius: 16px; 
              text-align: center;
              position: relative;
              overflow: hidden;
              box-shadow: 
                0 10px 30px rgba(0, 255, 136, 0.3),
                0 0 60px rgba(0, 255, 136, 0.1);
            }
            
            .access-code-section::before {
              content: '';
              position: absolute;
              top: -50%;
              left: -50%;
              width: 200%;
              height: 200%;
              background: linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent);
              animation: shine 3s infinite;
            }
            
            @keyframes shine {
              0% { transform: translateX(-100%) translateY(-100%) rotate(45deg); }
              100% { transform: translateX(100%) translateY(100%) rotate(45deg); }
            }
            
            .access-code-label { 
              font-size: 14px; 
              font-weight: 600; 
              text-transform: uppercase;
              letter-spacing: 1px;
              margin-bottom: 15px;
              opacity: 0.8;
              position: relative;
              z-index: 1;
            }
            
            .access-code { 
              font-family: 'JetBrains Mono', 'Courier New', monospace;
              font-size: 52px; 
              font-weight: 700; 
              letter-spacing: 12px; 
              margin: 20px 0;
              text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
              position: relative;
              z-index: 1;
              animation: pulse-glow 2s ease-in-out infinite;
            }
            
            @keyframes pulse-glow {
              0%, 100% { 
                transform: scale(1);
                text-shadow: 3px 3px 6px rgba(0,0,0,0.3);
              }
              50% { 
                transform: scale(1.02);
                text-shadow: 3px 3px 6px rgba(0,0,0,0.4), 0 0 20px rgba(0,0,0,0.2);
              }
            }
            
            .access-code-info { 
              font-size: 16px; 
              font-weight: 600;
              margin-top: 15px;
              position: relative;
              z-index: 1;
            }
            
            .details-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin: 30px 0;
            }
            
            .detail-card {
              background: rgba(42, 42, 58, 0.7);
              border: 1px solid rgba(0, 255, 136, 0.2);
              border-radius: 12px;
              padding: 20px;
              backdrop-filter: blur(10px);
            }
            
            .detail-card h4 {
              color: #00ff88;
              font-size: 14px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 8px;
            }
            
            .detail-card p {
              color: #ffffff;
              font-size: 16px;
              font-weight: 500;
            }
            
            .event-details { 
              background: rgba(42, 42, 58, 0.7); 
              border: 1px solid rgba(0, 255, 136, 0.3); 
              border-radius: 16px; 
              padding: 25px; 
              margin: 25px 0;
              backdrop-filter: blur(10px);
            }
            
            .event-details h3 { 
              color: #00ff88; 
              font-size: 18px; 
              font-weight: 600; 
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .detail-row { 
              display: flex; 
              justify-content: space-between; 
              align-items: center;
              margin: 15px 0; 
              padding: 12px 0; 
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
            
            .instructions-box { 
              background: linear-gradient(135deg, rgba(0, 204, 255, 0.1) 0%, rgba(0, 255, 136, 0.1) 100%);
              border: 1px solid rgba(0, 204, 255, 0.3); 
              border-radius: 16px; 
              padding: 25px; 
              margin: 25px 0;
            }
            
            .instructions-box h3 { 
              color: #00ccff; 
              font-size: 18px; 
              font-weight: 600; 
              margin-bottom: 20px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .instructions-list {
              list-style: none;
              padding: 0;
            }
            
            .instructions-list li {
              display: flex;
              align-items: flex-start;
              gap: 15px;
              margin: 15px 0;
              color: #e0e6ed;
              font-size: 15px;
              line-height: 1.6;
            }
            
            .step-number {
              background: linear-gradient(135deg, #00ff88, #00ccff);
              color: #000;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 700;
              font-size: 12px;
              flex-shrink: 0;
              margin-top: 2px;
            }
            
            .warning-box { 
              background: linear-gradient(135deg, rgba(255, 107, 107, 0.1) 0%, rgba(255, 165, 0, 0.1) 100%);
              border: 1px solid rgba(255, 107, 107, 0.3); 
              border-radius: 16px; 
              padding: 25px; 
              margin: 25px 0;
            }
            
            .warning-box h4 { 
              color: #ff6b6b; 
              font-size: 16px; 
              font-weight: 600; 
              margin-bottom: 15px;
              display: flex;
              align-items: center;
              gap: 10px;
            }
            
            .warning-list {
              list-style: none;
              padding: 0;
            }
            
            .warning-list li {
              display: flex;
              align-items: flex-start;
              gap: 12px;
              margin: 12px 0;
              color: #e0e6ed;
              font-size: 14px;
              line-height: 1.5;
            }
            
            .warning-icon {
              color: #ffa500;
              font-weight: bold;
              flex-shrink: 0;
              margin-top: 2px;
            }
            
            .cta-section {
              text-align: center;
              margin: 40px 0 30px;
              padding: 30px 20px;
              background: rgba(0, 255, 136, 0.05);
              border-radius: 16px;
              border: 1px solid rgba(0, 255, 136, 0.1);
            }
            
            .cta-button {
              display: inline-block;
              background: linear-gradient(135deg, #00ff88, #00ccff);
              color: #000000;
              padding: 15px 30px;
              border-radius: 50px;
              text-decoration: none;
              font-weight: 700;
              font-size: 16px;
              text-transform: uppercase;
              letter-spacing: 1px;
              box-shadow: 0 10px 25px rgba(0, 255, 136, 0.3);
              transition: all 0.3s ease;
            }
            
            .footer { 
              background: rgba(20, 20, 35, 0.8); 
              padding: 30px; 
              text-align: center; 
              font-size: 13px; 
              color: #888; 
              border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .footer p {
              margin: 8px 0;
            }
            
            .cyber-text { 
              background: linear-gradient(135deg, #00ff88, #00ccff);
              background-clip: text;
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              font-weight: 700;
            }
            
            .highlight {
              background: rgba(0, 255, 136, 0.2);
              padding: 2px 6px;
              border-radius: 4px;
              font-weight: 600;
            }
            
            @media (max-width: 600px) {
              .email-wrapper { padding: 10px 5px; }
              .container { border-radius: 16px; }
              .header { padding: 30px 20px; }
              .content { padding: 30px 20px; }
              .access-code { font-size: 40px; letter-spacing: 8px; }
              .details-grid { grid-template-columns: 1fr; gap: 15px; }
              .detail-row { flex-direction: column; align-items: flex-start; gap: 5px; }
            }
          </style>
        </head>
        <body>
          <div class="email-wrapper">
            <div class="container">
              <div class="header">
                <h1>🚀 ACCESS GRANTED</h1>
                <h2>${eventTitle}</h2>
              </div>
              
              <div class="content">
                <div class="welcome-text">
                  <p>🎉 <strong>Congratulations!</strong> Your registration has been processed successfully.</p>
                  <p>You now have access to your dedicated <span class="cyber-text">${playspaceName}</span> gaming environment.</p>
                </div>
                
                <div class="access-code-section">
                  <div class="access-code-label">Your Access Code</div>
                  <div class="access-code">${accessCode}</div>
                  <div class="access-code-info">
                    Valid for <strong>${maxUsages} use${maxUsages > 1 ? 's' : ''}</strong> • Team Size: ${numberOfPlayers}
                  </div>
                </div>

                <div class="details-grid">
                  <div class="detail-card">
                    <h4>🎮 Gaming Device</h4>
                    <p>${playingDevice === 'smartphone' ? '📱 HackPhone' : '💻 HackBook W95'}</p>
                  </div>
                  <div class="detail-card">
                    <h4>👥 Team Size</h4>
                    <p>${numberOfPlayers} Player${numberOfPlayers > 1 ? 's' : ''}</p>
                  </div>
                </div>

                <div class="event-details">
                  <h3>📋 Session Information</h3>
                  <div class="detail-row">
                    <span class="detail-label">Event</span>
                    <span class="detail-value">${eventTitle}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Email</span>
                    <span class="detail-value">${email}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Environment</span>
                    <span class="detail-value">${playspaceName}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Access Limit</span>
                    <span class="detail-value">${maxUsages} use${maxUsages > 1 ? 's' : ''}</span>
                  </div>
                </div>

                <div class="instructions-box">
                  <h3>🎯 How to Access Your Gaming Environment</h3>
                  <ol class="instructions-list">
                    <li>
                      <span class="step-number">1</span>
                      <span>Visit the <strong class="cyber-text">Hack-a-Byte platform</strong></span>
                    </li>
                    <li>
                      <span class="step-number">2</span>
                      <span>Enter your access code: <span class="highlight">${accessCode}</span></span>
                    </li>
                    <li>
                      <span class="step-number">3</span>
                      <span>Select <strong>${playingDevice === 'smartphone' ? 'HackPhone' : 'HackBook W95'}</strong> as your device</span>
                    </li>
                    <li>
                      <span class="step-number">4</span>
                      <span>Start your <strong class="cyber-text">cybersecurity adventure!</strong></span>
                    </li>
                  </ol>
                  <p style="color: #e0e6ed; margin-top: 20px; font-style: italic;">
                    ${instructions}
                  </p>
                </div>

                <div class="warning-box">
                  <h4>⚠️ Important Security Notes</h4>
                  <ul class="warning-list">
                    <li>
                      <span class="warning-icon">🔐</span>
                      <span><strong>Keep secure:</strong> Anyone with this code can access your environment</span>
                    </li>
                    <li>
                      <span class="warning-icon">🎯</span>
                      <span><strong>Usage limit:</strong> Code works exactly ${maxUsages} time${maxUsages > 1 ? 's' : ''}</span>
                    </li>
                    <li>
                      <span class="warning-icon">👥</span>
                      <span><strong>Shared device:</strong> Your team of ${numberOfPlayers} will share one device</span>
                    </li>
                    <li>
                      <span class="warning-icon">📱</span>
                      <span><strong>Device type:</strong> ${playingDevice === 'smartphone' ? 'HackPhone (Mobile Interface)' : 'HackBook W95 (Desktop Interface)'}</span>
                    </li>
                  </ul>
                </div>

                <div class="cta-section">
                  <p style="color: #e0e6ed; margin-bottom: 20px; font-size: 16px;">
                    🚀 Ready to dive into the world of cybersecurity?<br>
                    Your personalized gaming environment is waiting!
                  </p>
                </div>

                <div style="text-align: center; margin-top: 40px;">
                  <p style="color: #e0e6ed; font-size: 16px; margin-bottom: 10px;">
                    Good luck and happy hacking! 🎮
                  </p>
                  <p>
                    <strong class="cyber-text">— The Hack-a-Byte Team</strong>
                  </p>
                </div>
              </div>
              
              <div class="footer">
                <p>🤖 This is an automated email containing your access credentials.</p>
                <p>📧 Please do not reply to this email. For support, contact our team through official channels.</p>
                <p style="margin-top: 15px; font-family: 'JetBrains Mono', monospace; color: #666;">
                  Code: <strong>${accessCode}</strong> • Uses: ${maxUsages} • Device: ${playingDevice === 'smartphone' ? 'Mobile' : 'Desktop'}
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Access code email sent successfully:', result.messageId);
    
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending access code email:', error);
    return {
      success: false,
      error: 'Failed to send access code email',
    };
  }
};

export default createTransporter;
