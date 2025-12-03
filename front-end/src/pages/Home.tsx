import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-page">
      <header className="home-header">
        <h2>Welcome to the U.S. Car Collision Heatmap</h2>
        <p>Explore accident patterns across the United States with interactive maps and charts.</p>
      </header>

      <section className="home-actions">
        <Link to="/map" className="btn">View Heatmap</Link>
        <Link to="/simulation" className="btn">View Simulation</Link>
        <Link to="/dashboard" className="btn">Open Dashboard</Link>
        <Link to="/TableView" className="btn">Table View</Link>
        <Link to="/about" className="btn btn-secondary">About Us</Link>
      </section>
    </div>
  );
}

export default Home;