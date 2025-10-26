let dataView, jsonData;

document.addEventListener('DOMContentLoaded', () => {
    const dataView = document.querySelector('.data-view');
    const columnNamesSelect = document.getElementById('column-names');
    const valueInput = document.getElementById('value-input');

    if (!dataView || !columnNamesSelect || !valueInput) {
        console.error("Error: Missing one or more required DOM elements.");
        // Log specific missing IDs for better debugging
        if (!dataView) console.error("Missing .data-view");
        if (!columnNamesSelect) console.error("Missing #column-names");
        if (!valueInput) console.error("Missing #value-input");
        return;
    }

    let allData = [];
    let headers = []; // Declaration is fine here

    // The renderTable function relies on the globally available 'headers' array
    function renderTable(data) {
        dataView.innerHTML = ''; // Clear previous content

        if (!data || data.length === 0) {
            dataView.textContent = 'No data to display.';
            return;
        }

        const table = document.createElement('table');
        table.classList.add('data-table');

        // Table Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => { // Use the 'headers' array populated in the fetch block
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table Body
        const tbody = document.createElement('tbody');
        data.forEach(item => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const cell = document.createElement('td');
                // Use nullish coalescing for clean value handling
                cell.textContent = item[header] ?? ''; 
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        dataView.appendChild(table);
    }
    
    function filterAndRender() {
        const filterValue = valueInput.value.toLowerCase().trim();
        const selectedColumn = columnNamesSelect.value;

        if (!filterValue) {
            renderTable(allData); // Show all data if filter is empty
            return;
        }

        const filteredData = allData.filter(item => {
            // Get the value from the selected column and ensure it's a string for .toLowerCase()
            const itemValue = String(item[selectedColumn] ?? '').toLowerCase();
            return itemValue.includes(filterValue);
        });

        renderTable(filteredData);
    }


    const inputLimit = document.getElementById('limitColumns');
    let table, tbody, headers, data;
    // Check if the target element exists before attempting fetch
    if (!dataView) {
        console.error("Error: Element with class 'data-view' not found in the DOM.");
        return;
    }

    // Fetch JSON data, set to jsonData, and display the initial table.
    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data loaded:', data);
            
            allData = data;

            if (!data || !Array.isArray(data) || data.length === 0) {
                dataView.textContent = 'No data to display.';
                return;
            }

            // It's defined as a 'let' outside, so no 'const' here.
            headers = Object.keys(data[0]); 
            
            // Populate the Column Select dropdown once
            // Clear any default options first
            columnNamesSelect.innerHTML = '';
            
            headers.forEach(headerText => {
                 // Use the Option constructor for cleaner code
                 columnNamesSelect.appendChild(new Option(headerText, headerText)); 
            });

            // Initial render of the full table
            renderTable(allData);

            columnNamesSelect.addEventListener('change', filterAndRender);
            valueInput.addEventListener('input', filterAndRender);
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            dataView.textContent = `Error loading data: ${error.message}`;
            jsonData = data;

            buildTable(jsonData);
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            dataView.textContent = 'Error loading data: ' + error.message;
        });

    // Set up button event listeners.
    const showAllButton = document.querySelector('#show-all-input button');
    showAllButton.addEventListener('click', () => {
        console.log("Button Pressed");
        buildTable(jsonData);
    });

    const sortByButton = document.querySelector('#sort-by-input button');
    const sortByDropDown = document.querySelector('#sort-by-input input');
    sortByButton.addEventListener('click', () => {
        const columnName = sortByDropDown.value;
        if (!columnName) {
            console.log('No column selected for sorting');
            return;
        }

        // Create a copy of the data to sort.
        const sortedData = [...jsonData];
        
        // Sort the data by the selected column
        sortedData.sort((a, b) => {
            const aVal = a[columnName];
            const bVal = b[columnName];
            
            // Handle null/undefined values
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            
            // Convert to string for comparison if not numbers
            const aStr = String(aVal).toLowerCase();
            const bStr = String(bVal).toLowerCase();
            
            // Try numeric comparison first
            const aNum = Number(aVal);
            const bNum = Number(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            
            // String comparison
            if (aStr < bStr) return -1;
            if (aStr > bStr) return 1;
            return 0;
        });

        buildTable(sortedData);
    })

    /**
     * Takes in data and creates the table in the DOM. The data should be processed (filtered, sorted, etc.) before use.
     * The dataView dom element must also be fetched.
     * @param {Object} data - Table rows to display.
     */
    function buildTable(data, rowLimit = data.length){
        // Check if data is null, undefined, or an empty array
        if (!data || !dataView || !Array.isArray(data) || data.length === 0) {
            dataView.textContent = 'No data to display.';
            return;
        }

        dataView.innerHTML = "";
        
        // Create and build the table
        table = document.createElement('table');
        table.classList.add('data-table');

        // Get headers from the first object, assuming uniform structure
        headers = Object.keys(data[0]); 
        
        // Table headers
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // table body
        tbody = document.createElement('tbody');
        data.slice(0, rowLimit).forEach(item => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const cell = document.createElement('td');
                cell.textContent = item[header] ?? ''; 
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);

        // Append the completed table to the data-view container
        dataView.innerHTML = ''; 
        dataView.appendChild(table);
    }

     // listen for changes
    inputLimit.addEventListener('input', () => {
        if (!data) return;
        const value = parseInt(inputLimit.value, 10);
        if (!isNaN(value) && value >= 0 && value <= data.length) {
            buildTable(data, value);
        } else if (inputLimit.value === '') {
            // if cleared input rebuild
            buildTable(data);
        }
    });
});