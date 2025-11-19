import { MapContainer, TileLayer, GeoJSON} from 'react-leaflet'
import { useState, useEffect } from 'react';
import { renderToString } from 'react-dom/server';
import L from 'leaflet';
import sampleData from '../assets/sampleData';
import { stateNameToAbbreviation } from '../assets/stateNames';
import Navbar from '../components/Navbar/Navbar';
import Popup from '../components/Popup/Popup';
import apiClient, { isAxiosError } from '../../axios.ts';
import 'leaflet/dist/leaflet.css'

type StateAccidentData = { [abbreviation: string]: number };

function StateMap() {
    // --- Data Constants --- //
  // GeoJSON that contains data for the shape of each state.
  const [geoData, setGeoData] = useState<any>(null);
  //const [accidentData, setAccidentData] = useState<StateAccidentData>(sampleData);
  const [accidentData, setAccidentData] = useState<StateAccidentData>(sampleData);
  
  // Center on USA
  const defaultPosition: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  // Color scale with thresholds
  const colors: { threshold: number; color: string }[] = [
    { threshold: 2000000, color: '#800026' },
    { threshold: 1000000, color: '#BD0026' },
    { threshold: 500000, color: '#E31A1C' },
    { threshold: 300000, color: '#FC4E2A' },
    { threshold: 200000, color: '#FD8D3C' },
    { threshold: 100000, color: '#FEB24C' },
    { threshold: 50000, color: '#FED976' },
    { threshold: 0, color: '#FFEDA0' }
  ];

  // Fetch US states GeoJSON
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json')
      .then(response => response.json())
      .then(data => {
        setGeoData(data);
      })
      .catch(error => console.error('Error loading GeoJSON:', error));
  }, []);

  // Fetch accident data by state from backend
  // @TODO: Replace with real backend endpoint
  useEffect(() => {    
    const controller = new AbortController();
    const fetchAccidentData = async () => {
      try {
        const response = await apiClient.get<Array<{ State: string, AccidentCount: number }>>('/accidents/count_by_state', { signal: controller.signal });
        const apiData = response.data;
        const processedData: StateAccidentData = {};
        for (const item of apiData) {
          if (item && item.State) processedData[item.State] = Number(item.AccidentCount) || 0;
        }
        if (Object.keys(processedData).length > 0) setAccidentData(processedData);
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.name !== 'CanceledError') {
            console.error('Error fetching state data, falling back to sample data:', error.message);
            setAccidentData(sampleData);
          }
        } else {
          console.error('Error fetching state data, falling back to sample data:', error);
        }
      }
    };
    fetchAccidentData();
    return () => { controller.abort(); };
  }, []);

  // --- Helper and Handler Functions --- //
  /**
   * Returns the corresponding color in the {@link colors} object to the given amount of crashes.
   * @param {number} value - Amount of crashes.
   * @returns {string} - Hex color code corresponding to the heatmap intensity.
   */
  const getColor = (value: number) => {
    for (const { threshold, color } of colors) {
      if (value > threshold) {
        return color;
      }
    }
    return colors[colors.length - 1].color;
  };

  /**
   * Styles the feature based on the corresponding data's value with {@link getColor}.
   * @param {any} feature - The feature to be styled.
   * @returns {object} - Styling data for the feature.
   */
  function style(feature: any){
    const stateName = feature.properties.name;
    const stateAbbr = stateNameToAbbreviation[stateName];
    const value = (accidentData && accidentData[stateAbbr]) || 0;
    
    return {
      fillColor: getColor(value),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    };
  };

  /**
   * Highlights the feature once the mouse enters.
   * @param {L.LeafletMouseEvent} e - Event object corresponding to the mouseover event. 
   */
  function highlightFeature(e: L.LeafletMouseEvent){
    const layer = e.target;
    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.9
    });
    layer.bringToFront();
  };

  /**
   * Resets the styling of the feature once the mouse leaves.
   * @param {L.LeafletMouseEvent} e - Event object corresponding to the mouseout event. 
   */
  function resetHighlight(e: L.LeafletMouseEvent){
    const layer = e.target;
    layer.setStyle(style(layer.feature));
  };

  /**
   * Assigns mouse handlers for showing popup content and highlighting the feature on hover.
   * @param {any} feature - The feature to assign mouse handlers to.
   * @param {L.Layer} layer - The layer the feature is on.
   */
  function onEachFeature(feature: any, layer: L.Layer){
    const stateName = feature.properties.name;
    const stateAbbr = stateNameToAbbreviation[stateName];
    const value = (accidentData && accidentData[stateAbbr]) || 0;
    
    const popupContent = renderToString(<Popup stateName={stateName} value={value}/>);
    layer.bindPopup(popupContent);
    
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight
    });
  };

  return (
    <>
        <Navbar/>
      <main className="map-container">
        <MapContainer 
          center={defaultPosition} 
          zoom={defaultZoom} 
          scrollWheelZoom={true}
          className="leaflet-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {geoData && accidentData && (
            <GeoJSON 
              data={geoData} 
              style={style}
              onEachFeature={onEachFeature}
              key={JSON.stringify(accidentData)}
            />
          )}
        </MapContainer>
        <div id="legend-container">
          <div id="legend-title-container">
            <h3 id="legend-title">Legend</h3>
          </div>
          {colors.map(({threshold, color}) => {
            return (
              <div className='legend-item' key={`${threshold}-${color}`}>
                <div className='color-swatch' style={{ backgroundColor: color }} />
                <p className='legend-threshold'>{threshold.toLocaleString()}</p>
              </div>
            );
           })}
        </div>
      </main>
    </>
  )
}

export default StateMap;