let dataView, jsonData;

document.addEventListener('DOMContentLoaded', () => {
    // Select DOM objects.
    dataView = document.querySelector('.data-view');

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
            jsonData = data;

            displayTable(jsonData);
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            dataView.textContent = 'Error loading data: ' + error.message;
        });

    // Set up button event listeners.
    const showAllButton = document.querySelector('#show-all-input button');
    showAllButton.addEventListener('click', () => {
        console.log("Button Pressed");
        displayTable(jsonData);
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

        displayTable(sortedData);
    })
});

/**
 * Takes in data and creates the table in the DOM. The data should be processed (filtered, sorted, etc.) before use.
 * The dataView dom element must also be fetched.
 * @param {Object} data - Table rows to display.
 */
function displayTable(data){
    // Check if data is null, undefined, or an empty array
    if (!data || !dataView || !Array.isArray(data) || data.length === 0) {
        dataView.textContent = 'No data to display.';
        return;
    }

    dataView.innerHTML = "";
    
    // Create and build the table
    const table = document.createElement('table');
    table.classList.add('data-table');

    // Get headers from the first object, assuming uniform structure
    const headers = Object.keys(data[0]); 
    
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

    // Table body
    const tbody = document.createElement('tbody');
    data.forEach(item => {
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