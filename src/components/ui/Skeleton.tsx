/** Card-shaped placeholders while listings load. */
export function ListingSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="ui-skel-grid" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="ui-skel-card">
          <div className="ui-skel ui-skel-img" />
          <div className="ui-skel ui-skel-line" />
          <div className="ui-skel ui-skel-line short" />
        </div>
      ))}
    </div>
  )
}
