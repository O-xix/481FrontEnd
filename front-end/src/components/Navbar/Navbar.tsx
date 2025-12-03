import { Link } from 'react-router-dom';
import './Navbar.css';
/**
 * Navbar component to be used across pages for navigation.
 */
function Navbar(){
    return (
        <header id="navbar-container">
            <h1 id="navbar-title">Car Collision Heatmap</h1>
            <nav id="nav-container">
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/map">Total HeatMap</Link>
                    </li>
                    <li>
                        <Link to="/simulation">Simulation</Link>
                    </li>
                    <li>
                        <Link to="/about">About Us</Link>
                    </li>
                    <li>
                        <Link to="/dashboard">Dashboard</Link>
                    </li>
                    <li>
                        <Link to="/TableView">Table View</Link>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;