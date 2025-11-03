import './Popup.css';

/**
 * Popups that appear when a user clicks a feature.
 * @param {string} stateName - The name of the state being clicked on.
 */
function Popup({stateName, value}: {stateName: string, value: number}){
    return (<div id = "popup-container" style={{ padding: '8px' }}>
        <h3 id="popup-title">{stateName}</h3>
        <p id="crashses-amount">Crashes: {value.toLocaleString()}</p>
      </div>
    );
}

export default Popup;