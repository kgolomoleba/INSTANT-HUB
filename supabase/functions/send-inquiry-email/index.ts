import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Shared secret sent by the database webhook in an "x-webhook-secret" header.
// Without it, anyone who knows this function's address could make it email any user.
const WEBHOOK_SECRET = Deno.env.get('INQUIRY_WEBHOOK_SECRET')

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: { id: string }
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

/** Escape user-written text before putting it in the email's HTML. */
const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)

Deno.serve(async (req) => {
  try {
    if (!WEBHOOK_SECRET || req.headers.get('x-webhook-secret') !== WEBHOOK_SECRET) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const payload: WebhookPayload = await req.json()
    if (payload?.type !== 'INSERT' || payload.table !== 'inquiries' || !payload.record?.id) {
      return json({ error: 'Unexpected payload' }, 400)
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Read the inquiry from the database rather than trusting the request body.
    const { data: inquiry, error: inquiryError } = await supabaseAdmin
      .from('inquiries')
      .select('id, recipient_id, sender_username, listing_type, listing_title, message')
      .eq('id', payload.record.id)
      .single()
    if (inquiryError || !inquiry) return json({ error: 'Inquiry not found' }, 404)

    const { data: recipientData, error: recipientError } = await supabaseAdmin.auth.admin.getUserById(
      inquiry.recipient_id,
    )

    if (recipientError || !recipientData?.user?.email) {
      console.error('Could not find recipient email', recipientError)
      return json({ error: 'Recipient email not found' }, 400)
    }

    const recipientEmail = recipientData.user.email

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #0a0a0a;">New inquiry on Instant Hub</h2>
        <p><strong>@${esc(inquiry.sender_username)}</strong> is interested in your ${esc(inquiry.listing_type)}: <strong>${esc(inquiry.listing_title)}</strong></p>
        <div style="background: #f5f5f5; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="margin: 0; color: #333; white-space: pre-wrap;">${esc(inquiry.message)}</p>
        </div>
        <p style="color: #666; font-size: 13px;">Log in to Instant Hub to reply.</p>
      </div>
    `

    const subjectTitle = String(inquiry.listing_title ?? 'your listing').replace(/[\r\n]+/g, ' ').slice(0, 120)

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Instant Hub <onboarding@resend.dev>',
        to: recipientEmail,
        subject: `New inquiry: ${subjectTitle}`,
        html: emailHtml,
      }),
    })

    if (!resendResponse.ok) {
      const errText = await resendResponse.text()
      console.error('Resend API error', errText)
      return json({ error: 'Failed to send email' }, 500)
    }

    return json({ success: true }, 200)
  } catch (err) {
    console.error('Unexpected error', err)
    return json({ error: 'Internal error' }, 500)
  }
})
