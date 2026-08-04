import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface InquiryRecord {
  id: string
  sender_id: string
  recipient_id: string
  sender_username: string
  listing_type: string
  listing_title: string
  message: string
}

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: InquiryRecord
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json()
    const inquiry = payload.record

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data: recipientData, error: recipientError } =
      await supabaseAdmin.auth.admin.getUserById(inquiry.recipient_id)

    if (recipientError || !recipientData?.user?.email) {
      console.error('Could not find recipient email', recipientError)
      return new Response(JSON.stringify({ error: 'Recipient email not found' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const recipientEmail = recipientData.user.email

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0a0a0a;">New inquiry on Instant Hub</h2>
        <p><strong>@${inquiry.sender_username}</strong> is interested in your ${inquiry.listing_type}: <strong>${inquiry.listing_title}</strong></p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #333;">${inquiry.message}</p>
        </div>
        <p style="color: #666; font-size: 13px;">Log in to Instant Hub to reply.</p>
      </div>
    `

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Instant Hub <onboarding@resend.dev>',
        to: recipientEmail,
        subject: `New inquiry: ${inquiry.listing_title}`,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errText = await resendResponse.text()
      console.error('Resend API error', errText)
      return new Response(JSON.stringify({ error: 'Failed to send email' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Unexpected error', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
