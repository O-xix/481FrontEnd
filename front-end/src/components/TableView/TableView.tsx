import './TableView.css';

function TableView() {
    return (
        <div className="table-view-container">
            <div className="button-container">
                <div>
                    <button className="show-all-btn">Show All</button>
                </div>
                <div>
                    <label htmlFor="filter-column-names">Filter:</label>
                    <select name="column-names" className="filter-column-names"></select>
                    <input type="text" placeholder="Value" className="value-input"></input>
                </div>
                <div>
                    <label htmlFor="sort-by-column-names">Sort By:</label>
                    <select name="column-names" className="sort-by-column-names"></select>
                    <select className="sort-direction" name="sort-direction">
                        <option value="asc">Ascending</option>
                        <option value="desc">Descending</option>
                    </select>
                </div>
                <div>
                    <label htmlFor="limit-column-input">Limit Viewable Columns:</label>
                    <input type="number" className="limit-column-input" name="limit-column-input" min="0"></input> <br></br>
                </div>
                <div>
                    <button className="summary-btn">Show Summary</button>
                </div>
            </div>

            <div className="data-view"></div>
        </div>
    );
}

export default TableView;