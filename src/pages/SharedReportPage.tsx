import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import FinanceReport from '../components/finance/FinanceReport'
import { Button, Loading, Notice, Page, PageHeader } from '../components/ui'
import { errorMessage } from '../utils/errors'
import type { FinReport } from '../utils/finance'
import { reportByGrant, reportByLink } from '../utils/financeApi'

/** A financial health report shared with a link (/report/:token) or with a user (/finance/shared/:ownerId). */
export default function SharedReportPage({ mode }: { mode: 'link' | 'grant' }) {
  const { token, ownerId } = useParams()
  const [report, setReport] = useState<FinReport | null | undefined>(undefined)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Shared links should not leak through the Referer header or be indexed.
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.appendChild(meta)
    const ref = document.createElement('meta')
    ref.name = 'referrer'
    ref.content = 'no-referrer'
    document.head.appendChild(ref)
    return () => {
      meta.remove()
      ref.remove()
    }
  }, [])

  useEffect(() => {
    let live = true
    ;(mode === 'link' ? reportByLink(token ?? '') : reportByGrant(ownerId ?? ''))
      .then((r) => live && setReport(r))
      .catch((e) => live && setError(errorMessage(e, "Couldn't load the report.")))
    return () => {
      live = false
    }
  }, [mode, token, ownerId])

  if (error)
    return (
      <Page>
        <Notice tone="error">{error}</Notice>
      </Page>
    )
  if (report === undefined) return <Page><Loading text="Loading report…" /></Page>
  if (report === null)
    return (
      <Page>
        <PageHeader title="Report not available" intro="This link has expired or been switched off by the business. Ask them for a new one." />
      </Page>
    )

  const until = report.expires_at ? new Date(report.expires_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' }) : null
  return (
    <Page>
      <PageHeader
        title="Financial health report"
        intro={`Shared by the business${report.shared_as ? ` for "${report.shared_as}"` : ''}${until ? `, available until ${until}` : ''}.`}
        actions={
          <Button className="no-print" onClick={() => window.print()}>
            Print or save as PDF
          </Button>
        }
      />
      <FinanceReport summary={report.summary} months={report.months} business={report.business} verified={report.verification_status === 'verified'} />
    </Page>
  )
}
