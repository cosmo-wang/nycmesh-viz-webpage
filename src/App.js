import React, { useRef, useEffect, useState, useCallback } from "react";
import ReactDOM from "react-dom";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import Popup from "./components/Popup";
import PathNodes from "./components/PathNodes";
import NodeSearchBox from "./components/NodeSearchBox";
import { reorder } from "./Utils";
import "./App.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoiY29zbW93YW5nIiwiYSI6ImNqdWl0bG50ODFlZ2w0ZnBnc3VyejZmbWQifQ.5TjxQgPSj6B7VcFkvSfqBA";

const SERVER_URL = "http://localhost:3000/";

const ID_TO_TP = {
  7347: "10.69.73.47",
  1971: "10.69.19.71",
  1440: "10.68.14.40",
  7941: "10.68.79.41"
}

const IP_TO_ID = {
  "10.69.73.47": 7347,
  "10.69.19.71": 1971,
  "10.68.14.40": 1440,
  "10.68.79.41": 7941
}

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
  const [pathNodes, setPathNodes] = useState([]);
  const [path, setPath] = useState();
  const [focusedNode, setFocusedNode] = useState(null);

  const fetchNodes = async () => {
    fetch(`${SERVER_URL}fetch_nodes`)
      .then(res => res.json())
      .then(resJson => {
        const fetchedNodes = resJson.map((rawNode) => {
          return {
            id: rawNode.id,
            nn: rawNode.nn,
            lat: rawNode.lat,
            lng: rawNode.lng,
            alt: rawNode.alt,
            type: rawNode.type,
            statusOn: true,
            simStatusOn: true,
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
            }
          };
        });
        setNodes(fetchedNodes);
      })
      .catch(error => {
        setNodes([]);
        console.log(error);
        alert("Failed to fetch nodes information.")
      });
  };

  const queryPath = async (start, end, disabled) => {
    let disabledQueryStr = "";
    disabled.forEach((disabledNode, index) => {
      disabledQueryStr += disabledNode + (index === disabled.length - 1 ? "" : ",");
    })
    fetch(`${SERVER_URL}path_finding?node1=${ID_TO_TP[start]}&node2=${ID_TO_TP[end]}&disabled_node=${disabledQueryStr}`)
    .then(res => res.json())
    .then(resJson => {
      console.log(resJson);
      const pathToPlot = resJson.map(ip => idToNodes[IP_TO_ID[ip]].getCoordinates());
      const newPathNodes = resJson.map(ip => idToNodes[IP_TO_ID[ip]]);
      setPathNodes(newPathNodes);
      setPath(pathToPlot);
    })
    .catch(error => {
      console.log(error);
      alert(`Failed to find a path between ${start} and ${end}.`)
      return [];
    });
  };

  const handleAddStart = useCallback((id) => {
    for (let i = 0; i < pathNodes.length; i++) {
      if (pathNodes[i].id === id) {
        return;
      }
    }
    setPathNodes([idToNodes[id]].concat(pathNodes));
  }, [idToNodes, pathNodes]);

  const handleAddEnd = useCallback((id) => {
    for (let i = 0; i < pathNodes.length; i++) {
      if (pathNodes[i].id === id) {
        return;
      }
    }
    setPathNodes(pathNodes.concat([idToNodes[id]]));
  }, [idToNodes, pathNodes]);

  const onDragEnd = (result) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }
    const newPathNodes = reorder(
      pathNodes,
      result.source.index,
      result.destination.index
    );
    setPathNodes(newPathNodes);
  };

  const showPopup = useCallback((node) => {
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
  }, [handleAddStart, handleAddEnd]);

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

  const handlePathNodeDelete = (index) => {
    setFocusedNode(null);
    popUpRef.current.remove();
    const newPathNodes = [];
    pathNodes.forEach((node, i) => {
      if (i !== index) {
        newPathNodes.push(node);
      }
    });
    setPathNodes(newPathNodes);
  };

  const handleToggleNode = (node) => {
    const newPathNodes = [];
    pathNodes.forEach(oldNode => {
      if (oldNode.id === node.id) {
        oldNode.simStatusOn = !oldNode.simStatusOn;
        newPathNodes.push(oldNode);
      } else {
        newPathNodes.push(oldNode);
      }
    });
    setPathNodes(newPathNodes);
  }

  const handlePlotPath = () => {
    popUpRef.current.remove();
    setFocusedNode(null);
    queryPath(pathNodes[0].id, pathNodes[pathNodes.length - 1].id, ['10.69.4.7','10.68.4.7','10.70.253.20','10.70.253.21']);
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
    fetchNodes();  // fetch nodes info only once
  });

  // move map to initial center
  useEffect(() => {
    if (!map.current) return; // wait for map to initialize
    map.current.on("move", () => {
      setLng(map.current.getCenter().lng.toFixed(4));
      setLat(map.current.getCenter().lat.toFixed(4));
      setZoom(map.current.getZoom().toFixed(2));
    });
  });

  // after fetching nodes, set up the mapping from id to references to node objects
  useEffect(() => {
    const newIdToNodes = new Map();
    nodes.forEach((node) => {
      newIdToNodes[node.id] = node;
    });
    setIdToNodes(newIdToNodes);
  }, [nodes]);

  // render nodes on the map
  useEffect(() => {
    if (map.current.loaded()) {
      if (map.current.getLayer("nodes")) {
        map.current.removeLayer("nodes");
        map.current.removeSource("nodes");
      }
      map.current.addSource("nodes", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: nodes.map((node) => node.toGeoJson()),
        },
      });
      map.current.addLayer({
        id: "nodes",
        source: "nodes",
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
    }
  }, [nodes]);

  // add click pop-up to nodes on three layers
  useEffect(() => {
    if (!map.current.getLayer("nodes")) return;
    map.current.on("click", "nodes", (e) => {
      setFocusedNode(idToNodes[e.features[0].properties.id]);
    });
    // Change the cursor to a pointer when the mouse is over the places layer.
    map.current.on("mouseenter", "nodes", () => {
      map.current.getCanvas().style.cursor = "pointer";
    });
    // Change it back to a pointer when it leaves.
    map.current.on("mouseleave", "nodes", () => {
      map.current.getCanvas().style.cursor = "";
    });
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
    const layers = map.current.getStyle().layers;
    let nodesLayerId;
    for (const layer of layers) {
      if (layer === 'symbol') {
        nodesLayerId = layer.id;
        break;
      }
    }
    map.current.addSource("path", {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: path,
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
    }, nodesLayerId);
  }, [path]);

  return (
    <div>
      <div id="floating-window">
        <NodeSearchBox handleNodeSearch={handleNodeSearch}/>
        <PathNodes
          pathNodes={pathNodes}
          onDragEnd={onDragEnd}
          handlePathNodeDelete={handlePathNodeDelete}
          handleNodeClick={handleNodeClick}
          handleToggleNode={handleToggleNode}
          handlePlotPath={handlePlotPath}
        />
      </div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default App;
