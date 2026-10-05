"""Original Run for Life loop. Reproduce with Python 3; no external assets."""
from pathlib import Path
import math, random, struct, wave
rate=22050
beat=60/128
length=32*beat
samples=[0.0]*int(rate*length)
rng=random.Random(2026)
def note(start,duration,midi,gain,kind='lead'):
    frequency=440*2**((midi-69)/12)
    for j in range(int(duration*rate)):
        i=int(start*rate)+j
        if i>=len(samples):break
        t=j/rate
        envelope=min(1,t/.012)*min(1,(duration-t)/.06)
        if kind=='lead':value=math.sin(2*math.pi*frequency*t)+.22*math.sin(4*math.pi*frequency*t)
        else:value=math.sin(2*math.pi*frequency*t)*math.exp(-t*3)
        samples[i]+=gain*envelope*value
roots=[45,45,41,43,45,48,43,40]
melody=[69,72,76,72,67,71,74,71,65,69,72,69,67,71,74,76,
        69,72,76,79,72,76,79,76,67,71,74,77,68,71,76,71]
for bar,root in enumerate(roots):
    for pulse in range(4):
        position=(bar*4+pulse)*beat
        note(position,beat*.82,root,.18,'bass')
        note(position,beat*.78,melody[bar*4+pulse],.09)
        note(position+beat/2,beat*.35,melody[bar*4+pulse]-12,.045)
        for j in range(int(.11*rate)):
            i=int(position*rate)+j
            if i<len(samples):
                t=j/rate
                samples[i]+=.12*math.sin(2*math.pi*(68*t-120*t*t))*math.exp(-t*35)
        for half in (0,.5):
            for j in range(int(.025*rate)):
                i=int((position+half*beat)*rate)+j
                if i<len(samples):samples[i]+=.026*rng.uniform(-1,1)*math.exp(-j/(rate*.008))
peak=max(abs(s) for s in samples)
path=Path(__file__).resolve().parents[1]/'assets/music/night-trail.wav'
path.parent.mkdir(parents=True,exist_ok=True)
with wave.open(str(path),'wb') as out:
    out.setnchannels(1);out.setsampwidth(2);out.setframerate(rate)
    out.writeframes(b''.join(struct.pack('<h',int(s/max(1,peak)*30000)) for s in samples))
print(f'Generated original loop: {length:.2f}s, {rate}Hz mono, {path.stat().st_size} bytes')
