import Logo from './Logo'

/** The left panel on the sign-in and sign-up pages: a short reason to join. */
export default function AuthAside() {
  return (
    <aside className="auth-aside">
      <Logo size={44} />
      <h2>Where local business gets done.</h2>
      <ul>
        <li>
          <b>List in minutes.</b> Put your products and services in front of nearby buyers.
        </li>
        <li>
          <b>Never miss a lead.</b> Inquiries land on your dashboard, and you can reply when it suits you.
        </li>
        <li>
          <b>Show how you're doing.</b> Share a financial health report with funders you choose.
        </li>
      </ul>
    </aside>
  )
}
