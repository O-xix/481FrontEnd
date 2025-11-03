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
                        <a>Home</a>
                    </li>
                    <li>
                        <a>HeatMap</a>
                    </li>
                    <li>
                        <a>Project</a>
                    </li>
                </ul>
            </nav>
        </header>
    );
}

export default Navbar;