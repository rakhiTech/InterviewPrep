'use client';

import React, { useState, useRef, useEffect } from 'react';

// Native Node Modules: 100% reliable, zero CDN blocking!
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

interface DraggableVideoProps {
  stream: MediaStream;
  onFaceDetectChange?: (detected: boolean) => void;
  onDeviceDetectChange?: (detected: boolean) => void;
}

export default function DraggableVideo({ stream, onFaceDetectChange, onDeviceDetectChange }: DraggableVideoProps) {
  const [position, setPosition] = useState({ x: 20, y: 80 }); 
  const [isDragging, setIsDragging] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [debugMsg, setDebugMsg] = useState('Initializing AI System...');
  
  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Detection variables
  const aiModelRef = useRef<cocoSsd.ObjectDetection | null>(null);
  const personChecksRef = useRef<{ lastSeen: number, isMissing: boolean }>({ lastSeen: 0, isMissing: false });
  const deviceChecksRef = useRef<{ isDetected: boolean }>({ isDetected: false });
  const timeoutRef = useRef<any | null>(null);

  // Initialize refs that need dynamic values
  useEffect(() => {
    personChecksRef.current.lastSeen = Date.now();
  }, []);
  
  // Set up video stream immediately
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Load TensorFlow models
  useEffect(() => {
    let active = true;
    
    const initDetection = async () => {
      try {
        setDebugMsg('Warming up AI Neural Engine...');
        
        // Since it's bundled natively via NPM, there is no download delay or `window` bugs!
        aiModelRef.current = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
        
        setDebugMsg('AI Active - Monitoring Room');
        
        if (active) detectFrame();
      } catch (err) {
        setDebugMsg('Failed to initialize AI Engine');
        console.error("AI initial load error:", err);
      }
    };
    
    // The scanning loop
    const detectFrame = async () => {
      if (!active) return;
      
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0 && aiModelRef.current) {
        try {
          const predictions = await aiModelRef.current.detect(video);
          
          let personFound = false;
          let phoneFound = false;
          
          predictions.forEach((p) => {
            if (p.class === 'person' && p.score > 0.35) personFound = true;
            if (p.class === 'cell phone' && p.score > 0.45) phoneFound = true;
          });
          
          const now = Date.now();
          
          // --- PERSON PROCESSING ---
          if (personFound) {
             personChecksRef.current.lastSeen = now;
             if (personChecksRef.current.isMissing) {
                personChecksRef.current.isMissing = false;
                if (onFaceDetectChange) onFaceDetectChange(true);
             }
          } else {
             if (!personChecksRef.current.isMissing && now - personChecksRef.current.lastSeen > 3000) {
               personChecksRef.current.isMissing = true;
               if (onFaceDetectChange) onFaceDetectChange(false);
             }
          }
          
          // --- DEVICE PROCESSING ---
          if (phoneFound) {
             if (!deviceChecksRef.current.isDetected) {
                deviceChecksRef.current.isDetected = true;
                if (onDeviceDetectChange) onDeviceDetectChange(true);
             }
          } else {
             if (deviceChecksRef.current.isDetected) {
                deviceChecksRef.current.isDetected = false;
                if (onDeviceDetectChange) onDeviceDetectChange(false);
             }
          }
          
          // Determine status message
          if (phoneFound) setDebugMsg('🚨 WARNING: Phone Detected!');
          else if (!personFound && personChecksRef.current.isMissing) setDebugMsg('⚠️ WARNING: No Person!');
          else setDebugMsg('✅ Monitoring Active OK');
          
        } catch (e: any) {
           console.error("Tracking err:", e);
        }
      }
      
      if (active) timeoutRef.current = setTimeout(detectFrame, 500);
    };
    
    setTimeout(() => { if (active) initDetection(); }, 500);
    
    return () => {
      active = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [onFaceDetectChange, onDeviceDetectChange]);

  // Draggable window logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({ x: Math.max(0, dragRef.current.initialX + dx), y: Math.max(0, dragRef.current.initialY + dy) });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initialX: position.x, initialY: position.y };
  };

  const isWarning = debugMsg.includes('WARNING');
  const isOk = debugMsg.includes('OK');

  return (
    <div
      style={{
        position: 'fixed', top: position.y, left: position.x, zIndex: 9999,
        background: 'var(--surface-color, #1a1b26)', border: '1px solid var(--border-color, #2f334d)',
        borderRadius: '8px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
        width: isMinimized ? '200px' : '260px', overflow: 'hidden',
        transition: isDragging ? 'none' : 'width 0.3s ease'
      }}
    >
      <div 
        onMouseDown={handleMouseDown}
        style={{
          padding: '8px 12px', background: 'var(--bg-secondary, #24283b)',
          cursor: isDragging ? 'grabbing' : 'grab', display: 'flex',
          justifyContent: 'space-between', alignItems: 'center', userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-color, #fff)' }}>
            📷 Camera View
          </span>
          <div style={{ 
            width: '8px', height: '8px', borderRadius: '50%', 
            background: isWarning ? 'var(--error)' : 'var(--success)', 
            boxShadow: isWarning ? '0 0 8px var(--error)' : '0 0 5px var(--success)',
            animation: 'pulse 2s infinite'
          }} />
        </div>
        
        <button 
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: 'none', border: 'none', color: 'var(--text-color, #fff)',
            cursor: 'pointer', padding: '4px', fontSize: '16px', lineHeight: 1
          }}
          title={isMinimized ? "Expand" : "Minimize"}
        >
          {isMinimized ? '□' : '−'}
        </button>
      </div>
      
      <div style={{ padding: '2px 12px 6px', background: 'var(--bg-secondary, #24283b)', color: 'var(--text-muted, #9ca3af)', fontSize: '10px' }}>
         <span style={{color: isOk ? 'var(--success)' : isWarning ? 'var(--error)' : 'orange'}}>{debugMsg}</span>
      </div>
      
      <div style={{ 
        height: isMinimized ? '0' : '195px',  
        opacity: isMinimized ? 0 : 1, transition: 'height 0.3s ease, opacity 0.3s ease',
        background: '#000', pointerEvents: isMinimized ? 'none' : 'auto'
      }}>
        <video 
          autoPlay muted playsInline ref={videoRef}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} 
        />
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
      `}} />
    </div>
  );
}
