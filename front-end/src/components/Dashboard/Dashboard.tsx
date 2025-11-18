import { useState, useEffect } from 'react';
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
    };

    fetchData();

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

  if (error) {
    console.log('Rendering error state:', error);
    return (
      <div className="dashboard-container">
        <div className="error-message">
          <div>Error loading dashboard: {error}</div>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
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