# 01 — Concept archive

Owner: creative-director. Concepts **not chosen** by the client (2026-09-23 pick: B, Caustic Lithography).
Kept for the record only. Their beat sheets are **not** live and are written as plain lists so no gate parses them.

---

## Concept A: Abyssal Stack
*(the client's own direction, corrected and made interactive)*

**The idea in one sentence.** Scrolling down descends the real chip-design stack instead of metres, from a working system
at the sunlit surface down through architecture and RTL to the seafloor, where gates, layout and silicon wait. That floor is
the part of the flow Akash is heading toward.

**Central metaphor.** Water depth is abstraction. The readout uses the true order,
`SYSTEM → ARCHITECTURE → MICROARCHITECTURE → RTL → NETLIST → LAYOUT → SILICON`, with a second gauge showing the feature scale
(mm → µm → nm, #19) instead of fake metres. The colours obey water absorption (#9): reds die first with depth, and only
blue-green is left, **except the Contact control, which glows far-red at every depth.** That is the stoplight loosejaw's private
red channel, a real deep-sea trick. Signals are bioluminescence: below the sunlit zone nearly all light is made by living things,
and below the "surface" of a chip all behaviour is made by signals.

**Emotional arc.** *Start:* bright, calm, a finished thing that works. *Turn:* the light fades and you realise the real work
is below what anyone sees. *End:* the seafloor is unlit silicon, the physical-design layers he has not reached yet, and the
invitation is "help me get there." The ending is honest, forward-looking and fits an internship.

**Signature moment: the siphonophore pipeline, made pokeable.** In the midnight zone the ambient light goes out. A siphonophore
(a real colonial animal: a chain of specialised units, each doing one job and passing the result on) drifts in with five segments,
**IF · ID · EX · MEM · WB**. Instructions travel along it as pulses of light. The visitor toggles **forwarding** and sends the two
real cases (#2): a dependent `add → sub` pair, where a **bubble** forms with forwarding off and a thread of light arcs back EX→EX
with it on; and a **load-use** pair, which still costs one bubble even with forwarding, which is correct. A taken branch
**flushes** the chain. A DOM cycle-by-stage table sits next to it as the accessible version, and it is also what engineers read.

**Projects mapped (in the true abstraction order).**
| Zone / layer | Project | Why it sits here |
|---|---|---|
| Sunlit / SYSTEM | CyBot | A whole embedded system (C on a microcontroller) that navigates by **PING echoes**. Sonar in air and sonar at sea are the same physics (#12). |
| Twilight / ARCHITECTURE | WiSARD | An algorithm chosen *for* hardware: RAM lookups instead of multiplies, trading memory against accuracy for edge devices. |
| Midnight / MICROARCH | RISC-V 5-stage | The siphonophore (signature). |
| Abyss / RTL | BLE Link Layer (senior design, in progress) | State machines written in Verilog, shown as deep creatures whose light pattern *is* their state (standby, advertising, scanning, connection). |
| Seafloor / NETLIST → SILICON | — (the future) | Unlit. The contact invitation. |

**Why it is not generic.** The depth is a real, correctly ordered design flow. The palette is physics, not mood. The one
signature moment is a correct pipeline you can operate. The ending admits what he has not done yet, and that honesty is the hook.

**Risk.** It is still the most expected direction ("ocean portfolio, you dive"), and neal.fun owns scroll-to-descend, so a
juror may find the frame familiar even though the contents are not. The black water at depth needs very disciplined art direction.
The long vertical path makes the Surface Interrupt carry the whole 30-second test.

**Draft beat sheet**
```
- S1-hero / calm / "a working thing at the surface" / user job: orient / signature: no
- S2-about / curiosity / breaking the surface: who, school, skills / user job: recognise / signature: no
- S3-cybot / ease / SYSTEM: a robot that finds its way by echo / user job: understand / signature: no
- S4-wisard / intrigue / ARCHITECTURE: learning by memory, not maths / user job: understand / signature: no
- S5-riscv / awe / MICROARCH: the pokeable siphonophore / user job: understand / signature: yes
- S6-linklayer / tension / RTL: creatures whose light is their state / user job: understand / signature: no
- S7-contact / resolve / the unlit floor: "help me get there" / user job: act / signature: no
```


---

## Concept C: Advertising on 37
*(built on his senior design; the site is a Link Layer connection with the visitor)*

**The idea in one sentence.** Radio dies in seawater, so in the deep, light carries the packet. Akash is a light advertising
itself in the dark, the visitor is the scanner that answers, and the whole site is a Bluetooth Low Energy connection being made,
the exact subsystem he is building (in progress) in Verilog.

**Central metaphor.** The physical premise is load-bearing: seawater is conductive and absorbs radio quickly, which is why deep-sea
life signals with light (firefly squid, dinoflagellates, anglerfish lures). So the site *translates* his radio protocol into light,
and every blink is a real Link Layer event. Page structure = the LL state machine (#18): **Standby → Advertising → Scanning →
Initiating → Connection**, shown in a tiny state indicator with plain labels next to it.

**Emotional arc.** *Start:* solitude, one light pulsing unanswered in the black. *Turn:* the visitor's light answers, and the
two **lock into one rhythm**, the moment of recognition. *End:* a steady connection and an open channel, which is the invitation.

**Signature moment: the handshake (a reward, not a gate).** The loader is a real ADV_IND (#4) decoding `Akash Gojuru` in 31 bytes.
The hero then shows one light blinking on channels 37, 38 and 39, and the three lines are already in the DOM: *Akash Gojuru* ·
*Computer Engineering, Iowa State* · *Seeking chip-design internships*. When the visitor scrolls or clicks, their light sends a connection request,
both lights sync to one interval, and the camera **hops** onto the first data channel. The senior-design section then says plainly:
*"What just happened is the Link Layer, the part I'm building for my senior design (in progress)."*

**Projects mapped (each is a data channel the connection hops to).**
| Hop | Project | As light-talk |
|---|---|---|
| 1 | BLE Link Layer (in progress) | Hop (#3) live: CSA#1 around whale-song interference; mark lanes bad and watch the remap. |
| 2 | RISC-V 5-stage | Packets through five stages: Bubble Lock (#2), compact. |
| 3 | CyBot | Talking with echoes: Ping (#12). |
| 4 | WiSARD | Recognising a pattern of flashes from memory alone. |

**Why it is not generic.** No other portfolio could use this, because it is built from his current project and his exact role.
The primary action is the story's climax: the site ends in a connection, so the CTA *is* the resolution.

**Risk.** (1) The jargon (`ADV_IND`, `CONNECT_IND`, CSA#1) needs a plain line next to each term. (2) Hop navigation needs a predictable
channel-map fallback. (3) It rests on unfinished work and must never imply results. (4) Black with glowing dots drifts toward generic.
(5) The ocean is present as physics (light instead of radio), but it is the least *visible* ocean of the three.

**Draft beat sheet**
```
- S1-hero / solitude / "a light in the dark, calling on 37/38/39" / user job: orient / signature: yes
- S2-handshake / recognition / your light answers; lights sync; about / user job: recognise / signature: no
- S3-linklayer / revelation / "what just happened is what I'm building" / user job: understand / signature: no
- S4-riscv / focus / hop: packets through five stages / user job: understand / signature: no
- S5-cybot / play / hop: finding the way by echoes / user job: understand / signature: no
- S6-wisard / stillness / hop: a pattern recognised from memory / user job: understand / signature: no
- S7-connect / resolve / connection held open: talk to me / user job: act / signature: no
```

