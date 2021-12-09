import React from 'react';
import { FaRoute } from "react-icons/fa";
import { AiOutlineClear } from "react-icons/ai";
import ClickableNodeID from "./ClickableNodeID";
import "./PathNodes.css";
import "../App.css";

const Edge = ({ cost }) => {
  return <div className="edge">
    <div className="edge-cost">Edge Cost: {cost}</div>
  </div>;
}

const PathNodes = ({
  startNode,
  endNode,
  path,
  handleNodeClick,
  handlePlotPath,
  handleClearPath
}) => {
  return <div id="path-nodes">
    <ClickableNodeID
      key={0}
      node={startNode}
      index={0}
      handleNodeClick={handleNodeClick}
    />
    {path.slice(1, -1).map((item, index) => (
      <>
        <Edge cost={item["weight"]} />
        <ClickableNodeID
          key={index}
          node={item["node"]}
          index={index}
          handleNodeClick={handleNodeClick}
        />
      </>
    ))}
    {path.length > 0 ? 
      <Edge cost={path[path.length - 1]["weight"]} /> : <></>
    }
    <ClickableNodeID
      key={path.length - 1}
      node={endNode}
      index={path.length - 1}
      handleNodeClick={handleNodeClick}
    />
    {path.length > 0 ? <div className="total-cost">Total Path Cost: {path.reduce((acc, nodeWeight) => acc + nodeWeight["weight"], 0)}</div> : <></>}
    {startNode !== null && endNode !== null ? (
      <div className="custom-button-group">
        <div className="custom-button clickable" onClick={handlePlotPath}>
          <FaRoute className="custom-button-icon" />
          <div>Plot Path</div>
        </div>
        {path.length > 0 ? <div className="custom-button clickable" onClick={handleClearPath}>
          <AiOutlineClear className="custom-button-icon" />
          <div>Clear Path</div>
        </div> : <></>}
      </div>
    ) : (
      <></>
    )}
  </div>
};

export default PathNodes;
