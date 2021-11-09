import React from 'react';
import Button from "react-bootstrap/Button";
import ButtonGroup from "react-bootstrap/ButtonGroup";
import "./Popup.css";

const Popup = ({ node, handleAddStart, handleAddEnd }) => (
  <div className="popup">
    <h3 className="node-type">Type: {node.type}</h3>
    <p className="node-id">ID: {node.id}</p>
    <p className="network-number">Network Number: {node.nn}</p>
    <p className="coordinates">Coordinates: {node.lng}, {node.lat}</p>
    <ButtonGroup>
      <Button onClick={() => handleAddStart(node.id)} variant="primary">
        Add Start
      </Button>
      <Button onClick={() => handleAddEnd(node.id)} variant="primary">
        Add End
      </Button>
    </ButtonGroup>
  </div>
);

export default Popup;