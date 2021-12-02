import ClickableNodeID from './ClickableNodeID';
import "./DisabledNodes.css";

const DisabledNodes = ({disabledNodes, handleNodeClick}) => {
  return <div id="disabled-nodes">
    <h3>Disabled Nodes</h3>
    {Array.from(disabledNodes).map((disabledNode, index) => (
      <ClickableNodeID
        key={index}
        node={disabledNode}
        index={index}
        handleNodeClick={handleNodeClick}
      />
    ))}
  </div>
}

export default DisabledNodes;
