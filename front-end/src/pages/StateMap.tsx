import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import { useState, useEffect, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import L from 'leaflet';
import {sampleData, populationMap} from '../assets/sampleData';
import { stateNameToAbbreviation } from '../assets/stateNames';
import Popup from '../components/Popup/Popup';
import apiClient, { isAxiosError } from '../../axios.ts';
import 'leaflet/dist/leaflet.css'
import './StateMap.css';

type StateAccidentData = { [abbreviation: string]: number };
type CountyAccidentData = { [fips: string]: number };

function StateMap() {
    // --- Data Constants --- //
  const [geoData, setGeoData] = useState<any>(null);
  const [accidentData, setAccidentData] = useState<StateAccidentData>(sampleData);

  const [selectedState, setSelectedState] = useState<{ name: string, abbr: string, fips: string } | null>(null);
  const [countyGeoData, setCountyGeoData] = useState<any>(null);
  const [countyAccidentData, setCountyAccidentData] = useState<CountyAccidentData | null>(null);
  const [isLoadingCounties, setIsLoadingCounties] = useState(false);
  const [percentageAdjustment, setPercentageAdjustment] = useState(0);
  const [modifiedAccidentData, setModifiedAccidentData] = useState<StateAccidentData>(sampleData);
  
  // Center on USA
  const defaultPosition: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  // Ref to store GeoJSON layers by state abbreviation
  const stateLayersRef = useRef<Map<string, L.Layer>>(new Map());
  // Ref to store the map instance
  const mapRef = useRef<L.Map | null>(null);

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
        if (Object.keys(processedData).length > 0) {
          setAccidentData(processedData);
          setModifiedAccidentData(processedData);
        }
      } catch (error) {
        if (isAxiosError(error)) {
          if (error.name !== 'CanceledError') {
            console.error('Error fetching state data, falling back to sample data:', error.message);
            setAccidentData(sampleData);
            setModifiedAccidentData(sampleData);
          }
        } else {
          console.error('Error fetching state data, falling back to sample data:', error);
          setAccidentData(sampleData);
          setModifiedAccidentData(sampleData);
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
   * Calculates the adjusted accident count based on the percentage adjustment.
   * @returns {number} - Adjusted accident count for the selected state.
   */
  const getAdjustedAccidentCount = () => {
    if (!selectedState) return 0;
    const baseCount = accidentData[selectedState.abbr] || 0;
    return Math.round(baseCount * (1 + percentageAdjustment / 100));
  };

  /**
   * Applies the percentage adjustment to the selected state's accident data.
   */
  const applyAdjustment = () => {
    if (!selectedState) return;
    const adjustedData = { ...modifiedAccidentData };
    adjustedData[selectedState.abbr] = getAdjustedAccidentCount();
    setModifiedAccidentData(adjustedData);
  };

  /**
   * Gets the heatmap color for the selected state based on its altered accident count.
   * @returns {string} - Hex color code for the selected state.
   */
  const getStateColor = () => {
    if (!selectedState) return '#FFEDA0';
    const value = modifiedAccidentData[selectedState.abbr] || 0;
    return getColor(value);
  };

  /**
   * Styles the feature based on the corresponding data's value with {@link getColor}.
   * @param {any} feature - The feature to be styled.
   * @returns {object} - Styling data for the feature.
   */
  function style(feature: any){
    const stateName = feature.properties.name;
    const stateAbbr = stateNameToAbbreviation[stateName];
    const value = (modifiedAccidentData && modifiedAccidentData[stateAbbr]) || 0;
    
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
    
    // Store layer reference for refocus button
    stateLayersRef.current.set(stateAbbr, layer);
    
    const popupContent = renderToString(<Popup stateName={stateName} value={value}/>);
    layer.bindPopup(popupContent);
    
    const zoomToFeature = (e: L.LeafletMouseEvent) => {
      const map = e.target._map;
      map.fitBounds(e.target.getBounds());
      setSelectedState({ name: stateName, abbr: stateAbbr, fips: feature.id });
      setPercentageAdjustment(0);
    };

    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight,
      click: zoomToFeature
    });
  };

  console.log(countyAccidentData);

  // --- County-Level Functions --- //
  useEffect(() => {
    if (!selectedState) return;

    const fetchCountyData = async () => {
      setIsLoadingCounties(true);
      setCountyGeoData(null);
      setCountyAccidentData(null);
      try {
        // 1. Fetch County GeoJSON for the selected state
        // Assumes you have placed the split files in /public/geojson/states/
        const geoJsonResponse = await fetch(`/states/${selectedState.fips}.json`);
        const geoJsonData = await geoJsonResponse.json();
        setCountyGeoData(geoJsonData);

        // 2. Fetch County Accident Data from your backend
        const accidentResponse = await apiClient.get<Array<{ FIPS: string, AccidentCount: number }>>(`/accidents/count_by_county?state_fips=${selectedState.fips}`);
        const apiData = accidentResponse.data;
        const processedData: CountyAccidentData = {};
        for (const item of apiData) {
          if (item && item.FIPS) processedData[item.FIPS] = Number(item.AccidentCount) || 0;
        }
        setCountyAccidentData(processedData);

      } catch (error) {
        console.error(`Error fetching county data for ${selectedState.name}:`, error);
        // Optionally, handle the error, e.g., by showing a notification
      } finally {
        setIsLoadingCounties(false);
      }
    };

    fetchCountyData();
  }, [selectedState]);

  // Style function for counties
  function styleCounty(feature: any) {
    const fips = feature.properties.STATE + feature.properties.COUNTY;
    const value = (countyAccidentData && countyAccidentData[fips]) || 0;
    return {
      fillColor: getColor(value), // We can reuse the state color logic
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  }

  // Popup/hover handlers for counties
  function onEachCountyFeature(feature: any, layer: L.Layer) {
    const countyName = feature.properties.NAME;
    const fips = feature.properties.STATE + feature.properties.COUNTY;
    const value = (countyAccidentData && countyAccidentData[fips]) || 0;
    const popupContent = renderToString(<Popup stateName={`${countyName} County`} value={value} />);
    layer.bindPopup(popupContent);
  }

  // Component to capture the map instance
  function MapCapturer() {
    const map = useMap();
    mapRef.current = map;
    return null;
  }

  return (
    <>
      <main className="map-container">
        <MapContainer 
          center={defaultPosition} 
          zoom={defaultZoom} 
          scrollWheelZoom={true}
          className="leaflet-map"
          zoomControl={true}
        >
          <MapCapturer />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />``
          {!selectedState && geoData && accidentData && (
            <GeoJSON 
              data={geoData} 
              style={style}
              onEachFeature={onEachFeature}
              key={JSON.stringify(accidentData)}
            />
          )}
          {selectedState && !isLoadingCounties && countyGeoData && countyAccidentData && (
            <GeoJSON
              data={countyGeoData}
              style={styleCounty}
              onEachFeature={onEachCountyFeature}
              key={selectedState.abbr}
            />
          )}
        </MapContainer>
        <aside className={`sidebar ${selectedState ? 'open' : ''}`} style={{ borderLeftColor: selectedState ? getStateColor() : 'transparent' }}>
          {selectedState && (
            <div className="sidebar-content">
              <div className="sidebar-buttons">
                <button 
                  className="back-button orange-button"
                  onClick={() => {
                    setSelectedState(null);
                    setCountyGeoData(null);
                    setCountyAccidentData(null);
                    setIsLoadingCounties(false);

                    mapRef.current?.setView(defaultPosition, defaultZoom);
                  }}
                  title="Back to US Map"
                >
                  Back
                </button>
                <button 
                  className="refocus-button gray-button"
                  onClick={() => {
                    const layer = stateLayersRef.current.get(selectedState.abbr);
                    const map = mapRef.current;
                    if (layer && map && 'getBounds' in layer) {
                      map.fitBounds((layer as any).getBounds());
                    }
                  }}
                  title="Recenter on state"
                >
                  Recenter
                </button>
              </div>
              <div className="sidebar-header">
                <h2>{selectedState.name}</h2>
              </div>
              <div className="state-info">
                <div className="info-row">
                  <span className="info-label">State Code:</span>
                  <span className="info-value">{selectedState.abbr}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Population:</span>
                  <span className="info-value">{populationMap[selectedState.abbr]?.toLocaleString() || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Accident Count:</span>
                  <span className="info-value">{accidentData[selectedState.abbr]?.toLocaleString() || 0}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Accident Per Person:</span>
                  <span className="info-value">{(accidentData[selectedState.abbr] / populationMap[selectedState.abbr])?.toLocaleString() || 0}</span>
                </div>
                <div className="info-section">
                  <h3>Adjust Crashes</h3>
                  <div className="info-row">
                    <span className="info-label">Altered Accident Count:</span>
                    <span className="info-value">{modifiedAccidentData[selectedState.abbr]?.toLocaleString() || 0}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Altered Accident Per Person:</span>
                    <span className="info-value">{(modifiedAccidentData[selectedState.abbr] / populationMap[selectedState.abbr])?.toLocaleString() || 0}</span>
                  </div>
                  <div className="adjustment-controls">
                    <div className="adjustment-value">
                      <span>{percentageAdjustment > 0 ? '+' : ''}{percentageAdjustment}%</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={percentageAdjustment}
                      onChange={(e) => setPercentageAdjustment(Number(e.target.value))}
                      className="adjustment-slider"
                    />
                    <button 
                      className="set-button orange-button"
                      onClick={applyAdjustment}
                    >
                      Set
                    </button>
                  </div>
                  <div className="adjustment-display">
                    <div className="adjustment-result">
                      <span className="result-label">Adjusted Count:</span>
                      <span className="result-value">{getAdjustedAccidentCount().toLocaleString()}</span>
                    </div>
                  </div>
                  <button 
                    className="reset-button gray-button"
                    onClick={() => {
                      setPercentageAdjustment(0);
                      setModifiedAccidentData({ ...modifiedAccidentData, [selectedState!.abbr]: accidentData[selectedState!.abbr] || 0 });
                    }}
                  >
                    Reset to Original
                  </button>
                </div>
                <div className="info-section">
                  <h3>County Data</h3>
                  <div className="info-row">
                    <span className="info-label">Total County Accidents:</span>
                    <span className="info-value">{countyAccidentData ? Object.values(countyAccidentData).reduce((a, b) => a + b, 0).toLocaleString() : 'Loading...'}</span>
                  </div>
                  {isLoadingCounties ? (
                    <p>Loading county data...</p>
                  ) : countyAccidentData ? (
                    <div className="county-list">
                      {Object.entries(countyAccidentData)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 10)
                        .map(([fips, count]) => (
                          <div key={fips} className="county-item">
                            <span>{fips}</span>
                            <span className="county-count">{count.toLocaleString()}</span>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <p>No county data available</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>
        <button 
          className="us-recenter-button"
          onClick={() => {
            mapRef.current?.setView(defaultPosition, defaultZoom);
          }}
          title="Recenter on USA"
        >
          Recenter
        </button>
        <div className="legend-container">
          <div className="legend-title-container">
            <h3 className="legend-title">Legend</h3>
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
        {isLoadingCounties && (
            <div className='loading-popup'>
              <p>Loading County Data...</p>
              <div className='loading-spinner'></div>
            </div>
          )
        }  
      </main>
    </>
  )
}

export default StateMap;