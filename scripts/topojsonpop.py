import json

INPUT = "../datasets/110m.json"
TOPOLOGY = "../datasets/topology.json"
OUTPUT = "../datasets/110m_prop.json"

with open(INPUT) as input_f:
    world = json.load(input_f);
    print(world)
    with open(TOPOLOGY) as topo_f:
        topology = json.load(topo_f)
        for country1 in world.objects.countries.geometries:
            country1.properties = dict()
            for country2 in topology:
                if country1.id == country2["country-code"]:
                    country1.properties.name = country2.name
                    country1.properties.region = country2.region
                    country1.properties["sub-region"] = country2["sub-region"]
        with open(OUTPUT, "w") as output_f:
            json.dump(world, output_f, indent=4)
