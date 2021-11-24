import { PathNode } from './PathNodes';
import "./DisabledNodes.css";

const DisabledNodes = ({disabledNodes, handleNodeClick, handleToggleNode}) => (
  <div id="disabled-nodes">
    <h3>Disabled Nodes</h3>
    {Array.from(disabledNodes).map((disabledNode, index) => (
      <PathNode
        key={index}
        node={disabledNode}
        index={index}
        simStatusOn={false}
        isEndPoint={false}
        handleNodeClick={handleNodeClick}
        handleToggleNode={handleToggleNode}
      />
    ))}
  </div>
);

export default DisabledNodes;
