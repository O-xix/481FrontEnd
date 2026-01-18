# Car Collision Heatmap — CSS 481 Project

A data-visualization web app that visualizes U.S. traffic accident data (2016–2023) with interactive maps, charts, tables, and a simulation view. Built as a group project for the CSS 481 Web Development course at the University of Washington Bothell.

Live demo: https://481-front-end.vercel.app/

## About

This project provides visual insights into U.S. car collision patterns using maps, heatmaps, charts, and a table view. The goal is to make accident risk and traffic patterns more accessible to travelers, planners, and anyone interested in road safety.

## Features

- Interactive nationwide heatmap of collisions
- State-level maps and simulation mode
- Dashboard with aggregated charts
- Tabular view with sorting, filtering, and column highlighting
- Column descriptions and metadata for dataset fields

## Data source

Primary dataset used in this project:
- Kaggle: "US Accidents" (2016–2023) — https://www.kaggle.com/datasets/sobhanmoosavi/us-accidents

The repository contains project milestone artifacts and example pages that demonstrate loading and summarizing the dataset.

## Tech stack

- React + TypeScript
- Vite (dev server + build)
- Axios (HTTP client)
- react-router (routing)
- Leaflet / react-leaflet (maps) — project includes map components and styles
- CSS for styling

(See the frontend package.json for exact dependency versions.)

## Repository structure

A high-level summary of the repository layout:

- front-end/ — React + TypeScript app (main application)
  - src/
    - components/ — shared components: Navbar, Dashboard, TableView, etc.
    - pages/ — application pages: Home, StateMap, SimulationMap, About, ...
    - assets/ — static assets and column descriptions
    - main.tsx, App.tsx, index.css, App.css, etc.
  - index.html
  - README.md (front-end specific)
- GroupProjectMilestone1/ — milestone 1 deliverables (static HTML + notes)
- GroupProjectMilestone2/ — milestone 2 deliverables and scripts
- Other project artifacts and example pages

## Getting started (local development)

Prerequisites:
- Node.js (recommended >= 16, preferably 18+)
- npm or yarn

Steps:

1. Clone the repository
   - git clone https://github.com/O-xix/481FrontEnd.git
2. Change to the front-end directory
   - cd 481FrontEnd/front-end
3. Install dependencies
   - npm install
   - or: yarn
4. Run the dev server
   - npm run dev
   - or: yarn dev

The Vite dev server will start and show a local URL (typically http://localhost:5173). Open it in your browser.

## Build & preview

To create a production build:

- npm run build
- or: yarn build

To preview the production build locally:

- npm run preview
- or: yarn preview

The output folder will be `dist/`.

## Contributing

Contributions are welcome. Typical workflow:

1. Fork the repository
2. Create a branch for your feature or fix
3. Implement changes and add tests/styles as needed
4. Open a pull request with a clear description of changes

Please follow any existing code style and commit-message conventions used in the project.

## Authors

Team (as listed in the app About page):
- Simon Little
- Teja Dasari
- Aaron Quashnock

Repository owner: O-xix (Teja Dasari)

## License

See the LICENSE file in the repository (if present). If no license is included, this project currently has no explicit license and you should contact the repository owner for reuse permissions.
