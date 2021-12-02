import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import Popup from "./components/Popup";
import PathNodes from "./components/PathNodes";
import DisabledNodes from "./components/DisabledNodes";
import NodeSearchBox from "./components/NodeSearchBox";
import { distanceInKmBetweenCoordinates } from "./Utils";
import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiY29zbW93YW5nIiwiYSI6ImNqdWl0bG50ODFlZ2w0ZnBnc3VyejZmbWQifQ.5TjxQgPSj6B7VcFkvSfqBA";

const SERVER_URL = "http://localhost:3000/";

const SUPERNODES = ["713", "227"];

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
    let queryURL = `${SERVER_URL}path_finding?node1=${startNode.nn}&node2=${endNode.nn}`;
    if (disabledNodes.size > 0) {
      let disabledQueryStr = "";
      disabledNodes.forEach((disabledNode, index) => {
        disabledQueryStr += disabledNode.nn +
          (index === disabledNodes.size - 1 ? "" : ",");
      });
      queryURL += `&disabled_node=${disabledQueryStr}`;
    }
    console.log(queryURL);
    fetch(queryURL)
      .then((res) => res.json())
      .then((resJson) => {
        console.log(resJson);
        let pathToPlot;
        if (resJson.length > 0) {
          pathToPlot = resJson.map((node) => {
            return {
              "node": nnToNodes[node["node"]],
              "weight": node["weight"]
            }
          });
          console.log(pathToPlot);
        } else {
          pathToPlot = [];
          alert(
            `Failed to find a path between ${startNode.id} and ${endNode.id}.`
          );
        }
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

  const handleFindEdges = async (node) => {
    const queryURL = `${SERVER_URL}get_edges?node=${node.nn}`;
    fetch(queryURL)
      .then((res) => res.json())
      .then((resJson) => {
        console.log(resJson);
      })
      .catch((error) => {
        console.log(error);
        alert("Failed to fetch nodes information.");
      });
  }

  const handleFindPathToInternet = useCallback(async (node) => {
    setFocusedNode(null);
    popUpRef.current.remove();
    Promise.all(SUPERNODES.map(supernode =>
      fetch(`${SERVER_URL}path_finding?node1=${node.nn}&node2=${supernode}`)))
      .then(responses => Promise.all(responses.map(res => res.json())))
      .then(resJsons => {
        resJsons.sort((path1, path2) => {
          const path1Cost = path1.reduce((acc, nodeWeight) => acc + nodeWeight["weight"], 0);
          const path2Cost = path2.reduce((acc, nodeWeight) => acc + nodeWeight["weight"], 0);
          if (path1Cost === path2Cost) {
            if (path1.length === path2.length) {
              const end1Lat = nnToNodes[path1[path1.length - 1]["node"]].lat;
              const end1Lng = nnToNodes[path1[path1.length - 1]["node"]].lng;
              const distToEnd1 = distanceInKmBetweenCoordinates(node.lat, node.lng, end1Lat, end1Lng);
              const end2Lat = nnToNodes[path2[path2.length - 1]["node"]].lat;
              const end2Lng = nnToNodes[path2[path2.length - 1]["node"]].lng;
              const distToEnd2 = distanceInKmBetweenCoordinates(node.lat, node.lng, end2Lat, end2Lng);
              return distToEnd1 - distToEnd2;
            } else {
              return path1.length - path2.length;
            }
          } else {
            return path1Cost - path2Cost;
          }
        });
        return resJsons[0];
      })
      .then(pathToInternet => {
        setStartNode(node);
        setEndNode(nnToNodes[pathToInternet[pathToInternet.length - 1]["node"]]);
        setPath(pathToInternet.map((node) => {
          return {
            "node": nnToNodes[node["node"]],
            "weight": node["weight"]
          }
        }));
      })
      .catch(err => {
        console.log(err);
        alert(`Node ${node.id} is not connected to the Internet.`);
      });
  }, [nnToNodes]);

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

  const handleToggleNode = useCallback((node) => {
    const newDisabledNodes = new Set(disabledNodes);
    if (disabledNodes.has(node)) {
      newDisabledNodes.delete(node);
    } else {
      newDisabledNodes.add(node);
    }
    setDisabledNodes(newDisabledNodes);
  }, [disabledNodes]);

  const handlePlotPath = () => {
    setFocusedNode(null);
    popUpRef.current.remove();
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
    setDisabledNodes(new Set());
    setPath([]);
    setFocusedNode(null);
    popUpRef.current.remove();
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
    // console.log("rendering pop-up listeners");
  });

  // event handler for nodes on-click
  useEffect(() => {
    if (!focusedNode) return;
    const popupNode = document.createElement("div");
    ReactDOM.render(
      <Popup
        node={focusedNode}
        simStatusOn={!disabledNodes.has(focusedNode)}
        handleAddStart={handleAddStart}
        handleAddEnd={handleAddEnd}
        handleToggleNode={handleToggleNode}
        handleFindEdges={handleFindEdges}
        handleFindPathToInternet={handleFindPathToInternet}
      />,
      popupNode
    );
    popUpRef.current
      .setLngLat([focusedNode.lng, focusedNode.lat])
      .setDOMContent(popupNode)
      .setMaxWidth("300px")
      .addTo(map.current);
  }, [focusedNode, disabledNodes, handleAddStart, handleAddEnd, handleToggleNode, handleFindPathToInternet]);

  // render a path on the map
  useEffect(() => {
    if (!map.current.loaded()) return; // wait for map to initialize
    if (map.current.getLayer("path")) {
      map.current.removeLayer("path");
      map.current.removeSource("path");
    }
    // make all nodes more transparent
    map.current.setPaintProperty("active_nodes", "circle-opacity", 0.3);

    const edgeFeatureCollection = [];
    for (let i = 1; i < path.length; i++) {
      const start = path[i - 1];
      const end = path[i];
      edgeFeatureCollection.push({
        type: "Feature",
        properties: {
          weight: end["weight"],
        },
        geometry: {
          type: "LineString",
          coordinates: [start["node"].getCoordinates(), end["node"].getCoordinates()],
        },
      });
    }

    map.current.addSource("path", {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: edgeFeatureCollection
      }
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

    // add nodes layer for nodes along the path
    addNodesLayer("path_nodes", path.map((nodeWeight) => nodeWeight["node"]));

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    // Show current edge cost in popup when hovered
    map.current.on("mouseenter", "path", (e) => {
      map.current.getCanvas().style.cursor = "pointer";
      popup.setLngLat(e.lngLat).setHTML(`<p>Cost: ${e.features[0].properties.weight}</p>`).addTo(map.current);
    });
    // Change it back to a pointer when it leaves.
    map.current.on("mouseleave", "path", () => {
      map.current.getCanvas().style.cursor = "";
      popup.remove();
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
