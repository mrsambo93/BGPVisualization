#!/usr/bin/env python

import time, json
from _pybgpstream import BGPStream, BGPRecord, BGPElem

# Create a new bgpstream instance and a reusable bgprecord instance
stream = BGPStream()
rec = BGPRecord()

stream.add_filter('project', 'ris')

timestamp = int(time.time())
# Consider this time interval:
# Sat Aug  1 08:20:11 UTC 2015
stream.add_recent_interval_filter('12 h', False)

# Start the stream
stream.start()

l = 0
out = list()
# Get next record
while(stream.get_next_record(rec) and l < 100):
    # Print the record information only if it is not a valid record
    if rec.status == "valid":
        elem = rec.get_next_elem()
        while(elem and l < 100):
            el = dict()
            el['project'] = rec.project
            el['collector'] = rec.collector
            el['record_type'] = rec.type
            el['time'] = rec.time
            el['status'] = rec.status
            el['elem_type'] = elem.type
            el['peer_address'] = elem.peer_address
            el['peer_asn'] = elem.peer_asn
            el['fields'] = elem.fields
            out.append(el)
            l += 1
            elem = rec.get_next_elem()

with open("output.json", "w") as output:
    json.dump(out, output, indent=4)

