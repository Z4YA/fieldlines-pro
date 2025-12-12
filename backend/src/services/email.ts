const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.EMAIL_FROM || 'onboarding@resend.dev'
const FROM_NAME = process.env.FROM_NAME || 'FieldLines Pro'
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:9500'

// Send email using Resend API
async function sendEmail(to: string, subject: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log('RESEND_API_KEY not configured, skipping email send')
    console.log(`Would send email to ${to}: ${subject}`)
    return
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Resend API error: ${error}`)
  }

  return response.json()
}

// Email templates
export async function sendVerificationEmail(email: string, token: string) {
  const verifyUrl = `${FRONTEND_URL}/verify-email?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FieldLines Pro</h1>
        </div>
        <div class="content">
          <h2>Verify Your Email</h2>
          <p>Thank you for registering with FieldLines Pro. Please click the button below to verify your email address:</p>
          <a href="${verifyUrl}" class="button">Verify Email</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${verifyUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} FieldLines Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await sendEmail(email, 'Verify your FieldLines Pro account', html)
    console.log(`Verification email sent to ${email}`)
  } catch (error) {
    console.error('Failed to send verification email:', error)
    // Don't throw - email sending shouldn't break registration
  }
}

export async function sendPasswordResetEmail(email: string, token: string) {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .button { display: inline-block; padding: 12px 24px; background: #16a34a; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FieldLines Pro</h1>
        </div>
        <div class="content">
          <h2>Reset Your Password</h2>
          <p>We received a request to reset your password. Click the button below to create a new password:</p>
          <a href="${resetUrl}" class="button">Reset Password</a>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p>${resetUrl}</p>
          <p>This link will expire in 24 hours.</p>
          <p>If you didn't request this password reset, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} FieldLines Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await sendEmail(email, 'Reset your FieldLines Pro password', html)
    console.log(`Password reset email sent to ${email}`)
  } catch (error) {
    console.error('Failed to send password reset email:', error)
  }
}

interface BookingConfirmationData {
  to: string
  referenceNumber: string
  customerName: string
  sportsgroundName: string
  sportsgroundAddress: string
  templateName: string
  dimensions: string
  lineColor: string
  preferredDate: string
  preferredTime: string
}

export async function sendBookingConfirmationEmail(data: BookingConfirmationData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #16a34a; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .details { background: white; padding: 20px; border-radius: 6px; margin: 20px 0; }
        .details-row { display: flex; padding: 8px 0; border-bottom: 1px solid #eee; }
        .details-label { font-weight: bold; width: 150px; }
        .reference { font-size: 24px; color: #16a34a; text-align: center; padding: 20px; }
        .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>FieldLines Pro</h1>
        </div>
        <div class="content">
          <h2>Booking Request Received</h2>
          <p>Hi ${data.customerName},</p>
          <p>Thank you for your booking request. We have received your request and will be in touch shortly to confirm.</p>

          <div class="reference">
            <strong>Reference Number:</strong><br>
            ${data.referenceNumber}
          </div>

          <div class="details">
            <h3>Booking Details</h3>
            <div class="details-row">
              <span class="details-label">Location:</span>
              <span>${data.sportsgroundName}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Address:</span>
              <span>${data.sportsgroundAddress}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Field Type:</span>
              <span>${data.templateName}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Dimensions:</span>
              <span>${data.dimensions}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Line Color:</span>
              <span>${data.lineColor}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Preferred Date:</span>
              <span>${data.preferredDate}</span>
            </div>
            <div class="details-row">
              <span class="details-label">Preferred Time:</span>
              <span>${data.preferredTime}</span>
            </div>
          </div>

          <h3>What Happens Next?</h3>
          <ol>
            <li>Our team will review your booking request</li>
            <li>We'll contact you to confirm the date and time</li>
            <li>You'll receive a final confirmation with all details</li>
          </ol>

          <p>If you have any questions, please don't hesitate to contact us.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} FieldLines Pro. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await sendEmail(data.to, `Booking Request Received - ${data.referenceNumber}`, html)
    console.log(`Booking confirmation email sent to ${data.to}`)
  } catch (error) {
    console.error('Failed to send booking confirmation email:', error)
  }
}

interface ProviderNotificationData {
  referenceNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  customerOrganization?: string | null
  sportsgroundName: string
  sportsgroundAddress: string
  latitude: number
  longitude: number
  templateName: string
  dimensions: string
  rotation: number
  lineColor: string
  preferredDate: string
  preferredTime: string
  alternativeDate?: string
  notes?: string | null
  contactPreference: string
}

export async function sendProviderNotificationEmail(data: ProviderNotificationData) {
  const PROVIDER_EMAIL = process.env.PROVIDER_EMAIL || 'operations@fieldlinespro.com'
  const mapUrl = `https://www.google.com/maps?q=${data.latitude},${data.longitude}`

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #1e40af; color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; background: #f9f9f9; }
        .section { background: white; padding: 20px; border-radius: 6px; margin: 15px 0; }
        .section h3 { margin-top: 0; color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 8px; }
        .row { padding: 6px 0; }
        .label { font-weight: bold; color: #555; }
        .reference { font-size: 24px; color: #1e40af; text-align: center; padding: 15px; background: #e0e7ff; border-radius: 6px; }
        .button { display: inline-block; padding: 10px 20px; background: #1e40af; color: white; text-decoration: none; border-radius: 6px; }
        .notes { background: #fef3c7; padding: 15px; border-radius: 6px; border-left: 4px solid #f59e0b; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>New Booking Request</h1>
        </div>
        <div class="content">
          <div class="reference">
            <strong>${data.referenceNumber}</strong>
          </div>

          <div class="section">
            <h3>Customer Information</h3>
            <div class="row"><span class="label">Name:</span> ${data.customerName}</div>
            <div class="row"><span class="label">Email:</span> ${data.customerEmail}</div>
            <div class="row"><span class="label">Phone:</span> ${data.customerPhone}</div>
            ${data.customerOrganization ? `<div class="row"><span class="label">Organization:</span> ${data.customerOrganization}</div>` : ''}
            <div class="row"><span class="label">Contact Preference:</span> ${data.contactPreference}</div>
          </div>

          <div class="section">
            <h3>Location</h3>
            <div class="row"><span class="label">Ground Name:</span> ${data.sportsgroundName}</div>
            <div class="row"><span class="label">Address:</span> ${data.sportsgroundAddress}</div>
            <div class="row"><a href="${mapUrl}" class="button">View on Google Maps</a></div>
          </div>

          <div class="section">
            <h3>Field Configuration</h3>
            <div class="row"><span class="label">Template:</span> ${data.templateName}</div>
            <div class="row"><span class="label">Dimensions:</span> ${data.dimensions}</div>
            <div class="row"><span class="label">Rotation:</span> ${data.rotation}°</div>
            <div class="row"><span class="label">Line Color:</span> ${data.lineColor}</div>
          </div>

          <div class="section">
            <h3>Scheduling</h3>
            <div class="row"><span class="label">Preferred Date:</span> ${data.preferredDate}</div>
            <div class="row"><span class="label">Preferred Time:</span> ${data.preferredTime}</div>
            ${data.alternativeDate ? `<div class="row"><span class="label">Alternative Date:</span> ${data.alternativeDate}</div>` : ''}
          </div>

          ${data.notes ? `
          <div class="notes">
            <h4>Customer Notes:</h4>
            <p>${data.notes}</p>
          </div>
          ` : ''}
        </div>
      </div>
    </body>
    </html>
  `

  try {
    await sendEmail(PROVIDER_EMAIL, `[NEW BOOKING] ${data.referenceNumber} - ${data.sportsgroundName}`, html)
    console.log(`Provider notification email sent for ${data.referenceNumber}`)
  } catch (error) {
    console.error('Failed to send provider notification email:', error)
  }
}
