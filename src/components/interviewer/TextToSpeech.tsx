import React, { useState, useRef, useEffect } from 'react';
import { Volume2, VolumeX, Pause, Play, Loader } from 'lucide-react';
import axios from 'axios';

interface TextToSpeechProps {
  text: string;
  autoPlay?: boolean;
}

// You'll need your OpenAI API key
// const OPENAI_API_KEY = '';

export const TextToSpeech: React.FC<TextToSpeechProps> = ({ 
  text, 
  autoPlay = false 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  
  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio();
    
    audioRef.current.onplay = () => {
      setIsPlaying(true);
      setIsPaused(false);
    };
    
    audioRef.current.onpause = () => {
      setIsPaused(true);
    };
    
    audioRef.current.onended = () => {
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    audioRef.current.onerror = () => {
      setError('Error playing audio');
      setIsPlaying(false);
      setIsPaused(false);
    };
    
    // Clean up
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      
      // Revoke object URL if it exists
      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current);
      }
    };
  }, []);
  
  // Generate speech when text changes
  useEffect(() => {
    // Clear previous audio
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
    
    if (text && text.trim() !== '') {
      // Only auto-generate if autoPlay is true
      if (autoPlay) {
        generateSpeech();
      }
    }
  }, [text, autoPlay]);
  
  const generateSpeech = async () => {
    if (!text || text.trim() === '') return;
    
    // Don't regenerate if we already have audio for this text
    if (audioUrlRef.current) {
      playAudio();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call OpenAI TTS API
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1', // or tts-1-hd for higher quality
          voice: 'alloy', // options: alloy, echo, fable, onyx, nova, shimmer
          input: text
        },
        {
          headers: {
            'Authorization': `Bearer ${OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer' // Important to get binary data
        }
      );
      
      // Convert arraybuffer to blob
      const audioBlob = new Blob([response.data], { type: 'audio/mpeg' });
      
      // Create a URL for the blob
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      
      // Set the audio source
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        
        // Play audio if autoPlay is enabled
        if (autoPlay) {
          await playAudio();
        }
      }
    } catch (err) {
      console.error('Error generating speech:', err);
      setError('Failed to generate speech audio');
    } finally {
      setIsLoading(false);
    }
  };
  
  const playAudio = async () => {
    if (!audioRef.current) return;
    
    try {
      // If we don't have audio yet, generate it first
      if (!audioUrlRef.current) {
        await generateSpeech();
        return; // The function will call playAudio after generating
      }
      
      // Set volume based on mute state
      audioRef.current.volume = isMuted ? 0 : 1;
      
      // Play the audio
      await audioRef.current.play();
      setIsPlaying(true);
      setIsPaused(false);
    } catch (err) {
      console.error('Error playing audio:', err);
      setError('Failed to play audio');
    }
  };
  
  const pauseAudio = () => {
    if (!audioRef.current) return;
    
    if (isPlaying && !isPaused) {
      audioRef.current.pause();
      setIsPaused(true);
    } else if (isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  };
  
  const stopAudio = () => {
    if (!audioRef.current) return;
    
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
    setIsPaused(false);
  };
  
  const toggleMute = () => {
    if (!audioRef.current) return;
    
    const newMuteState = !isMuted;
    audioRef.current.volume = newMuteState ? 0 : 1;
    setIsMuted(newMuteState);
  };
  
  return (
    <div className="flex items-center space-x-2">
      {error && (
        <div className="p-2 bg-red-500/30 text-red-100 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={isPlaying ? pauseAudio : playAudio}
        disabled={isLoading}
        className={`p-2 rounded-full ${
          isLoading 
            ? 'bg-gray-500/30 cursor-wait' 
            : isPlaying 
              ? 'bg-purple-500/30 hover:bg-purple-500/40' 
              : 'bg-blue-500/30 hover:bg-blue-500/40'
        } transition-colors`}
        title={isPlaying ? (isPaused ? 'Resume' : 'Pause') : 'Play'}
      >
        {isLoading ? (
          <Loader size={16} className="text-white animate-spin" />
        ) : isPlaying && !isPaused ? (
          <Pause size={16} className="text-white" />
        ) : (
          <Play size={16} className="text-white" />
        )}
      </button>
      
      <button
        onClick={toggleMute}
        disabled={isLoading || !isPlaying}
        className={`p-2 rounded-full ${
          isMuted 
            ? 'bg-red-500/30 hover:bg-red-500/40' 
            : 'bg-green-500/30 hover:bg-green-500/40'
        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <VolumeX size={16} className="text-white" />
        ) : (
          <Volume2 size={16} className="text-white" />
        )}
      </button>
    </div>
  );
};