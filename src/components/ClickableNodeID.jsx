import React from 'react';
import "./ClickableNodeID.css";

const ClickableNodeID = ({
  node,
  index,
  handleNodeClick,
}) => {
  if (!node) {
    return <></>;
  } else {
    return <div key={index}>
      <div
        className="clickable-node-id  clickable"
        onClick={() => handleNodeClick(node)}
      >{`Node ID: ${node.id}`}</div>
    </div>
  }
}

export default ClickableNodeID;