import React from "react";
import "./FeedPost.css";

export interface FeedPostProps {
  type: "product" | "service" | "request";
  title: string;
  description: string;
  image?: string;
  price?: string;
  author: string;
  createdAt: string;
}

const FeedPost: React.FC<FeedPostProps> = ({
  type,
  title,
  description,
  image,
  price,
  author,
  createdAt,
}) => {
  return (
    <div className="card feedpost flex flex-col gap-3">
      <div className="feedpost-header flex items-center gap-3">
  <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&w=400&q=80" alt="Real person" className="feedpost-avatar" />
        <span className={`feedpost-badge ${type}`}>{type.toUpperCase()}</span>
        <span className="feedpost-date">{createdAt}</span>
      </div>

      <h2 className="feedpost-title font-semibold text-lg">{title}</h2>
      <p className="feedpost-meta text-xs text-gray-400">by {author}</p>

      {image && (
        <div className="feedpost-image-wrapper">
          <img src={image} alt={title} className="feedpost-image rounded-xl max-h-80 object-cover" />
        </div>
      )}

      <p className="feedpost-description text-sm text-gray-300">{description}</p>

      {price && (
        <p className="feedpost-price text-md font-bold text-green-400">{price}</p>
      )}

      <div className="feedpost-actions flex gap-4 text-sm text-gray-400">
        <button className="feedpost-action hover:text-blue-500 transition">💬 Message</button>
        {type !== "request" && (
          <button className="feedpost-action hover:text-green-500 transition">
            {type === "product" ? "🛒 Buy Now" : "🤝 Offer Service"}
          </button>
        )}
        {type === "request" && (
          <button className="feedpost-action hover:text-yellow-500 transition">🙌 Help Out</button>
        )}
      </div>

      <div className="feedpost-reactions flex gap-2 mt-2">
        <button className="feedpost-like" title="Like">👍 24</button>
        <button className="feedpost-share" title="Share">🔗 Share</button>
        <button className="feedpost-save" title="Save">💾 Save</button>
      </div>
    </div>
  );
};

export default FeedPost;
