document.addEventListener('DOMContentLoaded', () => {
    const dataView = document.querySelector('.data-view');
    const columnNamesSelect = document.getElementById('column-names');
    const valueInput = document.getElementById('value-input');
    const summaryBtn = document.getElementById('summary-btn');
    const inputLimit = document.getElementById('limitColumns');

    const summaryView = document.createElement('div');

    const showAllButton = document.querySelector('#show-all-input button');
    const sortByButton = document.querySelector('#sort-by-input button');
    const sortByDropDown = document.querySelector('#sort-by-input input');

    if (!dataView || !columnNamesSelect || !valueInput || !summaryBtn || !inputLimit || !showAllButton || !sortByButton || !sortByDropDown) {
        console.error("Error: Missing one or more required DOM elements.");
        return;
    }

    let allData = [];
    let headers = [];
    let highlightedColumn = null; // Track which column is highlighted

    function renderTable(dataToDisplay, colLimit = null, highlightColumn = null) {
        dataView.innerHTML = '';

        if (!dataToDisplay || dataToDisplay.length === 0) {
            dataView.textContent = 'No data to display.';
            return;
        }

        let displayedHeaders = [...headers];
        if (colLimit !== null && colLimit >= 0 && colLimit <= headers.length) {
            displayedHeaders = headers.slice(0, colLimit);
        }

        const table = document.createElement('table');
        table.classList.add('data-table');

        // --- HEADER ---
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        displayedHeaders.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            if (highlightColumn === headerText) th.classList.add('highlighted-column');
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        // --- BODY ---
        const tbody = document.createElement('tbody');
        dataToDisplay.forEach(item => {
            const row = document.createElement('tr');
            displayedHeaders.forEach(header => {
                const cell = document.createElement('td');
                cell.textContent = item[header] ?? '';
                if (highlightColumn === header) cell.classList.add('highlighted-column');
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
        let dataToRender = allData;

        if (filterValue) {
            dataToRender = allData.filter(item => {
                const itemValue = String(item[selectedColumn] ?? '').toLowerCase();
                return itemValue.includes(filterValue);
            });
        }

        const colLimitValue = inputLimit.value ? parseInt(inputLimit.value, 10) : null;
        highlightedColumn = selectedColumn;
        renderTable(dataToRender, colLimitValue, highlightedColumn);
    }

    function handleSort() {
        const columnName = sortByDropDown.value;
        if (!columnName) return;

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
            const aNum = Number(aVal);
            const bNum = Number(bVal);
            if (!isNaN(aNum) && !isNaN(bNum)) {
                return aNum - bNum;
            }
            return String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
        });

        const colLimitValue = inputLimit.value ? parseInt(inputLimit.value, 10) : null;
        highlightedColumn = columnName;
        renderTable(sortedData, colLimitValue, highlightedColumn);
    }

    function displaySummary() {
        dataView.innerHTML = '';
        summaryView.textContent = 'This is the data summary.';
        dataView.appendChild(summaryView);
        dataView.innerHTML = '';

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
            cell.textContent = uniqueValues.join(', ');
            summaryRow.appendChild(cell);
        });
        tbody.appendChild(summaryRow);
        table.appendChild(tbody);

        dataView.appendChild(table);
    }

    // Fetch data
    fetch('data.json')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok: ' + response.statusText);
            return response.json();
        })
        .then(data => {
            console.log('Data loaded successfully.');
            allData = data;
            if (!data || !Array.isArray(data) || data.length === 0) {
                dataView.textContent = 'No data to display.';
                return;
            }

            headers = Object.keys(data[0]);
            columnNamesSelect.innerHTML = '';
            sortByDropDown.innerHTML = '';

            headers.forEach(headerText => {
                columnNamesSelect.appendChild(new Option(headerText, headerText));
                sortByDropDown.appendChild(new Option(headerText, headerText));
            });

            renderTable(allData);

            valueInput.addEventListener('input', filterAndRender);
            columnNamesSelect.addEventListener('change', filterAndRender);
            summaryBtn.addEventListener('click', displaySummary);
            showAllButton.addEventListener('click', () => {
                highlightedColumn = null;
                renderTable(allData);
            });
            sortByButton.addEventListener('click', handleSort);

            inputLimit.addEventListener('input', () => {
                const totalColumns = headers.length;
                const value = parseInt(inputLimit.value, 10);
                const currentFilterValue = valueInput.value.toLowerCase().trim();
                const currentSelectedColumn = columnNamesSelect.value;
                let dataToRender = currentFilterValue
                    ? allData.filter(item => String(item[currentSelectedColumn] ?? '').toLowerCase().includes(currentFilterValue))
                    : allData;

                if (!isNaN(value) && value >= 0 && value <= totalColumns) {
                    renderTable(dataToRender, value, highlightedColumn);
                } else if (inputLimit.value === '') {
                    renderTable(dataToRender, null, highlightedColumn);
                }
            });
        })
        .catch(error => {
            console.error('Error loading or processing data:', error);
            dataView.textContent = `Error loading data: ${error.message}`;
        });
});
