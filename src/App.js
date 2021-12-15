import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import Popup from "./components/Popup";
import PathNodes from "./components/PathNodes";
import DisabledNodes from "./components/DisabledNodes";
import NodeSearchBox from "./components/NodeSearchBox";
import EdgesOfNode from "./components/EdgesOfNode";
import NodesFilter from "./components/NodesFilter";
import { distanceInKmBetweenCoordinates } from "./Utils";
import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiY29zbW93YW5nIiwiYSI6ImNqdWl0bG50ODFlZ2w0ZnBnc3VyejZmbWQifQ.5TjxQgPSj6B7VcFkvSfqBA";

const SERVER_URL = "http://localhost:3000/";

const INIT_LNG = -73.9332;
const INIT_LAT = 40.7051;
const INIT_ZOOM = 10.75;

const SUPERNODES = ["713", "227"];

function App() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popUpRef = useRef(new mapboxgl.Popup({ offset: 15 }));

  const [lng, setLng] = useState(INIT_LNG);
  const [lat, setLat] = useState(INIT_LAT);
  const [zoom, setZoom] = useState(INIT_ZOOM);
  // nodes info
  const [inactiveNodes, setInactiveNodes] = useState([]);
  const [showInactiveNodes, setShowInactiveNodes] = useState(false);
  const [showActiveNodes, setShowActiveNodes] = useState(true);
  const [activeNodes, setActiveNodes] = useState([]);
  const [idToNodes, setIdToNodes] = useState(null);
  const [nnToNodes, setNnToNodes] = useState(null);
  // state related to path finding
  const [searchType, setSearchType] = useState("ID");
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [disabledNodes, setDisabledNodes] = useState(new Set());
  const [path, setPath] = useState([]);
  const [nodeToCheckEdges, setNodeToCheckEdges] = useState(null);
  const [edgesOfNode, setEdgesOfNode] = useState([]);
  const [focusedNode, setFocusedNode] = useState(null);

  const addNodesLayer = useCallback((layerId, nodesData) => {
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
      map.current.removeSource(layerId);
    }
    map.current.addSource(layerId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: nodesData
          .filter((node) => node.statusOn)
          .map((node) => node.toGeoJson()),
      },
    });
    map.current.addLayer({
      id: layerId,
      source: layerId,
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
  }, []);

  const addLineStringsLayer = useCallback((layerId, lineStringsData, nodesData) => {
    if (!map.current.loaded()) return; // wait for map to initialize
    if (map.current.getLayer(layerId)) {
      map.current.removeLayer(layerId);
      map.current.removeSource(layerId);
    }
    // make all nodes more transparent
    console.log("addLineStrings");
    map.current.setPaintProperty("active_nodes", "circle-opacity", 0.3);

    map.current.addSource(layerId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: lineStringsData
      }
    });

    map.current.addLayer({
      id: layerId,
      type: "line",
      source: layerId,
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
    addNodesLayer("highlight_nodes", nodesData);

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false
    });
    // Show current edge cost in popup when hovered
    map.current.on("mouseenter", layerId, (e) => {
      map.current.getCanvas().style.cursor = "pointer";
      popup.setLngLat(e.lngLat).setHTML(`<p>Cost: ${e.features[0].properties.weight}</p>`).addTo(map.current);
    });
    // Change it back to a pointer when it leaves.
    map.current.on("mouseleave", layerId, () => {
      map.current.getCanvas().style.cursor = "";
      popup.remove();
    });

  }, [addNodesLayer]);

  const fetchNodes = async () => {
    const queryURL = `${SERVER_URL}fetch_nodes`;
    fetch(queryURL)
      .then((res) => res.json())
      .then((resJson) => {
        const supernodes = [];
        const hubs = [];
        const normalNodes = [];
        const inactive = [];
        resJson.forEach((rawNode) => {
          const nodeObj = {
            id: rawNode.id,
            nn: rawNode.nn,
            ip: rawNode.ip,
            lat: rawNode.lat,
            lng: rawNode.lng,
            alt: rawNode.alt,
            type: rawNode.type,
            statusOn: rawNode.ip !== undefined,
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
          if (nodeObj.statusOn) {
            if (rawNode.type === "supernode") {
              supernodes.push(nodeObj);
            } else if (rawNode.type === "hub") {
              hubs.push(nodeObj);
            } else {
              normalNodes.push(nodeObj);
            }
          } else {
            inactive.push(nodeObj);
          }
        });
        setActiveNodes(normalNodes.concat(hubs).concat(supernodes));
        setInactiveNodes(inactive);
      })
      .catch((error) => {
        setActiveNodes([]);
        setInactiveNodes([]);
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
    fetch(queryURL)
      .then((res) => res.json())
      .then((resJson) => {
        let pathToPlot;
        if (resJson.length > 0) {
          pathToPlot = resJson.map((node) => {
            return {
              "node": nnToNodes[node["node"]],
              "weight": node["weight"]
            }
          });
          setPath(pathToPlot);
        } else {
          pathToPlot = [];
          alert(
            `Failed to find a path between ${startNode.id} and ${endNode.id}.`
          );
        }
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

  const handleFindEdges = useCallback(async (node, hard) => {
    if (hard) {
      if (!window.confirm("This operation will ping the node to get its edges" +
          " and might take up to a minute to finish. " +
          "Additionally, edges that are not already in the cache will NOT be added to the server cache. " + 
          "Are you sure you want to proceed?")) {
        return;
      }
    }
    const queryURL = `${SERVER_URL}fetch_edges${hard ? '_hard' : ''}?node=${node.nn}`;
    fetch(queryURL)
      .then((res) => res.json())
      .then((resJson) => {
        setNodeToCheckEdges(node);
        setEdgesOfNode(resJson);
        setFocusedNode(null);
        popUpRef.current.remove();
        const edgeFeatureCollection = [];
        const highlightNodes = [node];
        for (let i = 0; i < resJson.length; i++) {
          const edge = resJson[i];
          if (nnToNodes[edge["nn"]] !== undefined) {
            highlightNodes.push(nnToNodes[edge["nn"]]);
            edgeFeatureCollection.push({
              type: "Feature",
              properties: {
                weight: edge["cost"],
              },
              geometry: {
                type: "LineString",
                coordinates: [node.getCoordinates(), nnToNodes[edge["nn"]].getCoordinates()],
              },
            });
          }
        }
        console.log("here1");
        addLineStringsLayer("edges_of_node", edgeFeatureCollection, highlightNodes);
      })
      .catch((error) => {
        console.log(error);
        alert(`Failed to fetch edges of node ${node.id}.`);
      });
  }, [addLineStringsLayer, nnToNodes]);

  const handleFindPathToInternet = useCallback(async (node) => {
    setFocusedNode(null);
    popUpRef.current.remove();
    Promise.all(SUPERNODES.map(supernode =>
      fetch(`${SERVER_URL}path_finding?node1=${node.nn}&node2=${supernode}`)))
      .then(responses => Promise.all(responses.map(res => res.json())))
      .then(resJsons => {
        resJsons.sort((path1, path2) => {
          if (path1.length === 0) {
            return 1;
          } else if (path2.length === 0) {
            return -1;
          } else {
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

  const handleSearchTypeChange = (e) => {
    setSearchType(e.target.value);
    setFocusedNode(null);
    popUpRef.current.remove();
  }

  const handleNodeSearch = (e) => {
    e.preventDefault();
    const infoToSearch = e.target.elements.infoToSearch.value;
    let nodeToSearch;
    if (searchType === "ID") {
      nodeToSearch = idToNodes[infoToSearch];
    } else if (searchType === "NN") {
      nodeToSearch = nnToNodes[infoToSearch];
    } else {
      alert("Invalid Search Type: " + searchType);
      return;
    }
    if (nodeToSearch) {
      handleNodeClick(nodeToSearch);
    } else {
      alert(`No node with ${searchType} ${infoToSearch} found.`);
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
    if (map.current.getLayer("highlight_nodes")) {
      map.current.removeLayer("highlight_nodes");
      map.current.removeSource("highlight_nodes");
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

  const handleToggleNodesLayer = (isActiveNodes) => {
    if (isActiveNodes) {
      if (showActiveNodes) {
        if (map.current.getLayer("active_nodes")) {
          map.current.removeLayer("active_nodes");
          map.current.removeSource("active_nodes");
        }
      } else {
        addNodesLayer("active_nodes", activeNodes);
      }
      setShowActiveNodes(!showActiveNodes);
    } else {
      if (showInactiveNodes) {
        if (map.current.getLayer("inactive_nodes")) {
          map.current.removeLayer("inactive_nodes");
          map.current.removeSource("inactive_nodes");
        }
      } else {
        if (map.current.getLayer("inactive_nodes")) {
          map.current.removeLayer("inactive_nodes");
          map.current.removeSource("inactive_nodes");
        }
        map.current.addSource("inactive_nodes", {
          type: "geojson",
          data: {
            type: "FeatureCollection",
            features: inactiveNodes.map((node) => node.toGeoJson()),
          },
        });
        map.current.addLayer({
          id: "inactive_nodes",
          source: "inactive_nodes",
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
            "circle-color": "#646464",
          },
        });
      }
      setShowInactiveNodes(!showInactiveNodes);
    }
  }

  const handleClearEdges = () => {
    if (map.current.getLayer("highlight_nodes")) {
      map.current.removeLayer("highlight_nodes");
      map.current.removeSource("highlight_nodes");
    }
    if (map.current.getLayer("edges_of_node")) {
      map.current.removeLayer("edges_of_node");
      map.current.removeSource("edges_of_node");
    }
    map.current.setPaintProperty("active_nodes", "circle-opacity", 1);
    setEdgesOfNode([]);
    setNodeToCheckEdges(null);
    setFocusedNode(null);
    popUpRef.current.remove();
  }

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
    map.current.addControl(new mapboxgl.NavigationControl());
    fetchNodes(); // fetch nodes info only once
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  }, [lat, lng, zoom]);

  // after fetching nodes, set up the mapping from id to references to node objects
  useEffect(() => {
    const newIdToNodes = new Map();
    activeNodes.forEach((node) => {
      newIdToNodes[node.id] = node;
    });
    setIdToNodes(newIdToNodes);
    const newNnToNodes = new Map();
    activeNodes.forEach((node) => {
      newNnToNodes[node.nn] = node;
    });
    setNnToNodes(newNnToNodes);
  }, [activeNodes]);

  // render active nodes on the map
  useEffect(() => {
    map.current.on('load', () => {
      addNodesLayer("active_nodes", activeNodes);
    })
  }, [activeNodes, addNodesLayer]);

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
  }, [focusedNode, disabledNodes, handleFindEdges, handleAddStart, handleAddEnd, handleToggleNode, handleFindPathToInternet]);

  // render a path on the map
  useEffect(() => {
    if (path.length > 0) {
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
      console.log("here2");
      addLineStringsLayer("path", edgeFeatureCollection, path.map((nodeWeight) => nodeWeight["node"]));
    }
  }, [path, addLineStringsLayer]);

  return (
    <div id="window-container">
      <div id="utility-area" className="floating-window">
        <NodeSearchBox handleNodeSearch={handleNodeSearch} handleSearchTypeChange={handleSearchTypeChange}/>
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
        ) : <></>}
        {edgesOfNode.length > 0 ? (
          <>
            <div className="divider"></div>
            <EdgesOfNode
              node={nodeToCheckEdges}
              endPoints={edgesOfNode.map(edge => nnToNodes[edge["nn"]])}
              handleNodeClick={handleNodeClick}
              handleClearEdges={handleClearEdges}
            />
          </>
        ) : <></>}
      </div>
      <NodesFilter
        activeCount={activeNodes.length}
        showActiveNodes={showActiveNodes}
        showInactiveNodes={showInactiveNodes}
        inactiveCount={inactiveNodes.length}
        handleToggleNodesLayer={handleToggleNodesLayer} />
      <div ref={mapContainer} id="map-container" />
    </div>
  );
}

export default App;
