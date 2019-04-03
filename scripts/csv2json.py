import json
import csv

INPUT = "../datasets/rrc.tsv"
OUTPUT = "../datasets/rrc_ris.json"

output = list()

with open(INPUT) as csv_file:
    csvreader = csv.DictReader(csv_file, delimiter='\t')
    output = list(csvreader)

with open(OUTPUT, "w") as json_file:
    json.dump(output, json_file, indent=4)


