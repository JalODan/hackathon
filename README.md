# V-Shuttle Backend

Backend service for the V-Shuttle hackathon project. The system resolves ambiguity between multiple shuttle sensors and produces a single clear navigation instruction.

The shuttle receives sign readings from three sensors: a front camera (most reliable), a side camera, and a V2I infrastructure receiver. Because OCR readings may contain errors or sensors may disagree, the backend normalizes and fuses these inputs into a single clean interpretation.

To resolve OCR mistakes we use fuzzy matching (SequenceMatcher) to group similar strings and correct minor reading errors. Each sensor is weighted by reliability: front camera 50%, side camera 30%, and V2I receiver 20%. If the third sensor is missing, weights are adjusted to 65% for the front camera and 35% for the side camera.

After normalization and fusion the system produces a structured result containing the fused text, a confidence score, the resulting action, and the reason for that decision. If the final confidence score is greater than 0.60 the shuttle proceeds automatically. If the score is lower, the system requires human intervention from the safety driver.

Run the project with:

docker compose up --build
