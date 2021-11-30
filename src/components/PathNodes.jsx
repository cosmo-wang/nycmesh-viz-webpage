import React from 'react';
import { FaRoute } from "react-icons/fa";
import { AiOutlineClear } from "react-icons/ai";
import Switch from "./Switch";
import "./PathNodes.css";

export const PathNode = ({
  nodeWeight,
  index,
  simStatusOn,
  isEndPoint,
  handleNodeClick,
  handleToggleNode
}) => {
  console.log(nodeWeight);
  if (!nodeWeight || nodeWeight["node"] === null || nodeWeight["node"] === undefined) {
    return <></>;
  } else {
    return <div key={index} className="edge-and-node">
      {nodeWeight["weight"] !== 0 ? <Edge cost={nodeWeight["weight"]} /> : <></>}
      <div className="path-node">
        <div
          className="path-node-text  clickable"
          onClick={() => handleNodeClick(nodeWeight["node"])}
        >{`Node ID: ${nodeWeight["node"].id}`}</div>
        {isEndPoint ? <></> :
          <Switch
            id={nodeWeight["node"].id}
            isOn={simStatusOn}
            onColor="#428ef2"
            handleToggle={() => {
              handleToggleNode(nodeWeight["node"]);
            }}
          />}
      </div>
    </div>
  }
}

const Edge = ({ cost }) => {
  return <div className="edge">
    <div className="edge-cost">Edge Cost: {cost}</div>
  </div>;
}


const PathNodes = ({
  startNode,
  endNode,
  path,
  totalCost,
  disabledNodes,
  handleNodeClick,
  handleToggleNode,
  handlePlotPath,
  handleClearPath
}) => {
  return <div id="path-nodes">
    <PathNode
      key={0}
      nodeWeight={{ "node": startNode, "weight": startNode && path[0] ? path[0]["weight"] : 0 }}
      index={0}
      simStatusOn={!disabledNodes.has(startNode)}
      isEndPoint={true}
      handleNodeClick={handleNodeClick}
      handleToggleNode={handleToggleNode}
    />
    {path.slice(1, -1).map((item, index) => (
      <PathNode
        key={index}
        nodeWeight={item}
        index={index}
        simStatusOn={!disabledNodes.has(item["node"])}
        isEndPoint={false}
        handleNodeClick={handleNodeClick}
        handleToggleNode={handleToggleNode}
      />
    ))}
    <PathNode
      key={path.length - 1}
      nodeWeight={{ "node": endNode, "weight": endNode && path[path.length - 1] ? path[path.length - 1]["weight"] : 0 }}
      index={path.length - 1}
      simStatusOn={!disabledNodes.has(endNode)}
      isEndPoint={true}
      handleNodeClick={handleNodeClick}
      handleToggleNode={handleToggleNode}
    />
    {path.length > 0 ? <div className="total-cost">Total Cost: {totalCost}</div> : <></>}
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
