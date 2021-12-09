import Switch from "./Switch";
import "./NodesFilter.css";

const NodesFilter = ({ activeCount, inactiveCount, showActiveNodes, showInactiveNodes, handleToggleNodesLayer }) => {
  return <div id="nodes-filter" className="floating-window">
    <div>
      <h3 className="total-count">Total Nodes: {activeCount + inactiveCount}</h3>
    </div>
    <h3 className="active-count">Active Nodes: {activeCount}</h3>
    <div className="active-switch">
      <Switch
        id="active_nodes"
        isOn={showActiveNodes}
        onColor="#428ef2"
        handleToggle={() => {
          handleToggleNodesLayer(true);
        }}
      />
    </div>
    <h3 className="inactive-count">Inactive Nodes: {inactiveCount}</h3>
    <div className="inactive-switch">
      <Switch
        id="inactive_nodes"
        isOn={showInactiveNodes}
        onColor="#428ef2"
        handleToggle={() => {
          handleToggleNodesLayer(false);
        }}
      />
    </div>
  </div>
}

export default NodesFilter;