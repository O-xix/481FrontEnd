import './Popup.css';

function Popup({stateName, value}: {stateName: string, value: number}){
    return (<div id = "popup-container" style={{ padding: '8px' }}>
        <h3 id="popup-title">{stateName}</h3>
        <p id="crashses-amount">Crashes: {value.toLocaleString()}</p>
      </div>
    );
}

export default Popup;