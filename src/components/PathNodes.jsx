import React from 'react';
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import { AiOutlineDelete } from "react-icons/ai";
import Switch from "./Switch";
import "./PathNodes.css";

const getItemStyle = (isDragging, draggableStyle) => ({
  // change background colour if dragging
  background: isDragging ? "grey" : "transparent",

  // styles we need to apply on draggables
  ...draggableStyle,
});

const DraggablePathNode = ({
  node,
  index,
  handlePathNodeDelete,
  handleNodeClick,
  handleToggleNode
}) => (
  <div className="drag-item-container">
    <Draggable key={node.id} draggableId={node.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          style={getItemStyle(
            snapshot.isDragging,
            provided.draggableProps.style
          )}
          className="drag-item"
        >
          <div
            className="drag-item-text"
            onClick={() => handleNodeClick(node)}
          >{`Node ID: ${node.id}`}</div>
          <Switch
            id={node.id}
            isOn={node.simStatusOn}
            onColor="#428ef2"
            handleToggle={() => {
              handleToggleNode(node);
            }}
          />
          <AiOutlineDelete
            className="drag-item-button"
            size="2em"
            onClick={() => handlePathNodeDelete(index)}
          />
        </div>
      )}
    </Draggable>
  </div>
);

const PathNodes = ({
  pathNodes,
  onDragEnd,
  handlePathNodeDelete,
  handleNodeClick,
  handleToggleNode
}) => (
  <div>
    <DragDropContext onDragEnd={onDragEnd}>
      <Droppable droppableId="droppable">
        {(provided, snapshot) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="drag-list"
          >
            {pathNodes.map((item, index) => (
              <DraggablePathNode
                key={index}
                node={item}
                index={index}
                handlePathNodeDelete={handlePathNodeDelete}
                handleNodeClick={handleNodeClick}
                handleToggleNode={handleToggleNode}
              />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  </div>
);

export default PathNodes;
