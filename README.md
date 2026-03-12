# V-Shuttle

## Introduction
This project addresses a critical safety and user experience issue for Waymo LCC's Level 4 autonomous "V-Shuttles" operating in complex Tuscan historical centers
. Currently, the shuttles suffer from "phantom braking" when they encounter ambiguous, degraded, or conflicting road signs, and the on-board safety drivers are only provided with incomprehensible error logs on their screens that delay manual intervention
. To bridge this gap between machine and human, this system introduces a "Semantic Parser" and a continuous "Live Touch Dashboard"
. The backend intelligently fuses conflicting text data from three different sensors with varying reliability to normalize and interpret complex traffic rules, such as time constraints and vehicle exceptions
. Simultaneously, the frontend provides a jargon-free simulation dashboard that uses clear color-coded signals, giving the safety driver exactly two seconds to evaluate uncertain scenarios and intervene before an automatic emergency stop is triggered


## Team

| Name | Contribution |
|-----|-----|
| Abish Jha | Developed the user interface, implemented the dashboard for displaying fused sensor outputs and navigation decisions. |
| Niccolò Pratesi | Developed the text recognition and normalization pipeline, including OCR correction and fuzzy matching for noisy sensor readings. |
| Olzhas Jalmukhambetov | Designed the backend service architecture, implemented sensor data fusion logic, API endpoints, and Docker deployment. |


## Proposed solution
The shuttle receives sign readings from three sensors: a front camera (most reliable), a side camera, and a V2I infrastructure receiver. Because OCR readings may contain errors or sensors may disagree, the backend normalizes and fuses these inputs into a single clean interpretation.

To resolve OCR mistakes we use fuzzy matching (SequenceMatcher) to group similar strings and correct minor reading errors. Each sensor is weighted by reliability: front camera 50%, side camera 30%, and V2I receiver 20%. If the third sensor is missing, weights are adjusted to 65% for the front camera and 35% for the side camera.

After normalization and fusion the system produces a structured result containing the fused text, a confidence score, the resulting action, and the reason for that decision. If the final confidence score is greater than 0.60 the shuttle proceeds automatically. If the score is lower, the system requires human intervention from the safety driver.


## Running instruction
Run the project with:

```docker compose up --build```


## Screenshots 
<img width="1834" height="1005" alt="Screenshot 2026-03-09 174905" src="https://github.com/user-attachments/assets/c25ccd3d-823e-4766-ae55-d3daa320cdb3" />

<img width="1832" height="1017" alt="Screenshot 2026-03-09 174954" src="https://github.com/user-attachments/assets/3f1efa39-0ce4-44da-b2af-2db4cf970b1a" />

<img width="1833" height="1019" alt="Screenshot 2026-03-09 175048" src="https://github.com/user-attachments/assets/af5c2216-29b0-43f9-b1dd-8c357ece8ecf" />

<img width="1834" height="1029" alt="Screenshot 2026-03-09 175110" src="https://github.com/user-attachments/assets/1baa2494-68d7-431f-a092-ddda4cd329b3" />

<img width="1827" height="1017" alt="Screenshot 2026-03-09 175243" src="https://github.com/user-attachments/assets/ad17dacc-180d-4255-9db5-d17ed0d2c8bb" />
