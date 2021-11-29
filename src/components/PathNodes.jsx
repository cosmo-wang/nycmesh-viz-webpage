import React from 'react';
import { FaRoute } from "react-icons/fa";
import { AiOutlineClear } from "react-icons/ai";
import Switch from "./Switch";
import "./PathNodes.css";

export const PathNode = ({
  node,
  simStatusOn,
  isEndPoint,
  handleNodeClick,
  handleToggleNode
}) => {
  if (node === null) {
    return <></>;
  } else {
    return <div className="path-node">
      <div
        className="path-node-text"
        onClick={() => handleNodeClick(node)}
      >{`Node ID: ${node.id}`}</div>
      {isEndPoint ? <></> :
        <Switch
          id={node.id}
          isOn={simStatusOn}
          onColor="#428ef2"
          handleToggle={() => {
            handleToggleNode(node);
          }}
        />}
    </div>
  }
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
      node={startNode}
      simStatusOn={!disabledNodes.has(startNode)}
      isEndPoint={true}
      handleNodeClick={handleNodeClick}
      handleToggleNode={handleToggleNode}
    />
    {path.map((item, index) => (
      index === 0 || index === path.length - 1 ? <></> :
        <PathNode
          key={index}
          node={item}
          index={index}
          simStatusOn={!disabledNodes.has(item)}
          isEndPoint={false}
          handleNodeClick={handleNodeClick}
          handleToggleNode={handleToggleNode}
        />
    ))}
    <PathNode
      key={path.length - 1}
      node={endNode}
      simStatusOn={!disabledNodes.has(endNode)}
      isEndPoint={true}
      handleNodeClick={handleNodeClick}
      handleToggleNode={handleToggleNode}
    />
    {path.length > 0 ? <div>Total Cost: {totalCost}</div> : <></>}
    {startNode !== null && endNode !== null ? (
      <div className="custom-button-group">
        <div className="custom-button" onClick={handlePlotPath}>
          <FaRoute className="custom-button-icon" />
          <div>Plot Path</div>
        </div>
        <div className="custom-button" onClick={handleClearPath}>
          <AiOutlineClear className="custom-button-icon" />
          <div>Clear Path</div>
        </div>
      </div>
    ) : (
      <></>
    )}
  </div>
};

export default PathNodes;
