import json
import re
from difflib import SequenceMatcher


def pulisci_testo_preciso(testo_sporco):
    if not testo_sporco:
        return ""

    testo = str(testo_sporco).upper()

    # Rimuove i punti nelle parole puntate (es. V.A.R.C.O. -> VARCO)
    testo = re.sub(r'(?<=[A-Z])\.(?=[A-Z]|\s|$)', '', testo)

    # --- NORMALIZZAZIONE ORARI A FORMATO HH:MM ---

    # 1. Zero-pad delle ore singole (es. 8:00 -> 08:00)
    testo = re.sub(r'\b(\d):(\d{2})\b', r'0\1:\2', testo)

    # 2. Aggiunge :00 agli orari isolati preceduti da DALLE, ALLE, ORE
    testo = re.sub(r'\b(DALLE|ALLE|ORE)\s+(\d{1,2})(?!\:)\b', lambda m: f"{m.group(1)} {int(m.group(2)):02d}:00", testo)

    # 3. Formatta i range orari permettendo spazi in mezzo: 08-10 oppure 08:00 - 20:00 -> 08:00-10:00
    def formatta_range(match):
        h1 = int(match.group(1))
        m1 = match.group(2) if match.group(2) else ":00"
        h2 = int(match.group(3))
        m2 = match.group(4) if match.group(4) else ":00"
        return f"{h1:02d}{m1}-{h2:02d}{m2}"

    testo = re.sub(r'\b(\d{1,2})(:\d{2})?\s*-\s*(\d{1,2})(:\d{2})?\b', formatta_range, testo)

    # 4. Traduce "DALLE hh:mm ALLE hh:mm" o "DALLE hh:mm A hh:mm" in "hh:mm-hh:mm"
    testo = re.sub(r'\bDALLE\s+(\d{2}:\d{2})\s+(?:ALLE|A)\s+(\d{2}:\d{2})\b', r'\1-\2', testo)

    # ------------------------------------------------------------

    # Mappatura Leet-Speak mirata parola per parola
    tokens = testo.split()
    tokens_puliti = []

    leet_map = str.maketrans("01345", "OIEAS")

    for token in tokens:
        # Mantiene intatti numeri, orari, misure e l'eccezione L4
        if re.match(r'^(\d+([:-]\d+)*[A-Z/]*)$', token) or token == "L4":
            tokens_puliti.append(token)
        else:
            token_tradotto = token.translate(leet_map)
            tokens_puliti.append(token_tradotto)

    testo_finale = " ".join(tokens_puliti)

    # Correzione manuale per errori di OCR ricorrenti
    correzioni = {
        "SDISSESTATA": "DISSESTATA",
        "ACCSSO": "ACCESSO"
    }
    for err, corr in correzioni.items():
        testo_finale = re.sub(rf'\b{err}\b', corr, testo_finale)

    # --- STANDARDIZZAZIONE SEMANTICA ---
    # Riconduce concetti simili a un'unica forma base per favorire il raggruppamento
    sinonimi = {
        # Regole generali
        r'\bNO\b': 'DIVIETO',
        r'\bDIVIETO DI TRANSITO\b': 'DIVIETO',
        r'\bDIVIETO TRANSITO\b': 'DIVIETO',
        r'\bDIVIETO DI ACCESSO\b': 'DIVIETO',
        r'\bDIVIETO ACCESSO\b': 'DIVIETO',

        # Eccezioni e categorie veicoli
        r'\bVEICOLI ELETTRICI\b': 'ELETTRICI',
        r'\bMEZZI ELETTRICI\b': 'ELETTRICI',

        # Parole riempitive sui cartelli ZTL
        r'\bZTL NOTTURNA\b': 'ZTL',
        r'\bZTL ATTIVA\b': 'ZTL',
        r'\bDALLE\b': '',

        # NUOVE REGOLE PER LE NAVETTE L4
        r'\bTRANSITO L4 OK\b': 'ECCETTO L4',
        r'\bNAVETTE L4\b': 'L4',
        r'\bNAVETTE\b': 'L4',
        r'\bNOTTE\b': '',
        r'\bNOTTURNA\b': ''
    }

    for pattern, rimpiazzo in sinonimi.items():
        testo_finale = re.sub(pattern, rimpiazzo, testo_finale)

    # Standardizzazione finale se l'orario ZTL è isolato (es. trasforma "ZTL 20" in "ZTL 20:00")
    testo_finale = re.sub(r'\bZTL\s+(\d{1,2})(?!\:)\b', lambda m: f"ZTL {int(m.group(1)):02d}:00", testo_finale)

    # Rimuove eventuali spazi doppi creati dalle sostituzioni e pulisce
    testo_finale = re.sub(r'\s+', ' ', testo_finale).strip()

    return testo_finale


def fondi_sensori_avanzato(sensori):
    # Controlliamo quali sensori hanno restituito dati validi
    ok_frontale = sensori.get("camera_frontale", {}).get("testo") is not None
    ok_laterale = sensori.get("camera_laterale", {}).get("testo") is not None
    ok_v2i = sensori.get("V2I_receiver", {}).get("testo") is not None

    # Assegnazione dinamica dei pesi per mantenere il totale sempre vicino a 1.0
    pesi = {}
    if ok_frontale and ok_laterale and ok_v2i:
        pesi = {"camera_frontale": 0.5, "camera_laterale": 0.3, "V2I_receiver": 0.2}
    elif ok_frontale and ok_laterale and not ok_v2i:
        # V2I offline: spalmiamo il suo 0.2 sugli altri due
        pesi = {"camera_frontale": 0.65, "camera_laterale": 0.35}
    elif ok_frontale and not ok_laterale and ok_v2i:
        # Laterale offline: la frontale assorbe più peso
        pesi = {"camera_frontale": 0.70, "V2I_receiver": 0.30}
    elif not ok_frontale and ok_laterale and ok_v2i:
        # Frontale offline: laterale diventa la fonte primaria
        pesi = {"camera_laterale": 0.60, "V2I_receiver": 0.40}
    elif ok_frontale and not ok_laterale and not ok_v2i:
        pesi = {"camera_frontale": 1.0}
    elif not ok_frontale and ok_laterale and not ok_v2i:
        pesi = {"camera_laterale": 1.0}
    elif not ok_frontale and not ok_laterale and ok_v2i:
        pesi = {"V2I_receiver": 1.0}
    else:
        # Tutti e tre i sensori sono null
        return None, 0.0

    letture = []
    for nome, dati in sensori.items():
        testo = dati.get("testo")
        conf = dati.get("confidenza")
        if testo is not None and conf is not None:
            letture.append({
                "testo_pulito": pulisci_testo_preciso(testo),
                "score": conf * pesi[nome]
            })

    if not letture:
        return None, 0.0

    gruppi = []
    for l in letture:
        aggiunto = False
        for gruppo in gruppi:
            txt_a = l["testo_pulito"].replace(" ", "")
            txt_b = gruppo["testo_rappresentativo"].replace(" ", "")

            # Unisce le letture se la similarità supera l'80%
            if SequenceMatcher(None, txt_a, txt_b).ratio() > 0.80:
                gruppo["score_totale"] += l["score"]
                # Aggiorna il testo rappresentativo se questa lettura ha uno score singolo maggiore
                if l["score"] > gruppo["miglior_score_singolo"]:
                    gruppo["testo_rappresentativo"] = l["testo_pulito"]
                    gruppo["miglior_score_singolo"] = l["score"]
                aggiunto = True
                break

        if not aggiunto:
            gruppi.append({
                "testo_rappresentativo": l["testo_pulito"],
                "score_totale": l["score"],
                "miglior_score_singolo": l["score"]
            })

    gruppo_vincente = max(gruppi, key=lambda g: g["score_totale"])
    return gruppo_vincente["testo_rappresentativo"], gruppo_vincente["score_totale"]


if __name__ == "__main__":
    # Percorso locale per l'ambiente di sviluppo
    percorso_file = r"C:\Users\Olzhas\Desktop\hackathon\VShuttle-input.json"

    try:
        with open(percorso_file, 'r', encoding='utf-8') as file:
            scenari = json.load(file)
        print(f"File caricato: {len(scenari)} scenari trovati.\n")
    except FileNotFoundError:
        print(f"Errore: File non trovato in {percorso_file}")
        scenari = []

    print("--- TEST FUSIONE SENSORI ---")
    for scenario in scenari[:1000]:
        id_scen = scenario["id_scenario"]
        sensori = scenario["sensori"]

        testo_finale, confidenza_finale = fondi_sensori_avanzato(sensori)

        # print(f"Scenario {id_scen}:")
        print(testo_finale)
        # print(f"  Testo Estratto: '{testo_finale}'")
        # print(f"  Confidenza:     {confidenza_finale:.2f}")
        # print("-" * 40)