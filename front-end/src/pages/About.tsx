import './About.css';

function About() {
  return (
    <div className="about-page">
      <h2>About This Project</h2>
      <p>
        This website visualizes U.S. traffic accident data to help people better
        understand the risks of travel. We created it as a data-visualization
        project for the CSS 481 Web Development course at the University of
        Washington Bothell.
      </p>
      <p>
        Our goal is to make traffic patterns and accident risk more accessible
        through clear maps and charts so travelers and planners can make more
        informed decisions.
      </p>
      <h3>Team</h3>
      <ul>
        <li>Simon</li>
        <li>Teja</li>
        <li>Aaron</li>
      </ul>
    </div>
  );
}

export default About;