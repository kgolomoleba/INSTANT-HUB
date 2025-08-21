import React from 'react';

const ServicesPage: React.FC = () => {
  return (
    <main className="services-container">
      <header className="services-header">
        <h1>Services</h1>
        <p>Find and offer services or skills within the community.</p>
      </header>
      <section className="services-list">
        {/* Service cards will be rendered here */}
        <p>No services available yet. Be the first to offer your skills!</p>
      </section>
    </main>
  );
};

export default ServicesPage;
