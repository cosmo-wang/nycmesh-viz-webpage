import ClickableNodeID from './ClickableNodeID';
import { AiOutlineClear } from "react-icons/ai";
import "./EdgesOfNode.css";

const EdgesOfNode = ({node, endPoints, handleNodeClick, handleClearEdges}) => {
  return <div id="edges-of-node">
    <h3>Nodes Connected to <span className="node-to-show-edges-id clickable" onClick={() => handleNodeClick(node)}>{node.id}</span>:</h3>
    {endPoints.map((endPoint, index) => (
      <ClickableNodeID
        key={index}
        node={endPoint}
        index={index}
        handleNodeClick={handleNodeClick}
      />
    ))}
    <div className="custom-button clickable" onClick={handleClearEdges}>
      <AiOutlineClear className="custom-button-icon" />
      <div>Clear</div>
    </div>
  </div>
}

export default EdgesOfNode;