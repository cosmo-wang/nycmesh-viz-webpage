import React from 'react';
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";
import "./NodeSearchBox.css";

const NodeSearchBox = ({handleNodeSearch}) => (
  <div>
    <Form
      id="search-container"
      onSubmit={(event) => {
        handleNodeSearch(event);
      }}
    >
      <FormControl
        type="input"
        placeholder="Search Node ID"
        id="idToSearch"
      />
      <Button id="search-button" type="submit">
        Search
      </Button>
    </Form>
  </div>
);

export default NodeSearchBox;
