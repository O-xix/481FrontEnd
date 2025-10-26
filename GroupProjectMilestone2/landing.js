document.addEventListener('DOMContentLoaded', () => {
    const dataView = document.querySelector('.data-view');
    const columnNamesSelect = document.getElementById('column-names');
    const valueInput = document.getElementById('value-input');
    const summaryBtn = document.getElementById('summary-btn');
    const summaryView = document.createElement('div');

    if (!dataView || !columnNamesSelect || !valueInput || !summaryBtn || !summaryView) {
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
        });
});