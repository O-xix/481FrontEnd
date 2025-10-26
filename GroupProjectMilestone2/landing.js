// --- Establish Global Variables --- //
let elements = {};
let allData = [];
let headers = [];
let highlightedColumn = null;

document.addEventListener('DOMContentLoaded', initializeApp);

// --- Initialize App with DOM elements and JSON data --- //
/**
 * Initialize App with references to the DOM elements.
 */
function initializeApp() {
    elements = getDOMElements();

    // --- Fetch Data --- //
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

        // Source the column names for the filter and sort by dropdown menus.
        headers = Object.keys(data[0]);
        elements.filterColumnNamesSelect.innerHTML = '';
        elements.sortByColumnNamesSelect.innerHTML = '';

        headers.forEach(headerText => {
            elements.filterColumnNamesSelect.appendChild(new Option(headerText, headerText));
            elements.sortByColumnNamesSelect.appendChild(new Option(headerText, headerText));
        });

        // Initially render to all data views to show the complete dataset
        renderTable(allData, elements.showAllDataView);
        renderTable(allData, elements.filterDataView);
        renderTable(allData, elements.sortDataView);
        renderTable(allData, elements.limitDataView);
        displaySummary();
    })
    .catch(error => {
        console.error('Error loading or processing data:', error);
        elements.dataView.textContent = `Error loading data: ${error.message}`;
    });

    // Set event listeners
    elements.showAllButton.addEventListener('click', () => {
        highlightedColumn = null;
        renderTable(allData, elements.showAllDataView);
    });

    elements.filterValueInput.addEventListener('input', filterAndRender);
    elements.filterColumnNamesSelect.addEventListener('change', filterAndRender);

    elements.sortByColumnNamesSelect.addEventListener('change', sortAndRender);
    elements.sortDirectionSelect.addEventListener('change', sortAndRender);

    elements.inputLimit.addEventListener('input', renderLimitedTable);

    elements.summaryBtn.addEventListener('click', displaySummary);
}

/**
 * Retrieves all required elements from the DOM.
 * @returns {Object} 
 */
function getDOMElements() {
    const elements = {
        dataView: document.querySelector('.data-view'),
        showAllDataView: document.getElementById('show-all-data-view'),
        filterDataView: document.getElementById('filter-data-view'),
        sortDataView: document.getElementById('sort-data-view'),
        limitDataView: document.getElementById('limit-data-view'),
        summaryDataView: document.getElementById('summary-data-view'),
        filterColumnNamesSelect: document.getElementById('filter-column-names'),
        sortByColumnNamesSelect: document.getElementById('sort-by-column-names'),
        sortDirectionSelect: document.getElementById('sort-direction'),
        filterValueInput: document.getElementById('value-input'),
        summaryBtn: document.getElementById('summary-btn'),
        inputLimit: document.getElementById('limit-column-input'),
        showAllButton: document.getElementById('show-all-btn'),
        summaryView: document.createElement('div')
    };

    for (const [elementName, element] of Object.entries(elements)) {
        if (element == null) {
            console.log(`Error: ${elementName} cannot be found in the DOM.`);
        }
    }

    return elements;
}

// --- Input Callback Functions --- //
/**
 * Creates a table display with the provided data.
 * @param {Object} dataToDisplay - The data to render to the table.
 * @param {Number} [colLimit] - Optional. Number of columns to render. If not provided all columns will be rendered.
 * @param {String} [highlightColumn] - Optional. The name of a column to highlight. If not provided no columns will be highlighted.
 */
function renderTable(dataToDisplay, targetElement = dataView, colLimit = null, highlightColumn = null) {
    targetElement.innerHTML = '';

    if (!dataToDisplay || dataToDisplay.length === 0) {
        targetElement.textContent = 'No data to display.';
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
            if(cell.textContent == "true") cell.classList.add('trueCell');
            if(cell.textContent == "false") cell.classList.add('falseCell');
            if(cell.textContent == "Day") cell.classList.add('dayCell');
            if(cell.textContent == "Night") cell.classList.add('nightCell');
            if (highlightColumn === header) cell.classList.add('highlighted-column');

            if (header === 'Severity') {
                if (cell.textContent == "1") cell.classList.add('lowSeverityCell');
                if (cell.textContent == "2") cell.classList.add('mediumSeverityCell');
                if (cell.textContent == "3") cell.classList.add('highSeverityCell');
                if (cell.textContent == "3") cell.classList.add('extremeSeverityCell');
            }
            row.appendChild(cell);
        });
        tbody.appendChild(row);
    });
    table.appendChild(tbody);

    targetElement.appendChild(table);
}

/**
 * Fetches the column and value to filter in the table, filters the data, and renders the table.
 */
function filterAndRender() {
    const filterValue = elements.filterValueInput.value.toLowerCase().trim();
    const selectedColumn = elements.filterColumnNamesSelect.value;
    let dataToRender = allData;

    if (filterValue) {
        dataToRender = allData.filter(item => {
            const itemValue = String(item[selectedColumn] ?? '').toLowerCase();
            return itemValue.includes(filterValue);
        });
    }

    const colLimitValue = elements.inputLimit.value ? parseInt(elements.inputLimit.value, 10) : null;
    highlightedColumn = selectedColumn;
    renderTable(dataToRender, elements.filterDataView, colLimitValue, highlightedColumn);
}

/**
 * Fetches the column to sort by and the order (ascending/descending) to render the table in. 
 */
function sortAndRender() {
    const columnName = elements.sortByColumnNamesSelect.value;
    const sortDirection = elements.sortDirectionSelect.value;
    if (!columnName) return;

    const currentFilterValue = elements.filterValueInput.value.toLowerCase().trim();
    const currentSelectedColumn = elements.filterColumnNamesSelect.value;
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
        
        let comparison = 0;
        const aNum = Number(aVal);
        const bNum = Number(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            comparison = aNum - bNum;
        } else {
            comparison = String(aVal).toLowerCase().localeCompare(String(bVal).toLowerCase());
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
    });

    const colLimitValue = elements.inputLimit.value ? parseInt(elements.inputLimit.value, 10) : null;
    highlightedColumn = columnName;
    renderTable(sortedData, elements.sortDataView, colLimitValue, highlightedColumn);
}

/**
 * Fetches the number of columns to limit the table to and renders the table with limited columns.
 */
function renderLimitedTable() {
    const totalColumns = headers.length;
    const value = parseInt(elements.inputLimit.value, 10);
    const currentFilterValue = elements.filterValueInput.value.toLowerCase().trim();
    const currentSelectedColumn = elements.filterColumnNamesSelect.value;
    let dataToRender = currentFilterValue
        ? allData.filter(item => String(item[currentSelectedColumn] ?? '').toLowerCase().includes(currentFilterValue))
        : allData;

    if (!isNaN(value) && value >= 0 && value <= totalColumns) {
        renderTable(dataToRender, elements.limitDataView, value, highlightedColumn);
    } else if (elements.inputLimit.value === '') {
        renderTable(dataToRender, elements.limitDataView, null, highlightedColumn);
    }
}


/**
 * Renders the table with all unique values present in each column.
 */
function displaySummary() {
    elements.summaryDataView.innerHTML = '';

    if (allData.length === 0) {
        elements.summaryDataView.textContent = 'No data to summarize.';
        return;
    }

    const table = document.createElement('table');
    table.classList.add('data-table');

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

    elements.summaryDataView.appendChild(table);
}

