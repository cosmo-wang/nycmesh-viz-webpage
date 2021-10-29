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

with open("nodes.csv", 'r') as file:
    csvreader = csv.reader(file)
    header = next(csvreader)
    print(header)
    for row in csvreader:
        if row[STATUS_IDX] == "Installed":
            node = {}
            node['id'] = row[ID_IDX]
            node['nn'] = row[NN_IDX]
            node['lat'] = row[LAT_IDX]
            node['lng'] = row[LNG_IDX]
            node['alt'] = row[ALT_IDX]
            if "hub" in row[NOTES_IDX].lower():
                type = "hub"
            elif "supernode" in row[NAME_IDX].lower():
                type = "supernode"
            else:
                type = "node"
            node['type'] = type
            nodes_info.append(node)

print(nodes_info)

