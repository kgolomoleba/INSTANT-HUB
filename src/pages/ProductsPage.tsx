import React from 'react';

const ProductsPage: React.FC = () => {
  return (
    <main className="products-container">
      <header className="products-header">
        <h1>Products</h1>
        <p>Browse and discover products offered by the community.</p>
      </header>
      <section className="products-list">
        {/* Product cards will be rendered here */}
        <p>No products available yet. Be the first to list a product!</p>
      </section>
    </main>
  );
};

export default ProductsPage;