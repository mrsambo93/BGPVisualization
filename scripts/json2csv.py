import json
import csv

INPUT = "../datasets/CommunityDB.json"
OUTPUT = "../datasets/CommunityDB.csv"

with open(INPUT) as jfile:
    data = json.load(jfile)
    with open(OUTPUT, "wb+") as cfile:
        writer = csv.writer(cfile, dialect='excel')
        writer.writerow(['id', 'aut', 'value1', 'value2', 'comment'])
        for obj in data:
            writer.writerow([obj['id'], obj['aut'], obj['value1'], obj['value2'], obj['comment']])

