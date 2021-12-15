import React from 'react';
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import FormControl from "react-bootstrap/FormControl";
import { FaSearch } from "react-icons/fa";
import "./NodeSearchBox.css";

const NodeSearchBox = ({handleNodeSearch, handleSearchTypeChange}) => (
  <div id="search-box">
    <div>Search for: </div>
    <select id="search-select" onChange={handleSearchTypeChange}>
      <option value="ID">ID</option>
      <option value="NN">NN</option>
    </select>
    <Form
      id="search-container"
      onSubmit={(event) => {
        handleNodeSearch(event);
      }}
    >
      <FormControl
        type="input"
        id="infoToSearch"
      />
      <Button id="search-button" type="submit">
        <FaSearch className="clickable"id="search-icon"/>
      </Button>
    </Form>
  </div>
);

export default NodeSearchBox;
