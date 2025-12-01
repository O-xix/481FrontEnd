import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { renderToString } from 'react-dom/server';
import L from 'leaflet';
import Navbar from '../components/Navbar/Navbar';
import 'leaflet/dist/leaflet.css';
import './SimulationMap.css';
import { stateNameToAbbreviation } from '../assets/stateNames';
import Popup from '../components/Popup/Popup';

type StateAccidentData = { [abbreviation: string]: number };
// Map to store processed data: { "YYYY-MM": { "StateAbbr": count, ... }, ... }
type MonthlyStateData = { [yearMonth: string]: StateAccidentData };

// Speed map: { speed_factor: interval_ms }
const SPEED_MAP = {
  '1x': 1000, // 1 second per month
  '2x': 500, // 0.5 second per month
  '4x': 250 // 0.25 second per month
} as const;

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
];

function SimulationMap() {
  // --- State Management ---
  const [geoData, setGeoData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Processed data partitioned by month
  const [monthlyData, setMonthlyData] = useState<MonthlyStateData>({});
  const [sortedMonths, setSortedMonths] = useState<string[]>([]); // Array of "YYYY-MM" strings
  const [maxMonthlyCount, setMaxMonthlyCount] = useState(0); // For color scaling (100% red)

  // Simulation State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<'1x' | '2x' | '4x'>('1x');

  // Refs to hold latest values for use inside Leaflet callbacks (avoid stale closures)
  const monthlyDataRef = useRef<MonthlyStateData>({});
  const currentIndexRef = useRef<number>(0);
  const sortedMonthsRef = useRef<string[]>([]);
  const currentMonthKeyRef = useRef<string | null>(null);
  const maxMonthlyCountRef = useRef<number>(0);
  const geoJsonLayerRef = useRef<L.GeoJSON | null>(null);

  useEffect(() => {
    monthlyDataRef.current = monthlyData;
  }, [monthlyData]);

  useEffect(() => {
    sortedMonthsRef.current = sortedMonths;
  }, [sortedMonths]);

  useEffect(() => {
    currentIndexRef.current = currentIndex;
    currentMonthKeyRef.current = sortedMonths[currentIndex] || null;
  }, [currentIndex, sortedMonths]);

  useEffect(() => {
    maxMonthlyCountRef.current = maxMonthlyCount;
  }, [maxMonthlyCount]);

  // Derived values (safe to compute from state)
  const currentMonthKey = sortedMonths[currentIndex] || null;

  const currentMonthDisplay = useMemo(() => {
    if (!currentMonthKey) return 'Loading Data...';
    const [yearStr, monthStr] = currentMonthKey.split('-');
    const year = Number(yearStr);
    const month = Number(monthStr);
    if (!Number.isNaN(year) && !Number.isNaN(month) && month >= 1 && month <= 12) {
      return `${MONTH_NAMES[month - 1]} ${year}`;
    }
    return currentMonthKey;
  }, [currentMonthKey]);

  // --- Fetch GeoJSON ---
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(
          'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json'
        );
        if (!mounted) return;
        const data = await res.json();

        // Precompute and attach state abbreviation to each feature to avoid repeated lookups
        if (data && data.features && Array.isArray(data.features)) {
          for (const feature of data.features) {
            const name = feature.properties?.name;
            feature.properties = feature.properties || {};
            feature.properties.stateAbbr = stateNameToAbbreviation[name] || null;
          }
        }

        if (mounted) setGeoData(data);
      } catch (err) {
        console.error('Error loading GeoJSON:', err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Fetch Monthly Data from backend ---
  useEffect(() => {
    let mounted = true;
    const fetchMonthly = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/accidents/monthly_count_by_state', { cache: 'no-store' });
        if (!mounted) return;
        if (!res.ok) throw new Error(`Backend error: ${res.status}`);
        const json = await res.json();
        if (!json || !json.data || !Array.isArray(json.data)) {
            console.error("Invalid monthly data response:", json);
            setIsLoading(false);
            return;
        }

        const { max_count, data } = json;


        const processedData: MonthlyStateData = {};
        const monthsSet = new Set<string>();

        for (const item of data) {
          if (!processedData[item.YearMonth]) {
            processedData[item.YearMonth] = {};
            monthsSet.add(item.YearMonth);
          }
          processedData[item.YearMonth][item.State] = item.Count;
        }

        // Correct chronological sort: parse YYYY-MM into Date objects
        const sortedMonthsArray = Array.from(monthsSet).sort((a, b) => {
          const [aY, aM] = a.split('-').map(Number);
          const [bY, bM] = b.split('-').map(Number);
          const da = new Date(aY, aM - 1);
          const db = new Date(bY, bM - 1);
          return +da - +db;
        });

        if (!mounted) return;
        setMonthlyData(processedData);
        setSortedMonths(sortedMonthsArray);
        setMaxMonthlyCount(Number(max_count) || 0);
        setCurrentIndex(0);
      } catch (err) {
        console.error('Error fetching monthly state data:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    fetchMonthly();
    return () => {
      mounted = false;
    };
  }, []);

  // --- Color scale with thresholds (matching StateMap style) ---
  const getColorThresholds = useCallback((max: number) => {
    // Scale thresholds based on monthly max to maintain similar visual distribution
    return [
      { threshold: max * 0.9, color: '#800026' },
      { threshold: max * 0.7, color: '#BD0026' },
      { threshold: max * 0.5, color: '#E31A1C' },
      { threshold: max * 0.3, color: '#FC4E2A' },
      { threshold: max * 0.15, color: '#FD8D3C' },
      { threshold: max * 0.05, color: '#FEB24C' },
      { threshold: max * 0.01, color: '#FED976' },
      { threshold: 0, color: '#FFEDA0' }
    ];
  }, []);

  const getColor = useCallback((value: number) => {
    const max = maxMonthlyCountRef.current || maxMonthlyCount;
    if (!max || max === 0 || !value) return '#FFEDA0';
    const thresholds = getColorThresholds(max);
    for (const { threshold, color } of thresholds) {
      if (value >= threshold) {
        return color;
      }
    }
    return '#FFEDA0';
  }, [maxMonthlyCount, getColorThresholds]);

  // --- Leaflet style function (stable) ---
  // NOTE: style will read the latest data from refs so styles update properly without re-creating the layer
  const style = useCallback((feature: any) => {
    const abbr = feature.properties?.stateAbbr as string | null;
    const key = currentMonthKeyRef.current;
    const count = (key && monthlyDataRef.current[key] && abbr && monthlyDataRef.current[key][abbr]) || 0;
    return {
      fillColor: getColor(count),
      weight: 2,
      opacity: 1,
      color: 'white',
      dashArray: '3',
      fillOpacity: 0.7
    } as L.PathOptions;
  }, [getColor]);

  // --- highlight/reset helpers (stable references) ---
  const highlightFeature = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target as L.GeoJSON<any>;
    layer.setStyle({
      weight: 5,
      color: '#666',
      dashArray: '',
      fillOpacity: 0.9
    } as L.PathOptions);
    if ((layer as any).bringToFront) (layer as any).bringToFront();
  }, []);

  const resetHighlight = useCallback((e: L.LeafletMouseEvent) => {
    const layer = e.target as L.GeoJSON<any>;
    // Always recompute from current data to avoid stale styles
    layer.setStyle(style(layer.feature));
  }, [style]);

  // --- onEachFeature: set hover & click behavior; click builds popup using current refs ---
  const onEachFeature = useCallback((feature: any, layer: L.Layer) => {
    // Capture the parent GeoJSON layer for periodic redraws
    if (layer instanceof L.GeoJSON) {
      geoJsonLayerRef.current = layer as L.GeoJSON;
    } else if ((layer as any).getPane) {
      // If layer is a feature within a GeoJSON, try to find parent
      const parent = (layer as any)._featureGroup;
      if (parent instanceof L.GeoJSON) {
        geoJsonLayerRef.current = parent as L.GeoJSON;
      }
    }

    // Mouse interactions
    layer.on({
      mouseover: highlightFeature,
      mouseout: resetHighlight
    });

    // Click/popups: build popup content at click time using refs (so values are current)
    layer.on('click', () => {
      const name = feature.properties?.name;
      const abbr = feature.properties?.stateAbbr as string | null;
      const key = currentMonthKeyRef.current;
      const val = (key && abbr && monthlyDataRef.current[key] && monthlyDataRef.current[key][abbr]) || 0;
      const popupContent = renderToString(<Popup stateName={name} value={val} />);
      // bind and open popup (creates with current content)
      (layer as any).bindPopup(popupContent).openPopup();
    });
  }, [highlightFeature, resetHighlight]);

  // --- Simulation advance logic using refs to avoid stale closures ---
  const intervalRef = useRef<number | null>(null);

  // Advance month uses refs and functional updates for safety
  const advanceMonth = useCallback(() => {
    // use functional setState so we always get the latest index
    setCurrentIndex(prevIndex => {
      const nextIndex = prevIndex + 1;
      const len = sortedMonthsRef.current.length;
      if (nextIndex >= len) {
        // stop playing and reset to 0 for replay
        setIsPlaying(false);
        return 0;
      }
      return nextIndex;
    });
  }, []);

  // Manage interval when isPlaying or speed changes
  useEffect(() => {
    // cleanup any previous interval
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (isPlaying && sortedMonthsRef.current.length > 0) {
      const ms = SPEED_MAP[speed];
      const id = window.setInterval(() => {
        advanceMonth();
      }, ms);
      intervalRef.current = id;
      return () => {
        if (intervalRef.current !== null) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      };
    }

    // if not playing ensure interval is cleared
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, speed, advanceMonth]);

  // --- Update colors when month changes ---
  useEffect(() => {
    if (geoJsonLayerRef.current) {
      geoJsonLayerRef.current.eachLayer((layer: L.Layer) => {
        const geoLayer = layer as L.GeoJSON<any>;
        if (geoLayer.feature) {
          geoLayer.setStyle(style(geoLayer.feature));
        }
      });
    }
  }, [currentIndex, style]);

  // --- Controls handlers ---
  const handlePlayPause = () => {
    // If at final frame and not playing, start from beginning
    if (!isPlaying && currentIndex === sortedMonths.length - 1 && sortedMonths.length > 0) {
      setCurrentIndex(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(prev => !prev);
    }
  };

  const handleSpeedChange = (newSpeed: typeof speed) => {
    setSpeed(newSpeed);
  };

  // --- Render ---
  const defaultPosition: [number, number] = [39.8283, -98.5795];
  const defaultZoom = 4;

  return (
    <>
      <Navbar />

      <main className="map-container">
        <div className="simulation-controls">
          <span className="current-month-display">{isLoading ? 'Loading...' : currentMonthDisplay}</span>

          <button
            className={`play-pause-btn ${isPlaying ? 'playing' : ''}`}
            onClick={handlePlayPause}
            disabled={isLoading || sortedMonths.length === 0}
          >
            {isPlaying ? 'Pause' : currentIndex === sortedMonths.length - 1 ? 'Replay' : 'Play'}
          </button>

          {(['1x', '2x', '4x'] as const).map(s => (
            <button
              key={s}
              className={`speed-btn ${speed === s ? 'active' : ''}`}
              onClick={() => handleSpeedChange(s)}
              disabled={isLoading}
            >
              {s}
            </button>
          ))}
        </div>

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

          {/* Only mount GeoJSON once (no key that forces re-mount per frame).
              style/onEachFeature reference stable callbacks that read latest data via refs. */}
          {!isLoading && geoData && (
            <GeoJSON 
              data={geoData} 
              style={style} 
              onEachFeature={onEachFeature}
              ref={geoJsonLayerRef as any}
            />
          )}
        </MapContainer>

        <div id="legend-container">
          <div id="legend-title-container">
            <h3 id="legend-title">Monthly Crashes</h3>
          </div>
          {getColorThresholds(maxMonthlyCount).map(({threshold, color}) => {
            return (
              <div className='legend-item' key={`${threshold}-${color}`}>
                <div className='color-swatch' style={{ backgroundColor: color }} />
                <p className='legend-threshold'>{Math.round(threshold).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}

export default SimulationMap;
