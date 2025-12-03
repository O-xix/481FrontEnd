import './Popup.css';

let PopulationMap = new Map<string, number>();
PopulationMap.set('California', 39431263);

PopulationMap.set('Texas', 31290831);
PopulationMap.set('Florida', 23372215);
PopulationMap.set('New York', 19867248);
PopulationMap.set('Pennsylvania', 13078751);
PopulationMap.set('Illinois', 12710158);
PopulationMap.set('Ohio', 11883304);
PopulationMap.set('Georgia', 11180878);
PopulationMap.set('North Carolina', 11046024);
PopulationMap.set('Michigan', 10140459);
PopulationMap.set('New Jersey', 9500851);
PopulationMap.set('Virginia', 8868896);
PopulationMap.set('Washington', 7958180);
PopulationMap.set('Arizona', 7582384);
PopulationMap.set('Tennessee', 7227750);
PopulationMap.set('Massachusetts', 7136171);
PopulationMap.set('Indiana', 6924275);
PopulationMap.set('Maryland', 6263220);
PopulationMap.set('Missouri', 6245466);
PopulationMap.set('Wisconsin', 5960975);
PopulationMap.set('Colorado', 5957493);
PopulationMap.set('Minnesota', 5793151);
PopulationMap.set('South Carolina', 5478831);
PopulationMap.set('Alabama', 5157699);
PopulationMap.set('Louisiana', 4597740);
PopulationMap.set('Kentucky', 4588372);
PopulationMap.set('Oregon', 4272371);
PopulationMap.set('Oklahoma', 4095393);
PopulationMap.set('Connecticut', 3675069);
PopulationMap.set('Utah', 3503613);
PopulationMap.set('Nevada', 3267467);
PopulationMap.set('Iowa', 3241488);
PopulationMap.set('Arkansas', 3088354);
PopulationMap.set('Kansas', 2970606);
PopulationMap.set('Mississippi', 2943045);
PopulationMap.set('New Mexico', 2130256);
PopulationMap.set('Nebraska', 2005465);
PopulationMap.set('Idaho', 2001619);
PopulationMap.set('West Virginia', 1712278);
PopulationMap.set('Hawaii', 1446146);
PopulationMap.set('New Hampshire', 1409032);
PopulationMap.set('Maine', 1405012);
PopulationMap.set('Montana', 1137233);
PopulationMap.set('Rhode Island', 1112308);
PopulationMap.set('Delaware', 1051917);
PopulationMap.set('South Dakota', 924669);
PopulationMap.set('North Dakota', 796568);
PopulationMap.set('Alaska', 740133);
PopulationMap.set('Vermont', 648493);
PopulationMap.set('Wyoming', 587618);


/**
 * Popups that appear when a user clicks a feature.
 * @param {string} stateName - The name of the state being clicked on.
 */
function Popup({stateName, value}: {stateName: string, value: number}){
  let Pop = PopulationMap.get(stateName);
  let popDensity = 0;
  if (Pop) {
    //Crashes / population
    popDensity = (value / Pop);
  }
  
    return (<div id = "popup-container" style={{ padding: '8px' }}>
        <h3 id="popup-title">{stateName}</h3>
        <p id="crashses-amount">Crashes: {value.toLocaleString()}</p>
        <p id="pop-density">Crashes Per Person: {popDensity.toFixed(4)}</p>
      </div>
    );
}

export default Popup;