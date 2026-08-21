#set page(margin: 2.5cm)
#set text(font: "New Computer Modern", size: 11pt)
#set heading(numbering: "1.")

#align(center)[
  #text(size: 16pt, weight: "bold")[Confidence score voor locaties]
]

Elke locatie heeft een score $s in [0,1]$ die aangeeft hoe waarschijnlijk het
is dat de locatie nog bestaat. De score daalt vanzelf met de tijd en wordt
bijgesteld zodra iemand een report indient ("nog aanwezig" of "niet meer
aanwezig").

= Opgeslagen staat

Per locatie wordt bijgehouden:

- $s$: `confidence_score`, de score op het moment van de laatste gebeurtenis
- $t_0$: `last_event_at`, tijdstip van die gebeurtenis

De score wordt dus niet continu herberekend en opgeslagen; alleen bij een
nieuwe gebeurtenis. Bij het tonen van een locatie wordt de score on-the-fly
doorgerekend naar het huidige tijdstip (zie @decay).

= Tijdsverval <decay>

Zonder reports zakt de score exponentieel, met een halfwaardetijd
$T_(1\/2) = 45$ dagen:

$ s(t) = s_0 dot e^(-lambda (t - t_0)), quad lambda = ln(2) / T_(1\/2) $

Hierin is $t - t_0$ het aantal dagen sinds de laatste gebeurtenis. Dit is de
enige plek waar tijd los van reports meetelt: hoe langer een locatie
onbevestigd blijft, hoe onwaarschijnlijker het wordt dat ze er nog staat.

= Reactie op een report

Bij een nieuwe report wordt eerst het verval tot dat moment toegepast
(@decay), en daarna een asymmetrische impuls:

$ s' = cases(
  s + alpha (1 - s) & "als report" = "nog aanwezig",
  s (1 - beta) & "als report" = "niet meer aanwezig"
) $

met $alpha = 0.30$ en $beta = 0.70$.

Een positieve report trekt de score gedeeltelijk richting 1; een negatieve
report duwt hem hard richting 0. Eén "niet meer aanwezig"-report doet dus veel
meer schade dan één "nog aanwezig"-report goedmaakt. Een enkele bevestiging
kan namelijk op een verkeerde pin of oud geheugen berusten, dus die weegt
lichter.

Na de impuls wordt $t_0$ op het huidige tijdstip gezet en gaat het verval
opnieuw vanaf $s'$ lopen.

= Voorbeeld

Startscore $s_0 = 0.75$.

$
"dag 10:" & quad "nog aanwezig" arrow.r 0.75 + 0.30(1-0.75) = 0.825 \
"dag 100:" & quad "verval, 90 dagen geen reports" arrow.r 0.825 dot e^(-ln(2)/45 dot 90) approx 0.21 \
"dag 100:" & quad "niet meer aanwezig" arrow.r 0.21 dot (1 - 0.70) approx 0.06
$

Het verval tussen dag 10 en dag 100 doet hier al het meeste werk. De
negatieve report op dag 100 bevestigt vooral wat het verloop al liet zien.

= Rate limiting

Eén gebruiker mag per locatie maximaal één report per 24 uur indienen, zodat
een enkele gebruiker de score niet herhaaldelijk in dezelfde richting kan
duwen.

= Buckets

Voor weergave wordt de live score $s(t)$ ingedeeld:

$
"bucket"(s) = cases(
  "high" & s >= 0.66,
  "medium" & 0.33 <= s < 0.66,
  "low" & s < 0.33
) $
