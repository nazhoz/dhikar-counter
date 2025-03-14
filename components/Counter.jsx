"use client"
import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, RotateCcw } from 'lucide-react';

function App() {
  const dhikrPhrases = [
    { text: "أستغفر الله", transliteration: "Astaghfirullah", count: 0 },
    { text: "سبحان الله", transliteration: "Subhanallah", count: 0 },
    { text: "الحمد لله", transliteration: "Alhamdulillah", count: 0 },
    { text: "الله أكبر", transliteration: "Allahu Akbar", count: 0 },
    { text: "لا إله إلا الله", transliteration: "La ilaha illallah", count: 0 }
  ];

  const [dhikrs, setDhikrs] = useState(dhikrPhrases);
  const [totalCount, setTotalCount] = useState(0);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState(null);
  const [recognition, setRecognition] = useState(null);
  const [lastDetectedPhrases, setLastDetectedPhrases] = useState({});

  useEffect(() => {
    if (typeof window !== "undefined" && "webkitSpeechRecognition" in window) {
      const recognition = new window.webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "ar-SA"; // Arabic language
      setRecognition(recognition);

      recognition.onstart = () => {
        setListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setListening(false);
        // Only restart if we're supposed to be listening
        if (listening) {
          try {
            recognition.start();
          } catch (error) {
            console.error('Speech recognition restart error:', error);
          }
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'not-allowed') {
          setError('Please allow microphone access to use this feature.');
        } else {
          setError('An error occurred with speech recognition.');
        }
        setListening(false);
      };

      recognition.onresult = (event) => {
        const results = Array.from(event.results);
        const lastResult = results[results.length - 1];
        
        // Only process if it's a final result
        if (lastResult.isFinal) {
          const transcript = lastResult[0].transcript.trim();
          console.log("Detected:", transcript);
          
          const currentTime = Date.now();
          
          dhikrs.forEach((dhikr, index) => {
            const matchesArabic = transcript.includes(dhikr.text);
            const matchesTransliteration = transcript.toLowerCase().includes(dhikr.transliteration.toLowerCase());
            
            if (matchesArabic || matchesTransliteration) {
              const lastDetectionTime = lastDetectedPhrases[dhikr.text] || 0;
              const timeSinceLastDetection = currentTime - lastDetectionTime;
              
              // Only count if more than 2 seconds have passed since last detection of this specific phrase
              if (timeSinceLastDetection > 2000) {
                setDhikrs(prevDhikrs => {
                  const newDhikrs = [...prevDhikrs];
                  newDhikrs[index] = {
                    ...newDhikrs[index],
                    count: newDhikrs[index].count + 1
                  };
                  return newDhikrs;
                });
                setTotalCount(prev => prev + 1);
                
                // Update the last detection time for this specific phrase
                setLastDetectedPhrases(prev => ({
                  ...prev,
                  [dhikr.text]: currentTime
                }));
              }
            }
          });
        }
      };
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser.');
      return;
    }

    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      try {
        recognition.start();
        setLastDetectedPhrases({}); // Reset detection history when starting new session
      } catch (error) {
        console.error('Speech recognition error:', error);
      }
    }
  };

  const resetCounter = () => {
    setDhikrs(dhikrs.map(dhikr => ({ ...dhikr, count: 0 })));
    setTotalCount(0);
    setLastDetectedPhrases({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-purple-200 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-7 w-full max-w-md">
        <div className="text-center">

          
          <div className="bg-purple-50 rounded-xl p-6 mb-6">
            <div className="text-6xl font-bold text-purple-600 mb-2">
              {totalCount}
            </div>
            <p className="text-sm text-purple-500">Total Count</p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <ul className="space-y-3">
              {dhikrs.map((dhikr, index) => (
                <li key={index} className="flex justify-between items-center text-sm">
                  <div className="text-right flex gap-2 items-center">
                    <span className="text-gray-700 text-lg" style={{ fontFamily: 'Arial' }}>{dhikr.text}</span>
                    
                    <span className="text-gray-500 text-xs">{dhikr.transliteration}</span>
                  </div>
                  <span className="bg-purple-100 text-purple-600 px-3 py-1 rounded-full font-medium">
                    {dhikr.count}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center gap-4 mb-6">
            <button
              onClick={toggleListening}
              className={`relative inline-flex items-center justify-center p-4 rounded-full transition-all duration-300 ${
                listening
                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
              }`}
            >
              {listening ? (
                <>
                  <MicOff className="w-6 h-6" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
                </>
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </button>

            <button
              onClick={resetCounter}
              className="inline-flex items-center justify-center p-4 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all duration-300"
            >
              <RotateCcw className="w-6 h-6" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-2 text-sm">
            <Volume2 className="w-4 h-4 text-purple-600" />
            <span className="text-gray-600">
              {listening ? 'Listening...' : 'Click mic to start'}
            </span>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;