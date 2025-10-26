document.addEventListener('DOMContentLoaded', () => {
    const dataView = document.querySelector('.data-view');
    const inputLimit = document.getElementById('limitColumns');
    let table, tbody, headers, data;
    // Check if the target element exists before attempting fetch
    if (!dataView) {
        console.error("Error: Element with class 'data-view' not found in the DOM.");
        return;
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

            // Check if data is null, undefined, or an empty array
            if (!data || !Array.isArray(data) || data.length === 0) {
                dataView.textContent = 'No data to display.';
                return;
            }

            buildTable(data)
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            dataView.textContent = 'Error loading data: ' + error.message;
        });

    function buildTable(dataArray, rowLimit = dataArray.length) {
        // Create and build the table
            table = document.createElement('table');
            table.classList.add('data-table');

            // Get headers from the first object, assuming uniform structure
            headers = Object.keys(dataArray[0]); 
            
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
            dataArray.slice(0, rowLimit).forEach(item => {
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