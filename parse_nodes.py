import csv

STATUS_IDX = 15
NAME_IDX = 18
ID_IDX = 23
NN_IDX = 24
NOTES_IDX = 19
LAT_IDX = -3
LNG_IDX = -2
ALT_IDX = -1

nodes_info = []

supernodes = []
hubs = []
nodes = []

with open("nodes.csv", 'r') as file:
    csvreader = csv.reader(file)
    for row in csvreader:
        if row[STATUS_IDX] == "Installed":
            node = {}
            node['id'] = row[ID_IDX]
            node['nn'] = row[NN_IDX]
            node['lat'] = row[LAT_IDX]
            node['lng'] = row[LNG_IDX]
            node['alt'] = row[ALT_IDX]
            if "hub" in row[NOTES_IDX].lower():
                node['type'] = "hub"
                hubs.append(node)
            elif "supernode" in row[NAME_IDX].lower():
                node['type'] = "supernode"
                supernodes.append(node)
            else:
                node['type'] = "node"
                nodes.append(node)

print(nodes + hubs + supernodes)

