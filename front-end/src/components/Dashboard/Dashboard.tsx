import { useState, useEffect, useRef } from 'react';
import './Dashboard.css';
import apiClient from '../../../axios.ts';

interface StateData {
  State: string;
  AccidentCount: number;
}

interface YearlyStats {
  year: number;
  count: number;
}

const DEFAULT_TOTAL = 7728394;
const DEFAULT_STATE_DATA: StateData[] = [
  { State: 'CA', AccidentCount: 1741433 },
  { State: 'FL', AccidentCount: 880192 },
  { State: 'TX', AccidentCount: 582837 },
  { State: 'SC', AccidentCount: 382557 },
  { State: 'NY', AccidentCount: 347960 },
];
const DEFAULT_YEARLY: YearlyStats[] = [
  { year: 2016, count: 410821 },
  { year: 2017, count: 717290 },
  { year: 2018, count: 893426 },
  { year: 2019, count: 954302 },
  { year: 2020, count: 1161598 },
  { year: 2021, count: 1412433 },
  { year: 2022, count: 1268806 },
  { year: 2023, count: 166552 },
];

function Dashboard() {
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [stateData, setStateData] = useState<StateData[]>([]);
  const [yearlyStats, setYearlyStats] = useState<YearlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mountedRef = useRef(true);

  const loadData = async () => {
    const controller = new AbortController();

    try {
      setIsLoading(true);
      setError(null);

      const config = { signal: controller.signal };

      const [totalRes, stateRes, yearlyRes] = await Promise.all([
        apiClient.get<{ total: number }>('/accidents/total_records', config),
        apiClient.get<StateData[]>('/accidents/count_by_state', config),
        apiClient.get<YearlyStats[]>('/accidents/yearly_stats', config)
      ]);

      if (!mountedRef.current) return;

      setTotalRecords(totalRes.data.total);
      setStateData(stateRes.data);
      setYearlyStats(yearlyRes.data);

    } catch (err: any) {
      if (err?.name !== 'CanceledError' && err?.name !== 'AbortError') {
        console.error('Fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setTotalRecords(DEFAULT_TOTAL);
        setStateData(DEFAULT_STATE_DATA);
        setYearlyStats(DEFAULT_YEARLY);
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }

    return () => controller.abort();
  };

  useEffect(() => {
  const controller = new AbortController();
  mountedRef.current = true;

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const config = { signal: controller.signal };

      const [totalRes, stateRes, yearlyRes] = await Promise.all([
        apiClient.get<{ total: number }>('/accidents/total_records', config),
        apiClient.get<StateData[]>('/accidents/count_by_state', config),
        apiClient.get<YearlyStats[]>('/accidents/yearly_stats', config)
      ]);

      if (!mountedRef.current) return;

      setTotalRecords(totalRes.data.total);
      setStateData(stateRes.data);
      setYearlyStats(yearlyRes.data);

    } catch (err: any) {

      if (err?.name === 'CanceledError' || err?.name === 'AbortError') return;

      console.error('Fetch error:', err);
      setError(err.message || 'Failed to load data');

      if (mountedRef.current) {
        setTotalRecords(DEFAULT_TOTAL);
        setStateData(DEFAULT_STATE_DATA);
        setYearlyStats(DEFAULT_YEARLY);
      }

    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  };

  loadData();

  return () => {
    mountedRef.current = false;
    controller.abort();    // ✅ correct cleanup
  };
}, []);


  if (isLoading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading dashboard data...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {error && (
        <div className="error-message" role="alert" style={{ marginBottom: '1rem' }}>
          <div>Error loading dashboard: {error}</div>
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={loadData} style={{ marginRight: 8 }}>Retry</button>
          </div>
        </div>
      )}

      <div className="dashboard-header">
        <h1>Accident Statistics Dashboard</h1>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h2>Total Records</h2>
          <div className="stat-value">
            {totalRecords.toLocaleString()}
          </div>
        </div>

        <div className="stat-card">
          <h2>Top 5 States by Accidents</h2>
          <div className="stat-list">
            {stateData.slice(0, 5).map((state) => (
              <div key={state.State} className="stat-item">
                <span>{state.State}</span>
                <span>{state.AccidentCount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <h2>Yearly Distribution</h2>
          <div className="stat-list">
            {yearlyStats.map((stat) => (
              <div key={stat.year} className="stat-item">
                <span>{stat.year}</span>
                <span>{stat.count.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
