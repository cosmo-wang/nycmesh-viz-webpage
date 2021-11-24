import React from 'react';
import { AiOutlineDelete } from "react-icons/ai";
import { FaRoute } from "react-icons/fa";
import { AiOutlineClear } from "react-icons/ai";
import Switch from "./Switch";
import "./PathNodes.css";

export const PathNode = ({
  node,
  index,
  simStatusOn,
  isEndPoint,
  handleEndPointDelete,
  handleNodeClick,
  handleToggleNode
}) => {
  if (node === null) {
    return <></>;
  } else {
    return <div className="drag-item-container">
      <div
        className="drag-item-text"
        onClick={() => handleNodeClick(node)}
      >{`Node ID: ${node.id}`}</div>
      {isEndPoint ? <></> : <>
        <Switch
          id={node.id}
          isOn={simStatusOn}
          onColor="#428ef2"
          handleToggle={() => {
            handleToggleNode(node);
          }}
        />
      </>}
      {isEndPoint ? <>
        <AiOutlineDelete
          className="drag-item-button"
          size="2em"
          onClick={() => handleEndPointDelete(node.id)}
        />
      </> : <></>}
    </div>
  }
}


const PathNodes = ({
  startNode,
  endNode,
  path,
  disabledNodes,
  handleEndPointDelete,
  handleNodeClick,
  handleToggleNode,
  handlePlotPath,
  handleClearPath
}) => (
  <div id="path-nodes">
    <PathNode 
      node={startNode}
      simStatusOn={!disabledNodes.has(startNode)}
      isEndPoint={true}
      handleEndPointDelete={handleEndPointDelete}
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
      node={endNode}
      simStatusOn={!disabledNodes.has(endNode)}
      isEndPoint={true}
      handleEndPointDelete={handleEndPointDelete}
      handleNodeClick={handleNodeClick}
      handleToggleNode={handleToggleNode}
    />
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
);

export default PathNodes;
