document.addEventListener('DOMContentLoaded', () => {
    const dataView = document.querySelector('.data-view');

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

            // table body
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
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            dataView.textContent = 'Error loading data: ' + error.message;
        });
});