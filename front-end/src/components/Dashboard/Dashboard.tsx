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

// Default fallback data
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

  useEffect(() => {
    const controller = new AbortController();

    const fetchData = async () => {
      try {
        // Set loading state at the beginning of the fetch
        setIsLoading(true);
        setError(null);

        const config = {
          signal: controller.signal,
        };

        // Fetch all endpoints in parallel
        const [totalRes, stateRes, yearlyRes] = await Promise.all([
          apiClient.get<{ total: number }>('/accidents/total_records', config),
          apiClient.get<StateData[]>('/accidents/count_by_state', config),
          apiClient.get<YearlyStats[]>('/accidents/yearly_stats', config)
        ]);

        // Set state with the data from the responses
        setTotalRecords(totalRes.data.total);
        setStateData(stateRes.data);
        setYearlyStats(yearlyRes.data);

      } catch (err: any) {
        // Ignore abort errors, which are expected on unmount
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Fetch error:', err);
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
        }
      } finally {
        // This runs regardless of success or failure
        setIsLoading(false);
      }

      const [totalData, stateJson, yearlyJson] = await Promise.all([
        totalRes.json(),
        stateRes.json(),
        yearlyRes.json()
      ]);

      if (!mountedRef.current) return;

      setTotalRecords(Number(totalData.total) || 0);
      setStateData(Array.isArray(stateJson) ? stateJson : []);
      setYearlyStats(Array.isArray(yearlyJson) ? yearlyJson : []);
      setIsLoading(false);
      setError(null);
    } catch (err: any) {
      if (err && err.name === 'AbortError') {
        console.log('Fetch aborted (expected on unmount/retry)');
        return;
      }

      console.error('Fetch error:', err);

      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'Failed to fetch data');
        setTotalRecords(DEFAULT_TOTAL);
        setStateData(DEFAULT_STATE_DATA);
        setYearlyStats(DEFAULT_YEARLY);
        setIsLoading(false);
      }
    } finally {
      // clear controllerRef if it's still this controller
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  }

  useEffect(() => {
    mountedRef.current = true;
    loadData();

    return () => {
      controller.abort();
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
      {/* non-blocking error banner: user sees dashboard and error message */}
      {error && (
        <div className="error-message" role="alert" style={{ marginBottom: '1rem' }}>
          <div>Error loading dashboard: {error}</div>
          <div style={{ marginTop: '0.5rem' }}>
            <button onClick={() => loadData()} style={{ marginRight: 8 }}>Retry</button>
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
            {totalRecords ? totalRecords.toLocaleString() : 'No data'}
          </div>
        </div>

        <div className="stat-card">
          <h2>Top 5 States by Accidents</h2>
          <div className="stat-list">
            {stateData.length > 0 ? (
              stateData.slice(0, 5).map((state) => (
                <div key={state.State} className="stat-item">
                  <span>{state.State}</span>
                  <span>{state.AccidentCount.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="no-data">No state data available</div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <h2>Yearly Distribution</h2>
          <div className="stat-list">
            {yearlyStats.length > 0 ? (
              yearlyStats.map((stat) => (
                <div key={stat.year} className="stat-item">
                  <span>{stat.year}</span>
                  <span>{stat.count.toLocaleString()}</span>
                </div>
              ))
            ) : (
              <div className="no-data">No yearly data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;