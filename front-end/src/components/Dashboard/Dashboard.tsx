import { useState, useEffect } from 'react';
import './Dashboard.css';

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
    let mounted = true;
    let controller = new AbortController();

    const fetchData = async () => {
      try {
        const options = {
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        };

        const [totalRes, stateRes, yearlyRes] = await Promise.all([
          fetch('/accidents/total_records', options),
          fetch('/accidents/count_by_state', options),
          fetch('/accidents/yearly_stats', options)
        ]);

        if (!mounted) {
          console.log('Component unmounted, aborting data processing');
          return;
        }

        const responses = {
          total: totalRes.ok,
          state: stateRes.ok,
          yearly: yearlyRes.ok
        };

        if (!totalRes.ok || !stateRes.ok || !yearlyRes.ok) {
          throw new Error(`API Error: ${JSON.stringify(responses)}`);
        }

        const [totalData, stateData, yearlyData] = await Promise.all([
          totalRes.json(),
          stateRes.json(),
          yearlyRes.json()
        ]);

        if (mounted) {
          setTotalRecords(totalData.total);
          setStateData(stateData);
          setYearlyStats(yearlyData);
          setIsLoading(false);
        }
      } catch (err: any) {
        // Ignore aborts caused by navigation/unmount; treat others as real errors
        if (err && err.name === 'AbortError') {
          return;
        }
        console.error('Fetch error:', err);
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch data');
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
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