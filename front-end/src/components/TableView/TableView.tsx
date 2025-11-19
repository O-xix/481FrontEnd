import { useState, useEffect, useMemo } from 'react';
import apiClient from '../../../axios';
import './TableView.css';

// Define a type for our data items for better type-checking
type DataItem = { [key: string]: any };

function TableView() {
    // --- State Management ---
    const [allData, setAllData] = useState<DataItem[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // State for UI controls
    const [filterColumn, setFilterColumn] = useState<string>('');
    const [filterValue, setFilterValue] = useState<string>('');
    const [sortColumn, setSortColumn] = useState<string>('');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
    const [columnLimit, setColumnLimit] = useState<number | null>(null);
    const [showSummary, setShowSummary] = useState<boolean>(false);

    // --- Data Fetching ---
    useEffect(() => {
        // Assuming your backend has a '/data' endpoint that returns the same JSON structure
        apiClient.get('/accidents/data/1/1')
            .then(response => {
                // From the curl output, we know response.data is a valid JSON array.
                const data: DataItem[] = response.data;

                // Ensure data is an array and not empty before proceeding.
                if (Array.isArray(data) && data.length > 0) {
                    const dataHeaders = Object.keys(data[0]);
                    setAllData(data);
                    setHeaders(dataHeaders);

                    setFilterColumn(dataHeaders[0]); // Set default for filter dropdown
                    setSortColumn(dataHeaders[0]);   // Set default for sort dropdown
                }
                setLoading(false); // This MUST be outside the if-block to stop loading
            })
            .catch(err => {
                console.error("Error fetching data:", err);
                setError("Failed to load data. Please check the console for more details.");
                setLoading(false);
            });
    }, []); // Empty dependency array means this runs once on component mount

    // --- Derived State & Memoization ---
    // This large block of logic is memoized to prevent re-calculation on every render.
    // It will only re-run if its dependencies (allData, filter, sort, etc.) change.
    const processedData = useMemo(() => {
        let data = [...allData];

        // 1. Filter data
        if (filterValue.trim() !== '') {
            data = data.filter(item =>
                String(item[filterColumn] ?? '').toLowerCase().includes(filterValue.toLowerCase())
            );
        }

        // 2. Sort data
        if (sortColumn) {
            data.sort((a, b) => {
                const aVal = a[sortColumn];
                const bVal = b[sortColumn];

                if (aVal == null && bVal == null) return 0;
                if (aVal == null) return 1;
                if (bVal == null) return -1;

                let comparison = 0;
                if (typeof aVal === 'number' && typeof bVal === 'number') {
                    comparison = aVal - bVal;
                } else {
                    comparison = String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
                }

                return sortDirection === 'desc' ? -comparison : comparison;
            });
        }

        return data;
    }, [allData, filterColumn, filterValue, sortColumn, sortDirection]);

    const displayedHeaders = useMemo(() => {
        if (columnLimit !== null && columnLimit >= 0) {
            return headers.slice(0, columnLimit);
        }
        return headers;
    }, [headers, columnLimit]);

    const summaryData = useMemo(() => {
        if (!showSummary) return null;
        const summary: { [key: string]: string } = {};
        headers.forEach(header => {
            const uniqueValues = [...new Set(allData.map(item => item[header]).filter(value => value != null))];
            summary[header] = uniqueValues.join(', ');
        });
        return summary;
    }, [allData, headers, showSummary]);

    // --- Helper Functions ---
    /**
     * Generates a string of CSS class names for a cell based on its content and header.
     * This replicates the logic from landing.js for dynamic styling.
     */
    const getCellClassNames = (header: string, value: any): string => {
        const classes = [];
        const stringValue = String(value);

        if (sortColumn === header || filterColumn === header) {
            classes.push('highlighted-column');
        }

        if (header === 'Severity') {
            if (stringValue === "1") classes.push('lowSeverityCell');
            else if (stringValue === "2") classes.push('mediumSeverityCell');
            else if (stringValue === "3") classes.push('highSeverityCell');
            else if (stringValue === "4") classes.push('extremeSeverityCell'); // Corrected from "3" in landing.js
        } else if (header === 'Sunrise_Sunset' || header === 'Astronomical_Twilight' || header === 'Civil_Twilight' || header === 'Nautical_Twilight') {
            if (stringValue === 'Day') classes.push('dayCell');
            if (stringValue === 'Night') classes.push('nightCell');
        } else if (value === true) {
            classes.push('trueCell');
        } else if (value === false) {
            classes.push('falseCell');
        }

        return classes.join(' ');
    };

    // --- Render Logic ---
    if (loading) return <div>Loading data...</div>;
    if (error) return <div className="error-message">{error}</div>;
    // We remove the early return for allData.length === 0 to ensure controls always render.
    // The check will be moved to where the table is rendered.
    if (allData.length === 0) {
        // Special case for when the very first load returns no data at all.
    }

    return (
        <div className="table-view-container">
            <div className="button-container">
                <div>
                    <button className="show-all-btn" onClick={() => { setFilterValue(''); setShowSummary(false); }}>Show All</button>
                </div>
                <div>
                    <label htmlFor="filter-column-names">Filter:</label>
                    <select name="column-names" className="filter-column-names" value={filterColumn} onChange={e => setFilterColumn(e.target.value)}>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <input type="text" placeholder="Value" className="value-input" value={filterValue} onChange={e => setFilterValue(e.target.value)}></input>
                </div>
                <div>
                    <label htmlFor="sort-by-column-names">Sort By:</label>
                    <select name="column-names" className="sort-by-column-names" value={sortColumn} onChange={e => setSortColumn(e.target.value)}>
                        {headers.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select className="sort-direction" name="sort-direction" value={sortDirection} onChange={e => setSortDirection(e.target.value as 'asc' | 'desc')}>
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="limit-column-input">Limit Viewable Columns:</label>
                    <input 
                        type="number" 
                        className="limit-column-input" 
                        name="limit-column-input" 
                        min="0" 
                        max={headers.length}
                        placeholder={`0-${headers.length}`}
                        onChange={e => setColumnLimit(e.target.value === '' ? null : parseInt(e.target.value, 10))}
                    />
                </div>
                <div>
                    <button className="summary-btn" onClick={() => setShowSummary(!showSummary)}>
                        {showSummary ? 'Hide Summary' : 'Show Summary'}
                    </button>
                </div>
            </div>

            {allData.length === 0 ? (
                <div className="data-view">No data available to display.</div>
            ) : (
                <div className="data-view">
                    <table className="data-table">
                        <thead>
                            <tr>
                                {displayedHeaders.map(header => (
                                    <th key={header} className={(sortColumn === header || filterColumn === header) ? 'highlighted-column' : ''}>
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {showSummary && summaryData ? (
                                <tr>
                                    {displayedHeaders.map(header => (
                                        <td key={header}>{summaryData[header]}</td>
                                    ))}
                                </tr>
                            ) : (
                                processedData.length > 0 ? (
                                    processedData.map((item, index) => (
                                        <tr key={item.ID ?? index}>
                                            {displayedHeaders.map(header => (
                                                <td key={header} className={getCellClassNames(header, item[header])}>
                                                    {String(item[header] ?? '')}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={displayedHeaders.length}>No data matches your criteria.</td>
                                    </tr>
                                )
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default TableView;