# Maltese Gear Cube – Zugfolgen nachvollziehen

Lokale Web-App (eine einzige HTML-Datei, kein Build, keine Abhängigkeiten), die den
Meffert's Maltese Gear Cube als Würfelnetz darstellt und Zugfolgen Schritt für Schritt
nachvollziehbar macht – mit Vergleich **Vorher / Schritt / Nachher**.

**Online:** https://kingdeim.github.io/MalteseGearCube/ (sobald GitHub Pages aktiviert ist)
**Lokal:** `index.html` im Browser öffnen.

## Funktionen

- Drei Würfelnetze nebeneinander: Ausgangsstellung, aktueller Schritt, Ergebnis
- Durchschalten per Buttons, Pfeiltasten oder „Abspielen“; gestrichelt markiert ist der
  Mittelring des nächsten Zugs
- Veränderte Teile im Ergebnis werden hervorgehoben; zusätzlich eine Liste der Zyklen
  (Zahnräder inkl. Eigendrehung, Ecken inkl. Verdrehung, Kanten & Mitten)
- Makros (z. B. `W`, `J`, `K`, `A`, `C`, `XL`, `XR`, `XB`) – editierbar, im Browser gespeichert
- Zugfolge invertieren, Makros wahlweise in Einzelzüge auflösen
- Flächen-Grafik aus einem Foto des Originals abgepaust (Ecksterne, asymmetrische Zahnräder)

## Notation

| Eingabe | Bedeutung |
|---|---|
| `R L U D F B` | Viertelumdrehung der jeweiligen Hälfte im Uhrzeigersinn |
| `R'` | gegen den Uhrzeigersinn |
| `R3`, `R4`, `U'2` | Anzahl Viertelumdrehungen |
| `(R4 U R4 U')3` | Gruppe mit Wiederholung |
| `x y z` | ganze Würfeldrehung |
| `W`, `J'`, `A` … | Makros (mit `'` invertiert, mit Zahl wiederholt) |

Bezeichnungen: Zahnrad `UF` = auf der U-Seite, Richtung F; Kante `UF` = zwischen U und F; Mitte `U`.

## Mechanik-Modell

Rekonstruiert und gegen die Algorithmen einer bekannten Lösungsanleitung geprüft:

- Eine Vierteldrehung dreht eine Würfelhälfte wie beim 2×2 um 90°.
- Der Mittelring dazwischen (4 Mitten, 4 Kanten, 8 Zahnräder) dreht sich wie beim
  Mixup-Würfel um 45° mit – deshalb ist `R4` nicht die Identität, und Mitten und Kanten
  können die Plätze tauschen.
- Zahnräder im Ring rücken eine Position weiter und drehen sich dabei um 90° um ihre Achse.

Farben im gelösten Zustand: U weiß, D gelb, F grün, B blau, L rot, R violett.
