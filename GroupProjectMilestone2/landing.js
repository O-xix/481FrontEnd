document.addEventListener('DOMContentLoaded', () => {
    const dataView = document.querySelector('.data-view');
    const columnNamesSelect = document.getElementById('column-names');
    const valueInput = document.getElementById('value-input');
    const summaryBtn = document.getElementById('summary-btn');
    const inputLimit = document.getElementById('limitColumns');
    
    const summaryView = document.createElement('div'); 

    // Find and check button elements
    const showAllButton = document.querySelector('#show-all-input button');
    const sortByButton = document.querySelector('#sort-by-input button');
    const sortByDropDown = document.querySelector('#sort-by-input input');

    // General element check
    if (!dataView || !columnNamesSelect || !valueInput || !summaryBtn || !inputLimit || !showAllButton || !sortByButton || !sortByDropDown) {
        console.error("Error: Missing one or more required DOM elements.");
        return;
    }

    let allData = [];
    let headers = [];

    function renderTable(dataToDisplay, colLimit = null) {
        dataView.innerHTML = ''; // Clear previous content

        if (!dataToDisplay || dataToDisplay.length === 0) {
            dataView.textContent = 'No data to display.';
            return;
        }

        // Determine which headers to use
        let displayedHeaders = [...headers]; // Start with all headers
        if (colLimit !== null && colLimit >= 0 && colLimit <= headers.length) {
            displayedHeaders = headers.slice(0, colLimit);
        }

        const table = document.createElement('table');
        table.classList.add('data-table');

        // Table Header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        displayedHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // Table Body
        const tbody = document.createElement('tbody');
        dataToDisplay.forEach(item => {
            const row = document.createElement('tr');
            displayedHeaders.forEach(header => {
                const cell = document.createElement('td');
                cell.textContent = item[header] ?? '';
                row.appendChild(cell);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        dataView.appendChild(table);
    }
    
    // Filtering and Sorting Logic ---
    function filterAndRender() {
        const filterValue = valueInput.value.toLowerCase().trim();
        const selectedColumn = columnNamesSelect.value;
        let dataToRender = allData;

        if (filterValue) {
            dataToRender = allData.filter(item => {
                const itemValue = String(item[selectedColumn] ?? '').toLowerCase();
                return itemValue.includes(filterValue);
            });
        }
        
        // Pass the current column limit value from the input, or null
        const colLimitValue = inputLimit.value ? parseInt(inputLimit.value, 10) : null;
        renderTable(dataToRender, colLimitValue);
    }

    function handleSort() {
        const columnName = sortByDropDown.value;
        if (!columnName) return;

        // Create a copy of the currently filtered/displayed data to sort
        const currentFilterValue = valueInput.value.toLowerCase().trim();
        const currentSelectedColumn = columnNamesSelect.value;
        let dataToSort = currentFilterValue 
            ? allData.filter(item => String(item[currentSelectedColumn] ?? '').toLowerCase().includes(currentFilterValue)) 
            : allData;

        const sortedData = [...dataToSort]; 

        sortedData.sort((a, b) => {
            const aVal = a[columnName];
            const bVal = b[columnName];
            
            if (aVal == null && bVal == null) return 0;
            if (aVal == null) return 1;
            if (bVal == null) return -1;
            
            // Numeric comparison
            const aNum = Number(aVal);
            const bNum = Number(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            
            // String comparison
            return String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
        });

        // Pass the current column limit value from the input, or null
        const colLimitValue = inputLimit.value ? parseInt(inputLimit.value, 10) : null;
        renderTable(sortedData, colLimitValue);
    }
    
    function displaySummary() {
        dataView.innerHTML = '';
        summaryView.textContent = 'This is the data summary.'; 
        dataView.appendChild(summaryView);
        dataView.innerHTML = ''; // Clear the main view

        if (allData.length === 0) {
            dataView.textContent = 'No data to summarize.';
            return;
        }

        const table = document.createElement('table');
        table.classList.add('summary-table');

        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const summaryRow = document.createElement('tr');
        headers.forEach(header => {
            const uniqueValues = [...new Set(allData.map(item => item[header]).filter(value => value != null))];
            const cell = document.createElement('td');
            // Join the unique values into a single string for display
            cell.textContent = uniqueValues.join(', ');
            summaryRow.appendChild(cell);
        });
        tbody.appendChild(summaryRow);
        table.appendChild(tbody);

        dataView.appendChild(table);
    }


    fetch('data.json')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok: ' + response.statusText);
            }
            return response.json();
        })
        .then(data => {
            console.log('Data loaded successfully.');
            
            // Initialize global state
            allData = data;
            
            if (!data || !Array.isArray(data) || data.length === 0) {
                dataView.textContent = 'No data to display.';
                return;
            }

            headers = Object.keys(data[0]); 
            
            // Populate Column Select dropdowns
            columnNamesSelect.innerHTML = '';
            sortByDropDown.innerHTML = '';

            headers.forEach(headerText => {
                 // Populate filter dropdown
                 columnNamesSelect.appendChild(new Option(headerText, headerText)); 
                 // Populate sort dropdown
                 sortByDropDown.appendChild(new Option(headerText, headerText)); 
            });

            // Initial render of the full table
            renderTable(allData);

            valueInput.addEventListener('input', filterAndRender);
            columnNamesSelect.addEventListener('change', filterAndRender);
            summaryBtn.addEventListener('click', displaySummary);
            showAllButton.addEventListener('click', () => renderTable(allData));
            sortByButton.addEventListener('click', handleSort);
            
            // Column limit listener
            inputLimit.addEventListener('input', () => {
                const totalColumns = headers.length;
                const value = parseInt(inputLimit.value, 10);
                
                // Get the current filtered data state
                const currentFilterValue = valueInput.value.toLowerCase().trim();
                const currentSelectedColumn = columnNamesSelect.value;
                let dataToRender = currentFilterValue 
                    ? allData.filter(item => String(item[currentSelectedColumn] ?? '').toLowerCase().includes(currentFilterValue)) 
                    : allData;

                if (!isNaN(value) && value >= 0 && value <= totalColumns) {
                    renderTable(dataToRender, value);
                } else if (inputLimit.value === '') {
                    // if cleared, revert to all columns
                    renderTable(dataToRender);
                }
            });
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            dataView.textContent = `Error loading data: ${error.message}`;
        });
});