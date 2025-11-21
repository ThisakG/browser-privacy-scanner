import json
import re

input_file = "easyprivacy.txt"
output_file = "trackers.json"

tracker_domains = set()

with open(input_file, "r", encoding="utf-8") as f:
    for line in f:
        line = line.strip()

        # skip comments & empty lines
        if not line or line.startswith("!") or line.startswith("["):
            continue

        # match rules like: ||example.com^
        m = re.match(r"\|\|([^\/\^\*]+)\^", line)
        if m:
            domain = m.group(1)
            tracker_domains.add(domain)
            continue

        # match hosts-style rules: 0.0.0.0 example.com
        m2 = re.match(r".*0\.0\.0\.0\s+([a-zA-Z0-9\.\-]+)", line)
        if m2:
            domain = m2.group(1)
            tracker_domains.add(domain)
            continue

# convert to a clean JSON structure
output = {"trackers": sorted(list(tracker_domains))}

with open(output_file, "w", encoding="utf-8") as out:
    json.dump(output, out, indent=2)

print("Done! Extracted", len(output["trackers"]), "tracker domains.")
