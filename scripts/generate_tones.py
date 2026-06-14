import os
import wave
import math
import struct

os.makedirs('assets/sounds', exist_ok=True)

freqs = [440, 660, 880]
framerate = 44100
duration = 2.0
amplitude = 16000
nframes = int(framerate * duration)

for i, freq in enumerate(freqs, start=1):
    filename = f'assets/sounds/tone{i}.wav'
    with wave.open(filename, 'w') as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(framerate)
        for j in range(nframes):
            t = float(j) / framerate
            value = int(amplitude * math.sin(2 * math.pi * freq * t))
            wf.writeframes(struct.pack('<h', value))

print('created assets/sounds/tone1.wav, tone2.wav, tone3.wav')
