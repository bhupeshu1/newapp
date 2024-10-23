"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Mic, Settings } from 'lucide-react';

const BabbleRecorder: React.FC = () => {
  const [stage, setStage] = useState<'initial' | 'countdown' | 'recording' | 'finished'>('initial');
  const [countdown, setCountdown] = useState(3);
  const [isRecording, setIsRecording] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Your component logic here


  useEffect(() => {
    if (stage === 'countdown' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (stage === 'countdown' && countdown === 0) {
      setStage('recording');
      setIsRecording(true);
      startRecording();
    }
  }, [stage, countdown]);

  useEffect(() => {
    if (stage === 'recording') {
      startVisualization();
    } else {
      stopVisualization();
    }
    return () => stopVisualization();
  }, [stage]);

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      mediaRecorderRef.current = new MediaRecorder(stream);
      setStage('countdown');
    } catch (error) {
      console.error('Error accessing microphone:', error);
    }
  };

  const startRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.start();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setStage('finished');
      setIsRecording(false);
    }
  };

  const startVisualization = () => {
    if (canvasRef.current && analyserRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const draw = () => {
        const width = canvas.width;
        const height = canvas.height;
        const bufferLength = analyserRef.current?.frequencyBinCount || 0;
        const dataArray = new Uint8Array(bufferLength);

        analyserRef.current?.getByteTimeDomainData(dataArray);
        ctx.clearRect(0, 0, width, height);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#FFA07A';
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }

          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();

        animationFrameRef.current = requestAnimationFrame(draw);
      };

      draw();
    }
  };

  const stopVisualization = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  };

  const renderContent = () => {
    switch (stage) {
      case 'initial':
        return (
          <button
            onClick={requestMicrophoneAccess}
            className="bg-transparent text-orange-300 border-2 border-orange-300 rounded-full p-8 text-xl hover:bg-orange-300 hover:text-white transition-colors"
          >
            Babble
          </button>
        );
      case 'countdown':
        return (
          <div className="bg-white rounded-full p-12 text-4xl font-bold text-gray-800">
            {countdown}
          </div>
        );
      case 'recording':
        return (
          <button
            onClick={stopRecording}
            className="bg-white text-gray-800 rounded-full p-8 text-xl z-10"
          >
            Stop
          </button>
        );
      case 'finished':
        return (
          <div className="flex space-x-4">
            <button className="bg-white text-gray-800 rounded-full px-8 py-4 text-xl">
              Done
            </button>
            <button
              onClick={() => setStage('countdown')}
              className="bg-orange-300 text-white rounded-full px-8 py-4 text-xl"
            >
              Resume
            </button>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-800 text-white p-4">
      <h1 className="text-2xl mb-8">babble</h1>
      <div className="relative w-full max-w-2xl aspect-video bg-gray-700 rounded-lg flex items-center justify-center">
        {renderContent()}
        {stage === 'recording' && (
          <canvas
            ref={canvasRef}
            className="absolute bottom-0 left-0 w-full h-1/2"
            width={800}
            height={200}
          />
        )}
      </div>
      <div className="mt-4 flex space-x-4">
        <button className="p-2 bg-gray-600 rounded-full">
          <Settings size={24} />
        </button>
        <button className="p-2 bg-gray-600 rounded-full">
          <Mic size={24} />
        </button>
      </div>
    </div>
  );
};

export default BabbleRecorder;
