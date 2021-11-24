import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import Popup from "./components/Popup";
import PathNodes from "./components/PathNodes";
import DisabledNodes from "./components/DisabledNodes";
import NodeSearchBox from "./components/NodeSearchBox";
import { ip_to_nn, nn_to_ip } from "./Utils";
import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiY29zbW93YW5nIiwiYSI6ImNqdWl0bG50ODFlZ2w0ZnBnc3VyejZmbWQifQ.5TjxQgPSj6B7VcFkvSfqBA";

const SERVER_URL = "http://localhost:3000/";

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popUpRef = useRef(new mapboxgl.Popup({ offset: 15 }));

  const [lng, setLng] = useState(-73.9332);
  const [lat, setLat] = useState(40.7051);
  const [zoom, setZoom] = useState(10.75);
  // nodes info
  const [nodes, setNodes] = useState([]);
  const [idToNodes, setIdToNodes] = useState(null);
  const [nnToNodes, setNnToNodes] = useState(null);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [disabledNodes, setDisabledNodes] = useState(new Set());
  const [path, setPath] = useState([]);
  const [focusedNode, setFocusedNode] = useState(null);

  const addNodesLayer = (id, nodesData) => {
    if (map.current.getLayer(id)) {
      map.current.removeLayer(id);
      map.current.removeSource(id);
    }
    map.current.addSource(id, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: nodesData
          .filter((node) => node.statusOn)
          .map((node) => node.toGeoJson()),
      },
    });
    map.current.addLayer({
      id: id,
      source: id,
      type: "circle",
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "node_type"], "supernode"],
          12,
          ["==", ["get", "node_type"], "hub"],
          9,
          ["==", ["get", "node_type"], "node"],
          7,
          7,
        ],
        "circle-color": [
          "case",
          ["==", ["get", "node_type"], "supernode"],
          "#006eff",
          ["==", ["get", "node_type"], "hub"],
          "#50c1f9",
          ["==", ["get", "node_type"], "node"],
          "#ff274b",
          "#ff274b",
        ],
      },
    });
  };

  const fetchNodes = async () => {
    const queryURL = `${SERVER_URL}fetch_nodes`;
    fetch(queryURL)
      .then((res) => res.json())
      .then((resJson) => {
        const supernodes = [];
        const hubs = [];
        const normalNodes = [];
        resJson.forEach((rawNode) => {
          const nodeObj = {
            id: rawNode.id,
            nn: rawNode.nn,
            lat: rawNode.lat,
            lng: rawNode.lng,
            alt: rawNode.alt,
            type: rawNode.type,
            statusOn: rawNode.active,
            toGeoJson() {
              return {
                type: "Feature",
                properties: {
                  id: this.id,
                  nn: this.nn,
                  node_type: this.type,
                },
                geometry: {
                  type: "Point",
                  coordinates: [this.lng, this.lat, this.alt],
                },
              };
            },
            getCoordinates() {
              return [this.lng, this.lat];
            },
          };
          if (rawNode.type === "supernode") {
            supernodes.push(nodeObj);
          } else if (rawNode.type === "hub") {
            hubs.push(nodeObj);
          } else {
            normalNodes.push(nodeObj);
          }
        });
        setNodes(normalNodes.concat(hubs).concat(supernodes));
      })
      .catch((error) => {
        setNodes([]);
        console.log(error);
        alert("Failed to fetch nodes information.");
      });
  };

  const queryPath = async () => {
    let queryURL = `${SERVER_URL}path_finding?node1=${nn_to_ip(
      startNode.nn
    )}&node2=${nn_to_ip(endNode.nn)}`;
    if (disabledNodes.size > 0) {
      let disabledQueryStr = "";
      disabledNodes.forEach((disabledNode, index) => {
        disabledQueryStr +=
          nn_to_ip(disabledNode.nn) +
          (index === disabledNodes.size - 1 ? "" : ",");
      });
      queryURL += `&disabled_node=${disabledQueryStr}`;
    }
    console.log(queryURL);
    fetch(queryURL)
      .then((res) => res.json())
      .then((resJson) => {
        console.log(resJson);
        const pathToPlot = resJson.map((ip) => nnToNodes[ip_to_nn(ip)]);
        setPath(pathToPlot);
      })
      .catch((error) => {
        console.log(error);
        alert(
          `Failed to find a path between ${startNode.id} and ${endNode.id}.`
        );
        return [];
      });
  };

  const handleAddStart = useCallback(
    (id) => {
      setStartNode(idToNodes[id]);
    },
    [idToNodes]
  );

  const handleAddEnd = useCallback(
    (id) => {
      setEndNode(idToNodes[id]);
    },
    [idToNodes]
  );

  const showPopup = useCallback(
    (node) => {
      const popupNode = document.createElement("div");
      ReactDOM.render(
        <Popup
          node={node}
          handleAddStart={handleAddStart}
          handleAddEnd={handleAddEnd}
        />,
        popupNode
      );
      popUpRef.current
        .setLngLat([node.lng, node.lat])
        .setDOMContent(popupNode)
        .setMaxWidth("300px")
        .addTo(map.current);
    },
    [handleAddStart, handleAddEnd]
  );

  const handleNodeClick = (node) => {
    setFocusedNode(node);
    map.current.flyTo({ center: [node.lng, node.lat], zoom: 13, speed: 2 });
  };

  const handleNodeSearch = (e) => {
    e.preventDefault();
    const idToSearch = e.target.elements.idToSearch.value;
    const nodeToSearch = idToNodes[idToSearch];
    if (nodeToSearch) {
      handleNodeClick(nodeToSearch);
    } else {
      alert(`No node with ID ${idToSearch} found.`);
    }
  };

  const handleEndPointDelete = (id) => {
    if (id === startNode.id) {
      setStartNode(null);
    } else if (id === endNode.id) {
      setEndNode(null);
    }
    setFocusedNode(null);
    popUpRef.current.remove();
  };

  const handleToggleNode = (node) => {
    const newDisabledNodes = new Set(disabledNodes);
    if (disabledNodes.has(node)) {
      newDisabledNodes.delete(node);
    } else {
      newDisabledNodes.add(node);
    }
    setDisabledNodes(newDisabledNodes);
  };

  const handlePlotPath = () => {
    popUpRef.current.remove();
    setFocusedNode(null);
    queryPath(startNode, endNode);
  };

  const handleClearPath = () => {
    if (map.current.getLayer("path_nodes")) {
      map.current.removeLayer("path_nodes");
      map.current.removeSource("path_nodes");
    }
    if (map.current.getLayer("path")) {
      map.current.removeLayer("path");
      map.current.removeSource("path");
    }
    map.current.setPaintProperty("active_nodes", "circle-opacity", 1);
    setStartNode(null);
    setEndNode(null);
    setDisabledNodes(new Set());
    setPath([]);
  };

  // initialize the map
  useEffect(() => {
    if (map.current) return; // initialize map only once
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v11",
      center: [lng, lat],
      zoom: zoom,
    });
    map.current.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true,
        },
        trackUserLocation: true,
        showUserHeading: true,
      })
    );
    map.current.addControl(
      new mapboxgl.ScaleControl({
        maxWidth: 80,
        unit: "imperial",
      })
    );
    map.current.addControl(new mapboxgl.NavigationControl());
    fetchNodes(); // fetch nodes info only once
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
    console.log("Rending map");
  });

  // after fetching nodes, set up the mapping from id to references to node objects
  useEffect(() => {
    const newIdToNodes = new Map();
    nodes.forEach((node) => {
      newIdToNodes[node.id] = node;
    });
    setIdToNodes(newIdToNodes);
    const newNnToNodes = new Map();
    nodes.forEach((node) => {
      newNnToNodes[node.nn] = node;
    });
    setNnToNodes(newNnToNodes);
    console.log("setting up mappings");
  }, [nodes]);

  // render nodes on the map
  useEffect(() => {
    if (map.current.loaded()) {
      addNodesLayer("active_nodes", nodes);
    }
    console.log("rendering nodes");
  }, [nodes]);

  // add click pop-up to all active nodes
  useEffect(() => {
    if (!map.current.getLayer("active_nodes")) return;
    map.current.on("click", "active_nodes", (e) => {
      setFocusedNode(idToNodes[e.features[0].properties.id]);
    });
    // Change the cursor to a pointer when the mouse is over the places layer.
    map.current.on("mouseenter", "active_nodes", () => {
      map.current.getCanvas().style.cursor = "pointer";
    });
    // Change it back to a pointer when it leaves.
    map.current.on("mouseleave", "active_nodes", () => {
      map.current.getCanvas().style.cursor = "";
    });
    console.log("rendering pop-up listeners");
  });

  // event handler for nodes on-click
  useEffect(() => {
    if (!focusedNode) return;
    showPopup(focusedNode);
  }, [focusedNode, showPopup]);

  // render a path on the map
  useEffect(() => {
    if (!map.current.loaded()) return; // wait for map to initialize
    if (map.current.getLayer("path")) {
      map.current.removeLayer("path");
      map.current.removeSource("path");
    }
    // make all nodes more transparent
    map.current.setPaintProperty("active_nodes", "circle-opacity", 0.3);
    // add nodes layer for nodes along the path
    addNodesLayer("path_nodes", path);

    map.current.addSource("path", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: path.map((node) => node.getCoordinates()),
        },
      },
    });
    map.current.addLayer({
      id: "path",
      type: "line",
      source: "path",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#006eff",
        "line-width": 5,
      },
    });
    console.log("rendering path")
  }, [path]);

  return (
    <div>
      <div id="floating-window">
        <NodeSearchBox handleNodeSearch={handleNodeSearch} />
        <PathNodes
          startNode={startNode}
          endNode={endNode}
          path={path}
          disabledNodes={disabledNodes}
          handleEndPointDelete={handleEndPointDelete}
          handleNodeClick={handleNodeClick}
          handleToggleNode={handleToggleNode}
          handlePlotPath={handlePlotPath}
          handleClearPath={handleClearPath}
        />
        {disabledNodes.size > 0 ? (
          <>
            <div className="divider"></div>
            <DisabledNodes
              disabledNodes={disabledNodes}
              handleNodeClick={handleNodeClick}
              handleToggleNode={handleToggleNode}
            />
          </>
        ) : (
          <></>
        )}
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
