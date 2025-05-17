import React, { useState, useRef } from 'react';
import { Mic, Square, Loader } from 'lucide-react';
import axios from 'axios';

// You'll need to get your own OpenAI API key
// const OPENAI_API_KEY = '';

interface VoiceRecorderProps {
  onTranscription: (text: string) => void;
  isDisabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ 
  onTranscription, 
  isDisabled = false 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  const startRecording = async () => {
    setError(null);
    audioChunksRef.current = [];
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = handleDataAfterRecording;
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Could not access microphone. Please check permissions and try again.');
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      
      // Stop all audio tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      
      setIsRecording(false);
      setIsProcessing(true);
    }
  };
  
  const handleDataAfterRecording = async () => {
    try {
      if (audioChunksRef.current.length === 0) {
        setIsProcessing(false);
        return;
      }
      
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert to base64 for sending to Whisper API
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., 'data:audio/webm;base64,')
        const base64Audio = base64data.split(',')[1];
        
        await transcribeAudio(base64Audio);
      };
    } catch (err) {
      console.error('Error processing audio:', err);
      setError('Failed to process the recording.');
      setIsProcessing(false);
    }
  };
  
  const transcribeAudio = async (base64Audio: string) => {
    try {
      // Create a FormData object
      const formData = new FormData();
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/webm' });
      
      // Append the audio file to the FormData
      formData.append('file', audioBlob, 'recording.webm');
      formData.append('model', 'whisper-1');
      
      // Call OpenAI's Whisper API
      const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data && response.data.text) {
        onTranscription(response.data.text);
      } else {
        setError('Could not transcribe audio.');
      }
    } catch (err) {
      console.error('Error calling Whisper API:', err);
      setError('Failed to transcribe audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="flex flex-col items-center">
      {error && (
        <div className="mb-2 p-2 bg-red-500/30 text-red-100 rounded-md text-sm">
          {error}
        </div>
      )}
      
      <button
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isDisabled || isProcessing}
        className={`p-3 rounded-full ${
          isRecording 
            ? 'bg-red-500/30 hover:bg-red-500/40' 
            : isProcessing
              ? 'bg-yellow-500/30 cursor-wait'
              : 'bg-blue-500/30 hover:bg-blue-500/40'
        } transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
      >
        {isRecording ? (
          <Square size={20} className="text-white" />
        ) : isProcessing ? (
          <Loader size={20} className="text-white animate-spin" />
        ) : (
          <Mic size={20} className="text-white" />
        )}
      </button>
      
      <div className="mt-1 text-xs text-white/50">
        {isRecording 
          ? 'Recording... Click to stop' 
          : isProcessing 
            ? 'Processing...' 
            : 'Click to record'}
      </div>
    </div>
  );
};