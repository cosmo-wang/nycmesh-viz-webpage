import React from 'react';
import Button from "react-bootstrap/Button";
import Switch from "./Switch";
import "./Popup.css";

const Popup = ({
  node,
  simStatusOn,
  handleAddStart,
  handleAddEnd,
  handleToggleNode,
  handleFindEdges,
  handleFindPathToInternet
}) => (
  <div className="node-popup">
    <h3 className="node-type">TYPE: {node.type.toUpperCase()}</h3>
    <div className="node-switch">
      <Switch
        id={node.id}
        isOn={simStatusOn}
        onColor="#428ef2"
        handleToggle={() => {
          handleToggleNode(node);
        }}
      />
    </div>
    <div className="node-info">
      <div className="node-id"><b>ID:</b> {node.id}</div>
      <div className="network-number"><b>Network Number:</b> {node.nn}</div>
      <div className="coordinates"><b>Coordinates:</b> {node.lng}, {node.lat}</div>
    </div>
    <div className="path-buttons">
      <Button className="clickable" onClick={() => handleAddStart(node.id)} variant="primary">
        Add Start
      </Button>
      <Button className="clickable" onClick={() => handleAddEnd(node.id)} variant="primary">
        Add End
      </Button>
    </div>
    <div className="edge-buttons">
      <Button className="clickable" >Get Edges</Button>
      <Button className="clickable" >Get Edges (Hard)</Button>
    </div>
    <Button className="internet-button clickable" onClick={() => handleFindPathToInternet(node)}>Find Path to Internet</Button>
  </div>
);

export default Popup;