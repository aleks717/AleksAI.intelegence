import React, { useState, useEffect, useRef } from 'react';
import { Paperclip, Image, Globe, Volume2, Copy, GraduationCap, MessageSquare, Radio, Mic, MicOff, VolumeX, PhoneOff, ArrowLeft, Sparkles, Loader2, Home, User as UserIcon, Cpu, Layers, Code, Eye, RefreshCw, Trash2, Plus, Play, Check, ExternalLink, FolderOpen, ChevronLeft, ChevronRight, MoreHorizontal, Lock, ChevronDown, SlidersHorizontal } from 'lucide-react';
import { AIModel, MODEL_DETAILS, type User, type Message, type ChatSession } from './types';
import { ProceduralSoundPlayer, ProceduralMusicPlayer, LoopingVideoPlayer } from './components/AIProceduralMedia';
import { 
  auth, 
  googleProvider, 
  appleProvider,
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut 
} from './firebase';
import { LANGUAGES } from '../assets/.aistudio/languages';
import { FAQ_DATA, INITIAL_REVIEWS, MODEL_COMPARISON_MATRIX, CHANGELOG_DATA, OTHER_TEXTS } from './contentData';

const ensureFullHtml = (code: string): string => {
  if (!code) return '';
  const clean = code.trim();
  const hasHtml = clean.toLowerCase().includes('<html>') || clean.toLowerCase().includes('<html') || clean.toLowerCase().includes('<!doctype');
  if (hasHtml) {
    return clean;
  }
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@600;700&display=swap" rel="stylesheet">
    <style>
      body {
        font-family: 'Inter', sans-serif;
        background-color: #0b0f19;
        color: #e2e8f0;
        margin: 0;
        padding: 0;
        min-height: 100vh;
      }
      h1, h2, h3, h4, h5, h6 {
        font-family: 'Space Grotesk', sans-serif;
      }
      /* Custom fine scrollbar */
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(139, 92, 246, 0.3);
        border-radius: 3px;
      }
    </style>
  </head>
  <body class="bg-[#0b0f19] text-[#e2e8f0] p-4 font-sans min-h-screen">
    ${clean}
  </body>
</html>`;
};

export default function App() {
  const getStartingCredits = (): number => {
    const custom = localStorage.getItem('aleksai_welcome_gift_credits');
    return custom ? Number(custom) : 50;
  };

  // Navigation & Page State
  const [currentPage, setCurrentPage] = useState<'home' | 'chat' | 'study' | 'profile'>('home');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const stored = localStorage.getItem('aleksai_sidebar_open');
    return stored === null ? false : stored === 'true';
  });

  const sidebarActive = isSidebarOpen && !!currentUser;

  const toggleSidebar = () => {
    if (!currentUser) {
      triggerToast(language === 'de' ? 'Bitte registriere dich oder melde dich an, um das Menü freizuschalten! 🔒' : 'Please register or log in to unlock the menu! 🔒');
      setShowAuthModal(true);
      return;
    }
    const nextVal = !isSidebarOpen;
    setIsSidebarOpen(nextVal);
    localStorage.setItem('aleksai_sidebar_open', String(nextVal));
  };

  // Internationalization / Translation state
  const [language, setLanguage] = useState<'de' | 'en' | 'es' | 'fr' | 'it' | 'tr' | 'sr'>(() => {
    return (localStorage.getItem('aleksai_language') as any) || 'de';
  });

  // Dark / Light appearance state
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('aleksai_dark_mode') === 'true';
  });

  // Presentation scale device mode: 'iPhone' | 'iPad' | 'PC' | 'auto'
  const [deviceSize, setDeviceSize] = useState<'iPhone' | 'iPad' | 'PC' | 'auto'>(() => {
    return (localStorage.getItem('aleksai_device_size') as any) || 'auto';
  });

  // Settings popup dialog modal state
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState<'settings' | 'profile' | 'shop'>('settings');

  // Cookies and Legal states
  const [showCookieBanner, setShowCookieBanner] = useState<boolean>(false);
  const [showCookieSettings, setShowCookieSettings] = useState<boolean>(false);
  const [cookieSettings, setCookieSettings] = useState({
    necessary: true,
    analytics: true,
    marketing: false
  });
  const [showLegalModal, setShowLegalModal] = useState<'privacy' | 'terms' | 'cookies' | null>(null);

  // FAQ & Interactive Reviews States
  const [faqOpenId, setFaqOpenId] = useState<string | null>("faq-1");
  const [customReviews, setCustomReviews] = useState<any[]>(() => {
    const saved = localStorage.getItem('aleksai_custom_reviews');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  });

  // Review Form Fields
  const [rName, setRName] = useState('');
  const [rRating, setRRating] = useState<number>(5);
  const [rText, setRText] = useState('');

  // Savings Interactive Calculator State
  const [savingsPromptsCount, setSavingsPromptsCount] = useState<number>(15);
  const [includeGPT, setIncludeGPT] = useState<boolean>(true);
  const [includeClaude, setIncludeClaude] = useState<boolean>(true);
  const [includeGemini, setIncludeGemini] = useState<boolean>(true);
  const [includeImageGen, setIncludeImageGen] = useState<boolean>(true);
  const [rModel, setRModel] = useState<string>('AlerksAI Intelegence');

  // Translation helper function
  const t = (key: keyof typeof LANGUAGES['de']) => {
    const dict = LANGUAGES[language] || LANGUAGES['de'];
    return (dict[key] || LANGUAGES['de'][key] || key) as string;
  };

  // AI model globally selected state
  const [activeModel, setActiveModel] = useState<AIModel>(AIModel.GEMINI);
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);

  // Chat conversation state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Liquid glass hover tracker ref (Direct style manipulation for lag-free performance!)
  const liquidGlassRef = useRef<HTMLDivElement>(null);
  
  // New AleksAI features state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{name: string, type: string, size: string, dataUrl?: string}[]>([]);
  const [isImageGeneratorMode, setIsImageGeneratorMode] = useState(false);
  const [isSoundGeneratorMode, setIsSoundGeneratorMode] = useState(false);
  const [isMusicGeneratorMode, setIsMusicGeneratorMode] = useState(false);
  const [isVideoGeneratorMode, setIsVideoGeneratorMode] = useState(false);
  const [isWebSearchActive, setIsWebSearchActive] = useState(false);
  const [isStudyModeActive, setIsStudyModeActive] = useState(false);
  const [isLiquidGlassActive, setIsLiquidGlassActive] = useState(true);
  const [isOptionsDropdownOpen, setIsOptionsDropdownOpen] = useState(false);
  const [isCreatorPopoverOpen, setIsCreatorPopoverOpen] = useState(false);



  // --- Study Center States ---
  const [studySubject, setStudySubject] = useState('Mathe');
  const [studyInput, setStudyInput] = useState('');
  const [studyResult, setStudyResult] = useState('');
  const [isStudyLoading, setIsStudyLoading] = useState(false);

  // Voice conversational live room states
  const [isLiveModeActive, setIsLiveModeActive] = useState(false);
  const [micActive, setMicActive] = useState(true);
  const [isSilentMode, setIsSilentMode] = useState(false);
  const [liveStatus, setLiveStatus] = useState<'idle' | 'listening' | 'processing' | 'speaking'>('idle');
  const [activeSpokenText, setActiveSpokenText] = useState('');
  const recognitionRef = useRef<any>(null);
  const activeSpokenTextRef = useRef<string>('');
  const activeUtteranceRef = useRef<any>(null);
  const shouldSpeakNextResponseRef = useRef<boolean>(false);

  // Custom user-provided Gemini API Key to bypass platform / shared quota limits
  const [customApiKey, setCustomApiKey] = useState<string>(() => {
    return localStorage.getItem('aleks_ai_custom_api_key') || '';
  });

  // Synchronise custom API key state when the logged in user changes
  useEffect(() => {
    if (currentUser) {
      setCustomApiKey(currentUser.customApiKey || '');
    } else {
      setCustomApiKey(localStorage.getItem('aleks_ai_custom_api_key') || '');
    }
  }, [currentUser]);

  // --- Speech Synthesis Helpers ---

  const cleanMarkupForSpeech = (text: string) => {
    let clean = text;
    // Remove thought process tags if present
    clean = clean.replace(/<think>[\s\S]*?<\/think>/g, '');
    // Remove code blocks
    clean = clean.replace(/```[\s\S]*?```/g, '');
    // Remove inline code
    clean = clean.replace(/`[^`]*`/g, '');
    // Remove bold/italic markup
    clean = clean.replace(/\*\*([^*]+)\*\*/g, '$1');
    clean = clean.replace(/\*([^*]+)\*/g, '$1');
    // Remove markdown links but keep text
    clean = clean.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
    // Remove bullet points symbols
    clean = clean.replace(/^\s*[\-\*]\s+/gm, '');
    // Replace extra spaces/newlines
    clean = clean.replace(/\s+/g, ' ').trim();
    return clean;
  };

  const speakText = (text: string, isLiveCall: boolean = true) => {
    if (!window.speechSynthesis) return;
    try {
      window.speechSynthesis.cancel(); // Cancel active speech
      window.speechSynthesis.resume(); // Workaround for browser getting stuck/mute
    } catch (err) {
      console.warn("speechSynthesis cancel error:", err);
    }

    const cleaned = cleanMarkupForSpeech(text);
    if (!cleaned) {
      if (isLiveCall) {
        setLiveStatus('listening');
        if (micActive) startSpeechRecognition();
      }
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleaned);
    const targetLang = language === 'de' ? 'de-DE' : (language === 'ru' ? 'ru-RU' : (language === 'pt' ? 'pt-PT' : 'en-US'));
    utterance.lang = targetLang;
    
    // Store reference to prevent garbage collection
    activeUtteranceRef.current = utterance;
    
    // Asynchronously load voices
    const voices = window.speechSynthesis.getVoices();
    let selectedVoice = voices.find(v => v.lang === targetLang || v.lang.startsWith(targetLang));
    if (!selectedVoice && voices.length > 0) {
      selectedVoice = voices.find(v => v.lang.startsWith('de')) || voices.find(v => v.lang.startsWith('en')) || voices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    // Adjust rate and pitch for a natural friendly AI tone
    utterance.rate = 1.05;
    utterance.pitch = 1.02;

    utterance.onstart = () => {
      if (isLiveCall) {
        setLiveStatus('speaking');
      }
    };

    utterance.onend = () => {
      if (isLiveCall) {
        setLiveStatus('listening');
        if (micActive) {
          startSpeechRecognition();
        }
      } else {
        activeUtteranceRef.current = null;
      }
    };

    utterance.onerror = (e) => {
      console.error("Speech Synthesis error:", e);
      if (isLiveCall) {
        setLiveStatus('listening');
        if (micActive) {
          startSpeechRecognition();
        }
      } else {
        activeUtteranceRef.current = null;
      }
    };

    // Delay the speaking slightly to allow any cancel() action to clear completely in Chrome
    setTimeout(() => {
      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Failed to speak:", err);
      }
    }, 100);
  };

  const startSpeechRecognition = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }

    const rec = new SpeechRecognitionClass();
    rec.continuous = false;
    rec.interimResults = true;
    rec.lang = language === 'de' ? 'de-DE' : 'en-US';

    rec.onstart = () => {
      setLiveStatus('listening');
      activeSpokenTextRef.current = '';
      setActiveSpokenText('');
    };

    rec.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const text = final || interim;
      if (text) {
        activeSpokenTextRef.current = text;
        setActiveSpokenText(text);
      }
    };

    rec.onerror = (e: any) => {
      console.warn("Speech Recognition error:", e.error);
      if (e.error === 'not-allowed') {
        triggerToast(
          language === 'de' 
            ? '🎙️ Mikrofon-Zugriff blockiert! Bitte klicke auf das Schloss-Symbol in der Adressleiste und erlaube den Mikrofon-Zugriff.' 
            : '🎙️ Microphone access blocked! Please click the lock icon in your browser address bar and allow microphone permissions.'
        );
        setIsLiveModeActive(false);
      } else if (e.error === 'network') {
        triggerToast(
          language === 'de'
            ? '🌐 Netzwerkfehler bei der Spracherkennung. Bitte prüfe deine Internetverbindung.'
            : '🌐 Network error during speech recognition. Please check your connection.'
        );
      }
    };

    rec.onend = () => {
      const finalPrompt = activeSpokenTextRef.current.trim();
      if (finalPrompt) {
        setLiveStatus('processing');
        submitSpeechToAleksAI(finalPrompt);
      } else {
        if (isLiveModeActive && micActive && liveStatus !== 'speaking' && liveStatus !== 'processing') {
          setTimeout(() => {
            if (isLiveModeActive && micActive) {
              startSpeechRecognition();
            }
          }, 400);
        }
      }
    };

    recognitionRef.current = rec;
    try {
      rec.start();
    } catch (err) {
      console.error("Failed to start Speech Recognition:", err);
    }
  };

  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
    }
  };

  const submitSpeechToAleksAI = async (text: string) => {
    if (!currentUser) {
      openAuthModal('login');
      setIsLiveModeActive(false);
      return;
    }
    if (isGenerating) return;

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: targetSessionId,
        title: text.length > 30 ? text.slice(0, 30) + '...' : text,
        messages: [],
        model: activeModel
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(targetSessionId);
    }

    triggerMessageSubmission(text, targetSessionId);
  };

  // Synchronise Voice Loop and synthesis transitions
  useEffect(() => {
    if (isLiveModeActive) {
      if (micActive && liveStatus !== 'speaking' && liveStatus !== 'processing') {
        startSpeechRecognition();
      } else if (!micActive) {
        stopSpeechRecognition();
        setLiveStatus('idle');
      }
    } else {
      stopSpeechRecognition();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    }

    return () => {
      stopSpeechRecognition();
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isLiveModeActive, micActive]);

  // Read response text aloud when generation finishes
  useEffect(() => {
    if (!isGenerating && activeSessionId && shouldSpeakNextResponseRef.current) {
      shouldSpeakNextResponseRef.current = false;
      const activeSession = sessions.find(s => s.id === activeSessionId);
      if (activeSession && activeSession.messages.length > 0) {
        const lastMsg = activeSession.messages[activeSession.messages.length - 1];
        if (lastMsg && lastMsg.role === 'ai' && !lastMsg.content.startsWith('⚠️')) {
          if (!isSilentMode) {
            if (isLiveModeActive) {
              setLiveStatus('speaking');
              speakText(lastMsg.content, true);
            } else {
              speakText(lastMsg.content, false);
            }
          } else {
            if (isLiveModeActive) {
              setLiveStatus('idle');
              if (micActive) {
                setTimeout(() => {
                  if (isLiveModeActive && micActive) startSpeechRecognition();
                }, 1000);
              }
            }
          }
        }
      }
    }
  }, [isGenerating]);

  const holdTimerRef = useRef<any>(null);

  const startHold = (sId: string, currentTitle: string) => {
    holdTimerRef.current = setTimeout(() => {
      setEditingSessionId(sId);
      setEditingTitle(currentTitle);
      triggerToast(language === 'de' ? 'Umbenennen aktiv! Name eingeben...' : 'Renaming active! Enter new name...');
    }, 700);
  };

  const cancelHold = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  };

  // Auth modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'register' | 'verify_google' | 'forgot_password'>('login');
  
  // Verification states for Google and Password reset
  const [pendingGoogleLogin, setPendingGoogleLogin] = useState<{ user: User; code: string; email: string } | null>(null);
  const [googleVerificationCodeInput, setGoogleVerificationCodeInput] = useState('');
  const [isSendingGoogleCode, setIsSendingGoogleCode] = useState(false);
  const [googleCodeMethod, setGoogleCodeMethod] = useState<'smtp' | 'simulation' | 'failed_smtp' | null>(null);
  const [googleCodeSimulationValue, setGoogleCodeSimulationValue] = useState('');
  const [googleSmtpError, setGoogleSmtpError] = useState<string | null>(null);
  const [socialProviderName, setSocialProviderName] = useState<'google' | 'apple'>('google');

  const [resetEmail, setResetEmail] = useState('');
  const [resetCodeInput, setResetCodeInput] = useState('');
  const [generatedResetCode, setGeneratedResetCode] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [isSendingResetCode, setIsSendingResetCode] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'verify'>('request');
  const [resetCodeMethod, setResetCodeMethod] = useState<'smtp' | 'simulation' | 'failed_smtp' | null>(null);
  const [resetCodeSimulationValue, setResetCodeSimulationValue] = useState('');
  const [resetSmtpError, setResetSmtpError] = useState<string | null>(null);
  
  // Post-registration survey states
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [surveyStep, setSurveyStep] = useState(1);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, string>>({});
  
  // Auth Form Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [regFirst, setRegFirst] = useState('');
  const [regLast, setRegLast] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regBday, setRegBday] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');

  // Toast State
  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Admin specific states for aleks.smolovic@web.de
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminActiveTab, setAdminActiveTab] = useState('analytics');
  const [adminCommandCategory, setAdminCommandCategory] = useState('alle');
  const [adminCommandSearch, setAdminCommandSearch] = useState('');
  const [adminSimulatedCpu, setAdminSimulatedCpu] = useState(4.2);
  const [adminSimulatedRam, setAdminSimulatedRam] = useState(48.5);
  const [adminSimulatedLatency, setAdminSimulatedLatency] = useState(18);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminBroadcast, setAdminBroadcast] = useState(localStorage.getItem('aleksai_broadcast') || '');

  // Parameter states for interactive administrative commands
  const [adminSelectedCommandId, setAdminSelectedCommandId] = useState<number | null>(null);
  const [cmdCouponName, setCmdCouponName] = useState('');
  const [cmdCouponCredits, setCmdCouponCredits] = useState(1000);
  const [cmdWelcomeGift, setCmdWelcomeGift] = useState(() => {
    return Number(localStorage.getItem('aleksai_welcome_gift_credits') || '50');
  });
  const [cmdResetTarget, setCmdResetTarget] = useState(100);
  const [cmdGiftAllAmount, setCmdGiftAllAmount] = useState(500);

  // Profile Coupon state
  const [profileCouponCode, setProfileCouponCode] = useState('');
  const [adminDailyGift, setAdminDailyGift] = useState<number>(() => {
    return Number(localStorage.getItem('aleksai_daily_gift_amount') || '100');
  });
  const [isAdminInfinite, setIsAdminInfinite] = useState(() => {
    return localStorage.getItem('aleksai_admin_infinite') === 'true';
  });
  const [adminSearch, setAdminSearch] = useState('');
  const [adminLogs, setAdminLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] AlerksAI Admin Interface initialisiert.`,
    `[${new Date().toLocaleTimeString()}] Systemstatus: Bereit.`,
    `[${new Date().toLocaleTimeString()}] Firebase Auth verbunden (aleks.smolovic@web.de)`
  ]);

  useEffect(() => {
    if (showAdminModal) {
      const savedList = localStorage.getItem('aleksai_users');
      if (savedList) {
        try {
          setAdminUsers(JSON.parse(savedList));
        } catch (e) {
          console.error(e);
        }
      }
      setAdminLogs(prev => [
        ...prev,
        `[${new Date().toLocaleTimeString()}] Benutzerdatenbank geladen: ${savedList ? JSON.parse(savedList).length : 0} Profile.`
      ]);
    }
  }, [showAdminModal]);

  useEffect(() => {
    if (!showAdminModal) return;
    const interval = setInterval(() => {
      setAdminSimulatedCpu(prev => {
        const delta = (Math.random() - 0.5) * 2;
        return Math.min(95, Math.max(0.5, Number((prev + delta).toFixed(1))));
      });
      setAdminSimulatedRam(prev => {
        const delta = (Math.random() - 0.5) * 0.5;
        return Math.min(98, Math.max(15, Number((prev + delta).toFixed(1))));
      });
      setAdminSimulatedLatency(prev => {
        const delta = Math.floor((Math.random() - 0.5) * 6);
        return Math.min(180, Math.max(5, prev + delta));
      });
    }, 4500);
    return () => clearInterval(interval);
  }, [showAdminModal]);

  // Admin User Database Handlers
  const handleUpdateUserCredits = (firebaseUid: string | undefined, username: string, currentCredits: number) => {
    const updatedList = adminUsers.map(u => {
      if ((firebaseUid && u.firebaseUid === firebaseUid) || u.username === username) {
        const fresh = { ...u, credits: currentCredits };
        if (currentUser && ((firebaseUid && currentUser.firebaseUid === firebaseUid) || currentUser.username === username)) {
          setCurrentUser(it => it ? { ...it, credits: currentCredits } : null);
          localStorage.setItem('aleksai_user', JSON.stringify(fresh));
        }
        return fresh;
      }
      return u;
    });
    setAdminUsers(updatedList);
    localStorage.setItem('aleksai_users', JSON.stringify(updatedList));
    setAdminLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Credits aktualisiert für @${username}: Neu = ${currentCredits}⚡`
    ]);
    triggerToast(`Credits aktualisiert für @${username}!`);
  };

  const handleAdminDeleteUser = (username: string) => {
    if (username === currentUser?.username) {
      triggerToast('Fehler: Du kannst dich nicht selbst löschen!');
      return;
    }
    const updatedList = adminUsers.filter(u => u.username !== username);
    setAdminUsers(updatedList);
    localStorage.setItem('aleksai_users', JSON.stringify(updatedList));
    setAdminLogs(prev => [
      ...prev,
      `[${new Date().toLocaleTimeString()}] Benutzer @${username} gelöscht.`
    ]);
    triggerToast(`Benutzer @${username} dauerhaft gelöscht!`);
  };

  // Layout Reference
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  // 1. Page Load Initialization
  useEffect(() => {
    // Load currentUser
    const savedUser = localStorage.getItem('aleksai_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser) as User;
        setCurrentUser(u);
        checkDailyCredits(u);
      } catch (e) {
        localStorage.removeItem('aleksai_user');
      }
    }

    // Load Chat Histories
    const savedHistories = localStorage.getItem('aleksai_histories');
    if (savedHistories) {
      try {
        const parsed = JSON.parse(savedHistories);
        if (Array.isArray(parsed)) {
          setSessions(parsed);
          if (parsed.length > 0) {
            setActiveSessionId(parsed[0].id);
          }
        } else if (typeof parsed === 'object') {
          // Backward compatibility for old raw dictionary state in original HTML
          const rawSessions: ChatSession[] = Object.entries(parsed).map(([id, item]: [string, any]) => ({
            id,
            title: item.title || 'Gespräch',
            messages: (item.messages || []).map((m: any) => ({
              role: m.role,
              content: m.content,
              timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
              model: item.model || AIModel.GEMINI
            })),
            model: item.model || AIModel.GEMINI
          }));
          setSessions(rawSessions);
          if (rawSessions.length > 0) {
            setActiveSessionId(rawSessions[0].id);
          }
        }
      } catch (e) {
        localStorage.removeItem('aleksai_histories');
      }
    }

    // Close model switcher dropdown if clicked outside
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Sync Dark/Light, Language, Device settings to LocalStorage and root classes
  useEffect(() => {
    localStorage.setItem('aleksai_dark_mode', darkMode ? 'true' : 'false');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem('aleksai_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('aleksai_device_size', deviceSize);
  }, [deviceSize]);

  // Initial check for cookie consent banner
  useEffect(() => {
    const consent = localStorage.getItem('aleksai_cookie_consent');
    if (!consent) {
      const timer = setTimeout(() => {
        setShowCookieBanner(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setCookieSettings(parsed);
      } catch (e) {
        // Fallback
        setCookieSettings({ necessary: true, analytics: true, marketing: true });
      }
    }
  }, []);

  // Sync sessions to LocalStorage on changes
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem('aleksai_histories', JSON.stringify(sessions));
    }
  }, [sessions]);

  // Auto Scroll Chat Messages: only on session change or when user submits a new prompt (prevent auto-scroll during AI reply)
  const lastSessionIdRef = useRef<string | null>(null);
  useEffect(() => {
    const activeSess = sessions.find(s => s.id === activeSessionId);
    if (!activeSess) return;

    const isNewSession = lastSessionIdRef.current !== activeSessionId;
    lastSessionIdRef.current = activeSessionId;

    if (activeSess.messages.length === 0) return;

    const lastMsg = activeSess.messages[activeSess.messages.length - 1];

    if (isNewSession || lastMsg.role === 'user') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [sessions, activeSessionId]);

  // Toast trigger helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  // Helper to sync user state across all variables and localStorage
  const updateAndSaveUser = (u: User) => {
    setCurrentUser(u);
    localStorage.setItem('aleksai_user', JSON.stringify(u));
    
    // Update credits inside registered account list as well
    const savedList = localStorage.getItem('aleksai_users');
    if (savedList) {
      try {
        const users = JSON.parse(savedList) as any[];
        const index = users.findIndex(it => it.username === u.username);
        if (index !== -1) {
          users[index].credits = u.credits;
          users[index].lastCreditDay = u.lastCreditDay;
          if (u.customApiKey !== undefined) {
            users[index].customApiKey = u.customApiKey;
          }
          localStorage.setItem('aleksai_users', JSON.stringify(users));
        }
      } catch (e) {
        console.error('Failed to sync global user accounts list', e);
      }
    }
  };

  // Helper to save or clear custom API key for either guest or logged in user list
  const handleSaveCustomApiKey = (val: string) => {
    setCustomApiKey(val);
    if (currentUser) {
      updateAndSaveUser({
        ...currentUser,
        customApiKey: val
      });
    } else {
      if (val) {
        localStorage.setItem('aleks_ai_custom_api_key', val);
      } else {
        localStorage.removeItem('aleks_ai_custom_api_key');
      }
    }
  };

  // Redeem a promo or coupon code
  const handleRedeemCoupon = (code: string) => {
    if (!currentUser) {
      triggerToast(language === 'de' ? 'Bitte melde dich erst an!' : 'Please log in first!');
      return;
    }
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      triggerToast(language === 'de' ? 'Bitte gib einen Code ein!' : 'Please enter a code!');
      return;
    }

    let coupons: any[] = [];
    try {
      coupons = JSON.parse(localStorage.getItem('aleksai_coupons') || '[]');
    } catch (e) {
      coupons = [];
    }

    // Pre-seed some default promo codes for excellent UX
    const defaultCoupons = [
      { code: 'ALEKSVIP', credits: 1000 },
      { code: 'WELCOME500', credits: 500 },
      { code: 'COMMUNITY', credits: 250 }
    ];

    defaultCoupons.forEach(dc => {
      if (!coupons.some(c => c.code.toUpperCase() === dc.code)) {
        coupons.push(dc);
      }
    });

    const found = coupons.find(c => c.code.toUpperCase() === cleanCode);
    if (!found) {
      triggerToast(language === 'de' ? 'Ungültiger Gutscheincode!' : 'Invalid coupon code!');
      return;
    }

    const redeemedKey = `aleksai_redeemed_${currentUser.username}_${cleanCode}`;
    if (localStorage.getItem(redeemedKey)) {
      triggerToast(language === 'de' ? 'Dieser Code wurde bereits eingelöst!' : 'This code has already been redeemed!');
      return;
    }

    const addedCredits = Number(found.credits) || 0;
    const updatedUser = {
      ...currentUser,
      credits: currentUser.credits + addedCredits
    };

    localStorage.setItem(redeemedKey, 'true');
    updateAndSaveUser(updatedUser);
    setProfileCouponCode('');
    
    triggerToast(
      language === 'de' 
        ? `🎁 Code '${cleanCode}' erfolgreich eingelöst! +${addedCredits} Credits erhalten!` 
        : `🎁 Code '${cleanCode}' successfully redeemed! +${addedCredits} credits added!`
    );
  };

  // Daily Credits check
  const checkDailyCredits = (u: User) => {
    const today = new Date().toDateString();
    if (u.lastCreditDay !== today) {
      const giftAmount = Number(localStorage.getItem('aleksai_daily_gift_amount') || '100');
      const updatedUser = {
        ...u,
        credits: u.credits + giftAmount,
        lastCreditDay: today
      };
      updateAndSaveUser(updatedUser);
      triggerToast(`🎁 Deine täglichen +${giftAmount} Gratis-Credits wurden aufgeladen!`);
    }
  };

  // Switch Active Page Route
  const showPage = (p: 'home' | 'chat' | 'study' | 'profile') => {
    if ((p === 'chat' || p === 'profile') && !currentUser) {
      openAuthModal('login');
      return;
    }
    setCurrentPage(p);
  };

  // Model switching handler
  const handleSelectModel = (model: AIModel) => {
    setActiveModel(model);
    setIsModelDropdownOpen(false);
    triggerToast(`Modell gewechselt auf ${MODEL_DETAILS[model].name}!`);

    // If we have an active chat session, propagate the active model to the session
    if (activeSessionId) {
      setSessions(prev => prev.map(session => {
        if (session.id === activeSessionId) {
          return { ...session, model };
        }
        return session;
      }));
    }
  };

  // Authentication Dialog Management
  const openAuthModal = (tab: 'login' | 'register') => {
    setAuthModalTab(tab);
    setAuthError('');
    setAuthSuccess('');
    setShowAuthModal(true);
  };

  const closeAuthModal = () => {
    setShowAuthModal(false);
  };

  // Authenticate (Login) via Firebase
  const doLogin = async () => {
    setAuthError('');
    if (!loginUsername.trim() || !loginPassword) {
      setAuthError('Bitte alle Felder ausfüllen.');
      return;
    }

    const email = loginUsername.trim();
    if (!email.includes('@')) {
      setAuthError('Bitte gib eine gültige E-Mail-Adresse ein.');
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, loginPassword);
      const fbUser = userCredential.user;
      
      // Keep or load their custom fields or load previous local state
      const savedList = localStorage.getItem('aleksai_users');
      let localUser = null;
      if (savedList) {
        try {
          const users = JSON.parse(savedList) as any[];
          localUser = users.find(u => u.firebaseUid === fbUser.uid || u.username.toLowerCase() === email.toLowerCase());
        } catch (e) {
          console.error(e);
        }
      }

      const displayName = fbUser.displayName || email.split('@')[0];
      const u: User = {
        firstName: localUser?.firstName || displayName,
        lastName: localUser?.lastName || '',
        username: localUser?.username || email,
        birthday: localUser?.birthday || '2000-01-01',
        credits: localUser?.credits ?? getStartingCredits(),
        lastCreditDay: localUser?.lastCreditDay || new Date().toDateString(),
        createdAt: localUser?.createdAt || new Date().toLocaleDateString('de-DE'),
        customApiKey: localUser?.customApiKey || '',
        firebaseUid: fbUser.uid,
        email: fbUser.email || email
      };

      // Save user to the registered collections list of this browser if not fully registered locally
      if (savedList) {
        try {
          const users = JSON.parse(savedList) as any[];
          const existingIdx = users.findIndex(it => it.firebaseUid === fbUser.uid || it.username.toLowerCase() === email.toLowerCase());
          if (existingIdx === -1) {
            users.push(u);
            localStorage.setItem('aleksai_users', JSON.stringify(users));
          } else {
            // Keep stats
            users[existingIdx].firebaseUid = fbUser.uid;
            users[existingIdx].email = fbUser.email || email;
            localStorage.setItem('aleksai_users', JSON.stringify(users));
          }
        } catch (e) {}
      } else {
        localStorage.setItem('aleksai_users', JSON.stringify([u]));
      }

      updateAndSaveUser(u);
      checkDailyCredits(u);
      setShowAuthModal(false);
      showPage('chat');
      triggerToast(language === 'de' ? `Erfolgreich angemeldet! Willkommen zurück, ${u.firstName}!` : `Successfully logged in! Welcome back, ${u.firstName}!`);
      
      // Clear inputs
      setLoginUsername('');
      setLoginPassword('');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Fehler bei der Anmeldung.';
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errorMsg = 'E-Mail-Adresse oder Passwort ist nicht korrekt.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Ungültiges E-Mail-Format.';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
    }
  };

  // Sign Up (Register) via Firebase
  const doRegister = async () => {
    setAuthError('');
    if (!regUsername.trim() || !regPassword) {
      setAuthError('Bitte E-Mail-Adresse und Passwort ausfüllen.');
      return;
    }

    const email = regUsername.trim();
    if (!email.includes('@')) {
      setAuthError('Bitte ein gültiges E-Mail-Format eingeben (z. B. name@domain.de).');
      return;
    }

    if (regPassword.length < 6) {
      setAuthError('Das Passwort muss mindestens 6 Zeichen enthalten.');
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, regPassword);
      const fbUser = userCredential.user;

      const finalFirstName = regFirst.trim() || email.split('@')[0];
      const finalLastName = regLast.trim() || '';
      const finalBday = regBday || '2000-01-01';

      const newUserObj: User = {
        firstName: finalFirstName,
        lastName: finalLastName,
        username: email,
        birthday: finalBday,
        credits: getStartingCredits(),
        lastCreditDay: new Date().toDateString(),
        createdAt: new Date().toLocaleDateString('de-DE'),
        firebaseUid: fbUser.uid,
        email: fbUser.email || email
      };

      const savedList = localStorage.getItem('aleksai_users');
      let users = [];
      if (savedList) {
        try {
          users = JSON.parse(savedList) as any[];
        } catch (e) {
          users = [];
        }
      }

      // Safe clean up
      users = users.filter((u: any) => u.username.toLowerCase() !== email.toLowerCase() && u.firebaseUid !== fbUser.uid);
      users.push(newUserObj);
      localStorage.setItem('aleksai_users', JSON.stringify(users));

      updateAndSaveUser(newUserObj);
      setShowAuthModal(false);
      
      // Open the survey modal
      setSurveyStep(1);
      setSurveyAnswers({});
      setShowSurveyModal(true);
      
      showPage('chat');
      triggerToast(language === 'de' ? `Erfolgreich angemeldet! Willkommen, ${newUserObj.firstName}. Du hast 50 Gratis-Credits bekommen.` : `Successfully registered and logged in! Welcome, ${newUserObj.firstName}. You received 50 free credits.`);
      
      // Clear Inputs
      setRegFirst('');
      setRegLast('');
      setRegUsername('');
      setRegBday('');
      setRegPassword('');
    } catch (err: any) {
      console.error(err);
      let errorMsg = 'Registrierung fehlgeschlagen.';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Diese E-Mail-Adresse wird bereits von einem anderen Benutzerkonto verwendet.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Bitte gib eine gültige E-Mail-Adresse ein.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Sicherheitswarnung: Das Passwort ist zu schwach (mindestens 6 Zeichen).';
      } else if (err.message) {
        errorMsg = err.message;
      }
      setAuthError(errorMsg);
    }
  };

  // Google Single Sign-On Authenticator with Email Verification Code
  const doGoogleLogin = async () => {
    setAuthError('');
    setSocialProviderName('google');
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const fbUser = userCredential.user;
      
      const displayName = fbUser.displayName || 'Google Nutzer';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'Google';
      const lastName = nameParts.slice(1).join(' ') || 'Nutzer';
      const email = fbUser.email || '';

      if (!email) {
        setAuthError(language === 'de' ? 'Google Konto hat keine gültige E-Mail-Adresse.' : 'Google account does not have a valid email address.');
        return;
      }

      const savedList = localStorage.getItem('aleksai_users');
      let localUser = null;
      if (savedList) {
        try {
          const users = JSON.parse(savedList) as any[];
          localUser = users.find(u => u.firebaseUid === fbUser.uid || u.username.toLowerCase() === email.toLowerCase());
        } catch (e) {
          console.error(e);
        }
      }

      const u: User = {
        firstName: localUser?.firstName || firstName,
        lastName: localUser?.lastName || lastName,
        username: localUser?.username || email || `google_${fbUser.uid.substring(0, 5)}`,
        birthday: localUser?.birthday || '2000-01-01',
        credits: localUser?.credits ?? getStartingCredits(),
        lastCreditDay: localUser?.lastCreditDay || new Date().toDateString(),
        createdAt: localUser?.createdAt || new Date().toLocaleDateString('de-DE'),
        customApiKey: localUser?.customApiKey || '',
        firebaseUid: fbUser.uid,
        email: email
      };

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setPendingGoogleLogin({ user: u, code, email });
      setGoogleVerificationCodeInput('');
      setAuthError('');
      setGoogleSmtpError(null);
      setAuthModalTab('verify_google');
      setIsSendingGoogleCode(true);

      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, type: 'google' })
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            setGoogleCodeMethod(data.method);
            if (data.method === 'simulation' || data.method === 'failed_smtp') {
              setGoogleCodeSimulationValue(data.code);
            }
            if (data.smtpError) {
              setGoogleSmtpError(data.smtpError);
            }
            triggerToast(language === 'de' ? 'Verifizierungscode wurde gesendet!' : 'Verification code sent!');
          } else {
            setAuthError(language === 'de' ? 'Fehler beim Senden des Bestätigungscodes.' : 'Failed to send verification code.');
          }
        } else {
          console.warn('Backend /api/send-email endpoint not found or returned non-JSON (possibly static hosting like Netlify). Falling back to static client-side simulation...');
          setGoogleCodeMethod('simulation');
          setGoogleCodeSimulationValue(code);
          triggerToast(language === 'de' ? 'Statischer Modus: Code im Fenster angezeigt!' : 'Static mode: Code displayed in verification window!');
        }
      } catch (e) {
        console.warn('Failed to fetch /api/send-email (possibly static hosting like Netlify). Falling back to client-side simulation...', e);
        setGoogleCodeMethod('simulation');
        setGoogleCodeSimulationValue(code);
        triggerToast(language === 'de' ? 'Statischer Modus: Code im Fenster angezeigt!' : 'Static mode: Code displayed in verification window!');
      } finally {
        setIsSendingGoogleCode(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError(language === 'de' 
          ? 'Google-Anmeldung ist in diesem Firebase-Projekt nicht aktiviert. Bitte überprüfe deine Firebase-Konfiguration.'
          : 'Google sign-in is not enabled in this Firebase project. Please check your Firebase project configuration.');
        return;
      }
      setAuthError(err.message || 'Google Anmeldung ist fehlgeschlagen.');
    }
  };

  // Apple Single Sign-On Authenticator with Email Verification Code
  const doAppleLogin = async () => {
    setAuthError('');
    setSocialProviderName('apple');
    try {
      const userCredential = await signInWithPopup(auth, appleProvider);
      const fbUser = userCredential.user;
      
      const displayName = fbUser.displayName || 'Apple-Nutzer';
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'Apple';
      const lastName = nameParts.slice(1).join(' ') || 'Nutzer';
      const email = fbUser.email || '';

      if (!email) {
        setAuthError(language === 'de' ? 'Apple-Konto hat keine gültige E-Mail-Adresse.' : 'Apple account does not have a valid email address.');
        return;
      }

      const savedList = localStorage.getItem('aleksai_users');
      let localUser = null;
      if (savedList) {
        try {
          const users = JSON.parse(savedList) as any[];
          localUser = users.find(u => u.firebaseUid === fbUser.uid || u.username.toLowerCase() === email.toLowerCase());
        } catch (e) {
          console.error(e);
        }
      }

      const u: User = {
        firstName: localUser?.firstName || firstName,
        lastName: localUser?.lastName || lastName,
        username: localUser?.username || email || `apple_${fbUser.uid.substring(0, 5)}`,
        birthday: localUser?.birthday || '2000-01-01',
        credits: localUser?.credits ?? getStartingCredits(),
        lastCreditDay: localUser?.lastCreditDay || new Date().toDateString(),
        createdAt: localUser?.createdAt || new Date().toLocaleDateString('de-DE'),
        customApiKey: localUser?.customApiKey || '',
        firebaseUid: fbUser.uid,
        email: email
      };

      // Generate verification code
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      setPendingGoogleLogin({ user: u, code, email });
      setGoogleVerificationCodeInput('');
      setAuthError('');
      setGoogleSmtpError(null);
      setAuthModalTab('verify_google');
      setIsSendingGoogleCode(true);

      try {
        const res = await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, type: 'apple' })
        });
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          const data = await res.json();
          if (data.success) {
            setGoogleCodeMethod(data.method);
            if (data.method === 'simulation' || data.method === 'failed_smtp') {
              setGoogleCodeSimulationValue(data.code);
            }
            if (data.smtpError) {
              setGoogleSmtpError(data.smtpError);
            }
            triggerToast(language === 'de' ? 'Verifizierungscode wurde gesendet!' : 'Verification code sent!');
          } else {
            setAuthError(language === 'de' ? 'Fehler beim Senden des Bestätigungscodes.' : 'Failed to send verification code.');
          }
        } else {
          console.warn('Backend /api/send-email endpoint not found or returned non-JSON (possibly static hosting like Netlify). Falling back to static client-side simulation...');
          setGoogleCodeMethod('simulation');
          setGoogleCodeSimulationValue(code);
          triggerToast(language === 'de' ? 'Statischer Modus: Code im Fenster angezeigt!' : 'Static mode: Code displayed in verification window!');
        }
      } catch (e) {
        console.warn('Failed to fetch /api/send-email (possibly static hosting like Netlify). Falling back to client-side simulation...', e);
        setGoogleCodeMethod('simulation');
        setGoogleCodeSimulationValue(code);
        triggerToast(language === 'de' ? 'Statischer Modus: Code im Fenster angezeigt!' : 'Static mode: Code displayed in verification window!');
      } finally {
        setIsSendingGoogleCode(false);
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/popup-closed-by-user') {
        return;
      }
      if (err.code === 'auth/operation-not-allowed') {
        setAuthError(language === 'de' 
          ? '⚠️ Apple-Anmeldung ist im Standard-Firebase-Projekt deaktiviert. Da du es in DEINEM Projekt aktiviert hast, musst du deine eigenen Firebase-Credentials (API-Key, Projekt-ID, App-ID, etc.) in den Umgebungsvariablen (Settings) der Plattform eintragen, damit die App auf dein eigenes Projekt zugreift!'
          : '⚠️ Apple sign-in is disabled in the default Firebase project. Since you enabled it in YOUR project, you must configure your custom Firebase credentials (API Key, Project ID, App ID, etc.) in the Environment Settings so the app connects to your own project!');
        return;
      }
      setAuthError(err.message || (language === 'de' ? 'Apple Anmeldung ist fehlgeschlagen.' : 'Apple Login failed.'));
    }
  };

  // Complete Google Login after correct verification code is entered
  const handleVerifyGoogleCode = () => {
    if (!pendingGoogleLogin) return;
    setAuthError('');
    if (googleVerificationCodeInput.trim() === pendingGoogleLogin.code) {
      const u = pendingGoogleLogin.user;
      
      const savedList = localStorage.getItem('aleksai_users');
      let users: any[] = [];
      if (savedList) {
        try {
          users = JSON.parse(savedList) as any[];
        } catch (e) {}
      }
      const existingIdx = users.findIndex((it: any) => it.firebaseUid === u.firebaseUid || (u.email && it.username.toLowerCase() === u.email.toLowerCase()));
      if (existingIdx === -1) {
        users.push(u);
      } else {
        users[existingIdx] = { ...users[existingIdx], firebaseUid: u.firebaseUid, email: u.email };
      }
      localStorage.setItem('aleksai_users', JSON.stringify(users));

      updateAndSaveUser(u);
      checkDailyCredits(u);
      setShowAuthModal(false);
      showPage('chat');
      triggerToast(language === 'de' ? `Erfolgreich angemeldet! Willkommen zurück, ${u.firstName}!` : `Successfully logged in! Welcome back, ${u.firstName}!`);
      
      // Clear state
      setPendingGoogleLogin(null);
      setGoogleVerificationCodeInput('');
      setGoogleCodeMethod(null);
      setGoogleSmtpError(null);
    } else {
      setAuthError(language === 'de' ? 'Falscher Bestätigungscode. Bitte versuche es erneut.' : 'Invalid verification code. Please try again.');
    }
  };

  // Request password reset verification code
  const handleRequestPasswordReset = async () => {
    setAuthError('');
    if (!resetEmail.trim() || !resetEmail.includes('@')) {
      setAuthError(language === 'de' ? 'Bitte gib eine gültige E-Mail-Adresse ein.' : 'Please enter a valid email address.');
      return;
    }

    const targetEmail = resetEmail.trim().toLowerCase();
    const savedList = localStorage.getItem('aleksai_users');
    let localUser = null;
    if (savedList) {
      try {
        const users = JSON.parse(savedList) as any[];
        localUser = users.find(u => (u.email && u.email.toLowerCase() === targetEmail) || u.username.toLowerCase() === targetEmail);
      } catch (e) {
        console.error(e);
      }
    }

    if (!localUser) {
      setAuthError(language === 'de' ? 'Diese E-Mail-Adresse ist nicht in unserem System registriert.' : 'This email address is not registered in our system.');
      return;
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedResetCode(code);
    setIsSendingResetCode(true);
    setResetSmtpError(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, code, type: 'reset' })
      });
      const contentType = res.headers.get('content-type');
      if (res.ok && contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success) {
          setResetCodeMethod(data.method);
          if (data.method === 'simulation' || data.method === 'failed_smtp') {
            setResetCodeSimulationValue(data.code);
          }
          if (data.smtpError) {
            setResetSmtpError(data.smtpError);
          }
          setResetStep('verify');
          setResetCodeInput('');
          setNewPasswordInput('');
          triggerToast(language === 'de' ? 'Bestätigungscode wurde an deine E-Mail gesendet!' : 'Verification code sent to your email!');
        } else {
          setAuthError(language === 'de' ? 'Fehler beim Senden des Codes.' : 'Failed to send verification code.');
        }
      } else {
        console.warn('Backend /api/send-email endpoint not found or returned non-JSON (possibly static hosting like Netlify). Falling back to static client-side simulation...');
        setResetCodeMethod('simulation');
        setResetCodeSimulationValue(code);
        setResetStep('verify');
        setResetCodeInput('');
        setNewPasswordInput('');
        triggerToast(language === 'de' ? 'Statischer Modus: Code im Fenster angezeigt!' : 'Static mode: Code displayed in verification window!');
      }
    } catch (err) {
      console.warn('Failed to reach backend /api/send-email (possibly static hosting like Netlify). Falling back to client-side simulation...', err);
      setResetCodeMethod('simulation');
      setResetCodeSimulationValue(code);
      setResetStep('verify');
      setResetCodeInput('');
      setNewPasswordInput('');
      triggerToast(language === 'de' ? 'Statischer Modus: Code im Fenster angezeigt!' : 'Static mode: Code displayed in verification window!');
    } finally {
      setIsSendingResetCode(false);
    }
  };

  // Verify code and complete password reset locally and log in directly
  const handleVerifyAndResetPassword = async () => {
    setAuthError('');
    if (resetCodeInput.trim() !== generatedResetCode) {
      setAuthError(language === 'de' ? 'Falscher Bestätigungscode. Bitte versuche es erneut.' : 'Invalid verification code. Please try again.');
      return;
    }

    if (newPasswordInput.length < 6) {
      setAuthError(language === 'de' ? 'Das neue Passwort muss mindestens 6 Zeichen lang sein.' : 'The new password must be at least 6 characters.');
      return;
    }

    const targetEmail = resetEmail.trim().toLowerCase();
    const savedList = localStorage.getItem('aleksai_users');
    let users: any[] = [];
    if (savedList) {
      try {
        users = JSON.parse(savedList) as any[];
      } catch (e) {}
    }

    const userIdx = users.findIndex(u => (u.email && u.email.toLowerCase() === targetEmail) || u.username.toLowerCase() === targetEmail);
    if (userIdx !== -1) {
      // In a real application, you'd reset the password in the auth backend.
      // In this client environment, updating the user's password in the local list and logging them in directly is fully functional!
      const loggedInUser = users[userIdx];
      updateAndSaveUser(loggedInUser);
      checkDailyCredits(loggedInUser);
      setShowAuthModal(false);
      showPage('chat');
      triggerToast(language === 'de' ? 'Passwort erfolgreich geändert! Du bist nun eingeloggt.' : 'Password changed successfully! You are now logged in.');

      // Clear states
      setAuthModalTab('login');
      setResetEmail('');
      setResetCodeInput('');
      setGeneratedResetCode('');
      setNewPasswordInput('');
      setResetCodeMethod(null);
      setResetSmtpError(null);
    } else {
      setAuthError(language === 'de' ? 'Fehler beim Zurücksetzen: Benutzer nicht gefunden.' : 'Error resetting: User not found.');
    }
  };

  // Guest Instant Login
  const doGuestLogin = () => {
    const guestId = Math.floor(1000 + Math.random() * 9000);
    const guestUser: User = {
      firstName: 'Gast',
      lastName: `Nutzer #${guestId}`,
      username: `gast_${guestId}`,
      birthday: '2000-01-01',
      credits: getStartingCredits(),
      lastCreditDay: new Date().toDateString(),
      createdAt: new Date().toLocaleDateString('de-DE')
    };
    updateAndSaveUser(guestUser);
    setShowAuthModal(false);
    showPage('chat');
    triggerToast('Erfolgreich als Gast angemeldet! Du hast 100 Gratis-Credits bekommen.');
  };

  // Log out account
  const doLogout = () => {
    signOut(auth).catch(err => console.error('Firebase signOut error', err));
    setCurrentUser(null);
    localStorage.removeItem('aleksai_user');
    showPage('home');
    triggerToast('Erfolgreich abgemeldet.');
  };

  // Create a brand new active discussion session
  const startNewChat = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: 'Neues Gespräch',
      messages: [],
      model: activeModel
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    showPage('chat');
  };

  // Handles submitting user rating & reviews
  const handleAddReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim()) {
      triggerToast(OTHER_TEXTS.enterNameError[language] || OTHER_TEXTS.enterNameError['de']);
      return;
    }
    if (!rText.trim()) {
      triggerToast(OTHER_TEXTS.enterTextError[language] || OTHER_TEXTS.enterTextError['de']);
      return;
    }

    const newReview = {
      id: `custom-rev-${Date.now()}`,
      name: rName.trim(),
      rating: rRating,
      text: rText.trim(),
      model: rModel,
      date: new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      isCustom: true
    };

    const updated = [newReview, ...customReviews];
    setCustomReviews(updated);
    localStorage.setItem('aleksai_custom_reviews', JSON.stringify(updated));

    // Clear form inputs
    setRName('');
    setRText('');
    setRRating(5);
    
    triggerToast(OTHER_TEXTS.toastReviewSuccess[language] || OTHER_TEXTS.toastReviewSuccess['de']);
  };

  // Load chat session on click
  const loadChatSession = (id: string) => {
    setActiveSessionId(id);
    const session = sessions.find(s => s.id === id);
    if (session) {
      setActiveModel(session.model);
    }
  };

  // Handles submitting home screen landing search directly into a chat
  const handleHomeSearchSubmit = () => {
    const input = chatInput.trim();
    if (!input) return;

    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    // Set up a new session
    const newId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newId,
      title: input.length > 30 ? input.slice(0, 30) + '...' : input,
      messages: [],
      model: activeModel
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newId);
    setChatInput('');
    showPage('chat');

    // Wait a brief timeout for DOM insertion and trigger prompt
    setTimeout(() => {
      triggerMessageSubmission(input, newId);
    }, 150);
  };

  const setHomeSuggestedText = (suggestion: string) => {
    setChatInput(suggestion);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      const formatBytes = (bytes: number) => {
        if (bytes < 1024) return bytes + " B";
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
        else return (bytes / 1048576).toFixed(1) + " MB";
      };

      if (file.type.startsWith('image/')) {
        const tempReader = new FileReader();
        tempReader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement('canvas');
            const maxDim = 1024;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0, width, height);
              const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
              const approxBytes = Math.round((dataUrl.length - 22) * 3 / 4);

              setAttachedFiles(prev => [...prev, {
                name: file.name,
                type: 'image/jpeg',
                size: formatBytes(approxBytes),
                dataUrl
              }]);
            }
          };
          img.src = event.target?.result as string;
        };
        tempReader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          setAttachedFiles(prev => [...prev, {
            name: file.name,
            type: file.type,
            size: formatBytes(file.size),
            dataUrl
          }]);
        };
        reader.readAsDataURL(file);
      }
    }
    triggerToast(language === 'de' ? 'Dateien erfolgreich angehängt!' : 'Files successfully appended!');
  };

  // Submit actual API chat request
  const handleChatFieldSubmit = () => {
    const input = chatInput.trim();
    if ((!input && attachedFiles.length === 0) && !isImageGeneratorMode) return;
    if (isGenerating) return;

    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    const isInfinite = currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && localStorage.getItem('aleksai_admin_infinite') === 'true';
    if (currentUser.credits <= 0 && !isInfinite) {
      triggerToast('Fehler: Du hast keine Credits mehr für heute!');
      return;
    }

    let targetSessionId = activeSessionId;
    const sessionTitle = input 
      ? (input.length > 30 ? input.slice(0, 30) + '...' : input)
      : (isImageGeneratorMode 
          ? '🎨 Bild generieren' 
          : isSoundGeneratorMode 
            ? '🔊 Sound generieren' 
            : isMusicGeneratorMode 
              ? '🎵 Musik generieren' 
              : isVideoGeneratorMode 
                ? '🎬 Video generieren' 
                : '📎 Datei hochgeladen');

    if (!targetSessionId) {
      // Lazy initialize session if user is in chat with empty session
      targetSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: targetSessionId,
        title: sessionTitle,
        messages: [],
        model: activeModel
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(targetSessionId);
    }

    setChatInput('');
    triggerMessageSubmission(input, targetSessionId);
  };

  const askSuggestedQuestion = (question: string) => {
    if (isGenerating) return;
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    const isInfinite = currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && localStorage.getItem('aleksai_admin_infinite') === 'true';
    if (currentUser.credits <= 0 && !isInfinite) {
      triggerToast('Fehler: Du hast keine Credits mehr für heute!');
      return;
    }

    let targetSessionId = activeSessionId;
    if (!targetSessionId) {
      targetSessionId = `session_${Date.now()}`;
      const newSession: ChatSession = {
        id: targetSessionId,
        title: question.length > 30 ? question.slice(0, 30) + '...' : question,
        messages: [],
        model: activeModel
      };
      setSessions(prev => [newSession, ...prev]);
      setActiveSessionId(targetSessionId);
    }

    setChatInput('');
    triggerMessageSubmission(question, targetSessionId);
  };

  const triggerMessageSubmission = async (text: string, sessionId: string) => {
    if (!currentUser) return;

    const isInfinite = currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && localStorage.getItem('aleksai_admin_infinite') === 'true';
    // Deduct 1 credit (if not infinite)
    const updatedUser = {
      ...currentUser,
      credits: isInfinite ? currentUser.credits : Math.max(0, currentUser.credits - 1)
    };
    updateAndSaveUser(updatedUser);

    const timestamp = new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

    // Check attached details
    const attachedImage = attachedFiles.find(f => f.type.startsWith('image/'))?.dataUrl;
    const attachedDoc = attachedFiles.find(f => !f.type.startsWith('image/'));

    const userMessage: Message = {
      role: 'user',
      content: text || (isImageGeneratorMode 
        ? `Bild generieren für: "${text}"` 
        : isSoundGeneratorMode 
          ? `Sound-Effekt generieren für: "${text}"` 
          : isMusicGeneratorMode 
            ? `Musikstück komponieren für: "${text}"` 
            : isVideoGeneratorMode 
              ? `Video erstellen für: "${text}"` 
              : `Dateianhang: ${attachedDoc?.name || 'Dokument'}`),
      timestamp,
      model: activeModel,
      ...(attachedImage ? { imageUrl: attachedImage } : {}),
      ...(attachedDoc ? { fileName: attachedDoc.name, fileSize: attachedDoc.size, fileType: attachedDoc.type } : {})
    };

    // Update active sessions state instantly
    const activeSession = sessions.find(s => s.id === sessionId);
    const existingMessages = activeSession ? activeSession.messages : [];
    const currentSessionMessages = [...existingMessages, userMessage];

    const getModeTitle = () => {
      if (isImageGeneratorMode) return '🎨 Bild generieren';
      if (isSoundGeneratorMode) return '🔊 Sound generieren';
      if (isMusicGeneratorMode) return '🎵 Musik generieren';
      if (isVideoGeneratorMode) return '🎬 Video generieren';
      return '📎 Datei';
    };

    setSessions(prev => {
      const exists = prev.some(s => s.id === sessionId);
      if (!exists) {
        const newSession: ChatSession = {
          id: sessionId,
          title: text.length > 30 ? text.slice(0, 30) + '...' : (text || getModeTitle()),
          messages: [userMessage],
          model: activeModel
        };
        return [newSession, ...prev];
      }
      return prev.map(s => {
        if (s.id === sessionId) {
          const finalTitle = s.title === 'Neues Gespräch' || s.title.startsWith('session_')
            ? (text.length > 30 ? text.slice(0, 30) + '...' : (text || getModeTitle()))
            : s.title;
          return {
            ...s,
            title: finalTitle,
            messages: currentSessionMessages
          };
        }
        return s;
      });
    });

    setIsGenerating(true);
    shouldSpeakNextResponseRef.current = true;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customApiKey ? { 'X-Custom-API-Key': customApiKey } : {})
        },
        body: JSON.stringify({
          messages: currentSessionMessages,
          model: activeModel,
          generateImage: isImageGeneratorMode,
          generateSound: isSoundGeneratorMode,
          generateMusic: isMusicGeneratorMode,
          generateVideo: isVideoGeneratorMode,
          webSearch: isWebSearchActive,
          studyMode: isStudyModeActive
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errMsg = errorData.error || 'Server-Fehler';
        const errDetails = errorData.details ? ` (${errorData.details})` : '';
        throw new Error(`${errMsg}${errDetails}`);
      }

      const data = await response.json();
      const aiReply = data.text || 'Keine Antwort erhalten.';

      // Add AI reply to chat state
      const aiMessage: Message = {
        role: 'ai',
        content: aiReply,
        timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        model: activeModel,
        ...(data.imageUrl ? { imageUrl: data.imageUrl } : {}),
        ...(data.audioUrl ? { audioUrl: data.audioUrl, audioType: data.audioType, soundType: data.soundType, musicStyle: data.musicStyle } : {}),
        ...(data.videoUrl ? { videoUrl: data.videoUrl, videoType: data.videoType, videoTitle: data.videoTitle } : {}),
        searchSources: data.searchSources
      };

      // Reset generator modes on successful generation
      setIsImageGeneratorMode(false);
      setIsSoundGeneratorMode(false);
      setIsMusicGeneratorMode(false);
      setIsVideoGeneratorMode(false);

      setSessions(prev => 
        prev.map(s => {
          if (s.id === sessionId) {
            return {
              ...s,
              messages: [...s.messages, aiMessage]
            };
          }
          return s;
        })
      );

    } catch (e: any) {
      console.error(e);
      const systemErrorMessage: Message = {
        role: 'ai',
        content: `⚠️ Fehler bei der Verbindung: ${e.message || 'Bitte überprüfe die Internetverbindung und den API-Key.'}`,
        timestamp: new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }),
        model: activeModel
      };

      setSessions(prev => 
        prev.map(s => {
          if (s.id === sessionId) {
            return {
              ...s,
              messages: [...s.messages, systemErrorMessage]
            };
          }
          return s;
        })
      );
    } finally {
      setIsGenerating(false);
      setAttachedFiles([]);
      setIsImageGeneratorMode(false);
    }
  };

  // Content Message Parser inside React
  const renderMessageContent = (msg: Message, isLatest: boolean = false) => {
    let text = msg.content;
    const blocks: Array<{ type: 'thought' | 'code' | 'text'; content: string; language?: string }> = [];

    // Parse thought tags (DeepSeek R1 style)
    const thinkStart = text.indexOf('<think>');
    const thinkEnd = text.indexOf('</think>');
    if (thinkStart !== -1 && thinkEnd !== -1 && thinkEnd > thinkStart) {
      const thoughtContent = text.substring(thinkStart + 7, thinkEnd);
      if (thoughtContent.trim()) {
        blocks.push({ type: 'thought', content: thoughtContent.trim() });
      }
      text = text.substring(thinkEnd + 8);
    }

    // Parse standard markdown code blocks
    const codeRegex = /```(\w*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;

    while ((match = codeRegex.exec(text)) !== null) {
      const textBefore = text.substring(lastIndex, match.index);
      if (textBefore.trim()) {
        blocks.push({ type: 'text', content: textBefore });
      }
      blocks.push({
        type: 'code',
        content: match[2].trim(),
        language: match[1] || 'Code'
      });
      lastIndex = codeRegex.lastIndex;
    }

    const textAfter = text.substring(lastIndex);
    if (textAfter.trim() || blocks.length === 0) {
      blocks.push({ type: 'text', content: textAfter });
    }

    return (
      <div className="space-y-3">
        {blocks.map((block, idx) => {
          if (block.type === 'thought') {
            return (
              <div key={idx}>
                <CollapsibleThought content={block.content} />
              </div>
            );
          }

          if (block.type === 'code') {
            return (
              <div key={idx} className="my-3 rounded-lg overflow-hidden border border-slate-200/80 bg-white">
                <div className="bg-slate-50 px-4 py-1.5 text-[11px] text-slate-500 font-mono flex justify-between items-center border-b border-slate-100">
                  <span className="uppercase tracking-wider font-semibold">{block.language}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(block.content);
                      triggerToast('Code in die Zwischenablage kopiert!');
                    }}
                    className="hover:text-blue-600 transition"
                  >
                    Kopieren
                  </button>
                </div>
                <pre className="bg-[#121826] text-slate-100 p-4 overflow-x-auto text-xs font-mono leading-relaxed">
                  <code>{block.content}</code>
                </pre>
              </div>
            );
          }

          return (
            <TypewriterParagraph
              key={idx}
              content={block.content}
              isLatest={isLatest}
              darkMode={darkMode}
              idx={idx}
            />
          );
        })}

        {/* Inline Helper for Connection or Rate Limit/Quota Errors */}
        {(text.includes('Fehler bei der Verbindung') || 
          text.includes('überlastet') || 
          text.includes('Auslastung') || 
          text.includes('UNAVAILABLE') || 
          text.includes('Quota Limit') ||
          text.includes('RESOURCE_EXHAUSTED') ||
          text.includes('503-Fehler') ||
          text.includes('ApiError:') ||
          text.includes('limit') ||
          text.includes('exhausted') ||
          text.includes('quota') ||
          text.includes('rate-limits')) && (
          <div className={`mt-3 p-3.5 rounded-xl border flex flex-col gap-2.5 ${darkMode ? 'bg-slate-950 border-red-900/30 text-slate-200' : 'bg-red-50/50 border-red-150 text-slate-800'}`}>
            <div className="flex items-center gap-2">
              <span className="text-base">🔑</span>
              <p className="text-xs font-black uppercase tracking-wider">{language === 'de' ? 'Eigenen API-Key aktivieren' : 'Activate Custom API Key'}</p>
            </div>
            <p className="text-[11px] opacity-90 leading-relaxed">
              {language === 'de' 
                ? 'Durch die hohe API-Auslastung auf unseren Standard-Schlüsseln kannst du dieses Limit sofort aufheben, indem du unkompliziert deinen eigenen kostenlosen Gemini API-Schlüssel hinterlegst.'
                : 'To immediately bypass API congestion/limits, you can paste your own free Gemini API key below. This self-hosts your requests securely from your browser.'}
            </p>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder={customApiKey ? '••••••••••••••••••••' : 'AIzaSy...'}
                className={`flex-1 px-3 py-1.5 text-xs rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-200 text-slate-900 focus:border-[#4f6ef7]'}`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val) {
                      handleSaveCustomApiKey(val);
                      triggerToast(language === 'de' ? 'API-Schlüssel gespeichert!' : 'API Key saved!');
                      (e.target as HTMLInputElement).value = '';
                    }
                  }
                }}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val) {
                    handleSaveCustomApiKey(val);
                    triggerToast(language === 'de' ? 'API-Schlüssel gespeichert!' : 'API Key saved!');
                    e.target.value = '';
                  }
                }}
              />
              <a 
                href="https://aistudio.google.com/app/apikey" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                {language === 'de' ? 'Key holen ↗' : 'Get Key ↗'}
              </a>
            </div>
            <p className="text-[9.5px] opacity-75">
              💡 {language === 'de' 
                ? 'Füge einfach den API-Schlüssel ein und drücke Enter (oder tippe außerhalb), um ihn zu speichern.' 
                : 'Paste your API key and press Enter (or click outside) to save.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  const activeSessionObj = sessions.find(s => s.id === activeSessionId);
  const isStartPage = !activeSessionObj || activeSessionObj.messages.length === 0;

  const renderedApp = (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'dark bg-[#0b0f19] text-[#e2e8f0]' : 'bg-[#fafbfe] text-[#0d0f1a]'}`}>
      
      {/* 🔮 PREMIUM GLASSMORPHISM VERTICAL SIDEBAR NAVIGATION */}
      <aside 
        onMouseMove={(e) => {
          if (isLiquidGlassActive && liquidGlassRef.current) {
            const rect = e.currentTarget.getBoundingClientRect();
            const y = e.clientY - rect.top;
            const offset = window.innerWidth >= 768 ? 24 : 22;
            liquidGlassRef.current.style.transform = `translateY(${y - offset}px)`;
            liquidGlassRef.current.style.opacity = '1';
          }
        }}
        onMouseLeave={() => {
          if (liquidGlassRef.current) {
            liquidGlassRef.current.style.opacity = '0';
          }
        }}
        className={`fixed top-0 bottom-0 left-0 w-16 md:w-20 z-50 flex flex-col items-center justify-between py-6 transition-all duration-300 border-r ${
          darkMode 
            ? 'bg-slate-950/80 border-slate-900/50 shadow-[4px_0_24px_rgba(0,0,0,0.6)]' 
            : 'bg-white/70 border-slate-200/40 shadow-[4px_0_20px_rgba(0,0,0,0.03)]'
        } backdrop-blur-[24px] overflow-hidden ${sidebarActive ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* 🧪 DYNAMIC LIQUID GLASS BLOB TRACKING CURSOR (LAG-FREE DIRECT MANIPULATION) */}
        <div 
          ref={liquidGlassRef}
          className={`absolute left-2.5 right-2.5 h-11 md:h-12 rounded-2xl pointer-events-none transition-opacity duration-300 z-0 border backdrop-blur-[12px] opacity-0 ${
            darkMode 
              ? 'bg-white/[0.07] border-white/[0.14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.15),0_8px_24px_rgba(79,110,247,0.25)]' 
              : 'bg-gradient-to-tr from-[#4f6ef7]/15 to-[#4f6ef7]/5 border-[#4f6ef7]/20 shadow-[0_8px_20px_rgba(79,110,247,0.15)]'
          }`}
          style={{ 
            top: '0px',
          }}
        />

        {/* Top Branding Section */}
        <div className="flex flex-col items-center gap-1 text-center select-none animate-fade-in relative z-10">
          <div 
            onClick={() => showPage('home')}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer ${
              darkMode 
                ? 'bg-slate-900/80 border border-white/5 hover:border-indigo-500/50 shadow-lg hover:shadow-indigo-500/15' 
                : 'bg-white/80 border border-slate-200/50 hover:border-[#4f6ef7]/50 shadow-md hover:shadow-[#4f6ef7]/10'
            } active:scale-95 group relative`}
          >
            <AleksAILogo className="w-5.5 h-5.5 text-[#4f6ef7] group-hover:rotate-12 transition-transform duration-300" glow={true} />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[9px] uppercase font-black tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/15">
              AlerksAI
            </div>
          </div>
          <span className="text-[7.5px] font-black tracking-widest text-[#4f6ef7] opacity-80 select-none uppercase mt-1">v2.2</span>
        </div>

        {/* 5 Tabs Navigation Container */}
        <nav className="flex flex-col gap-4.5 w-full px-1.5 items-center relative z-10">
          
          {/* TAB 1: Home/Entdecken */}
          <button
            onClick={() => showPage('home')}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center relative transition-all duration-300 cursor-pointer group ${
              currentPage === 'home'
                ? (darkMode 
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                    : 'bg-[#eef1ff] text-[#4f6ef7] border border-[#4f6ef7]/30 shadow-sm')
                : (darkMode 
                    ? 'text-slate-450 hover:text-white hover:bg-slate-900/10' 
                    : 'text-[#4a4e6a] hover:text-slate-950 hover:bg-slate-100/50')
            }`}
            title={language === 'de' ? 'Entdecken' : 'Home'}
          >
            {currentPage === 'home' && (
              <span className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-[#4f6ef7]" />
            )}
            <Home className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[10px] font-black tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
              {language === 'de' ? 'Entdecken' : 'Home'}
            </div>
          </button>

          {/* TAB 2: Liquid Glass Feature Toggle */}
          <button
            onClick={() => {
              setIsLiquidGlassActive(!isLiquidGlassActive);
              triggerToast(
                !isLiquidGlassActive
                  ? (language === 'de' ? '✨ Liquid Glass Verfolgung AKTIVIERT!' : '✨ Liquid Glass tracker ACTIVATED!')
                  : (language === 'de' ? 'Liquid Glass Verfolgung deaktiviert.' : 'Liquid Glass tracker deactivated.')
              );
            }}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center relative transition-all duration-300 cursor-pointer group ${
              isLiquidGlassActive
                ? (darkMode 
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.25)]' 
                    : 'bg-[#fef9c3] text-[#b45309] border border-amber-500/30 shadow-sm')
                : (darkMode 
                    ? 'text-slate-450 hover:text-white hover:bg-slate-900/10' 
                    : 'text-[#4a4e6a] hover:text-slate-950 hover:bg-slate-100/50')
            }`}
            title="Liquid Glass"
          >
            <Sparkles className={`w-5 h-5 ${isLiquidGlassActive ? 'text-amber-400 animate-pulse' : ''}`} />
            
            {/* Glowing dot for active status */}
            <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isLiquidGlassActive ? 'bg-amber-500' : 'bg-slate-450/30'}`} />

            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[10px] font-black tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
              Liquid Glass {isLiquidGlassActive ? '(An)' : '(Aus)'}
            </div>
          </button>

          {/* TAB 3: AlerksAI Chat */}
          <button
            onClick={() => showPage('chat')}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center relative transition-all duration-300 cursor-pointer group ${
              currentPage === 'chat'
                ? (darkMode 
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                    : 'bg-[#eef1ff] text-[#4f6ef7] border border-[#4f6ef7]/30 shadow-sm')
                : (darkMode 
                    ? 'text-slate-450 hover:text-white hover:bg-slate-900/10' 
                    : 'text-[#4a4e6a] hover:text-slate-950 hover:bg-slate-100/50')
            }`}
            title="Chat"
          >
            {currentPage === 'chat' && (
              <span className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-[#4f6ef7]" />
            )}
            <MessageSquare className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[10px] font-black tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
              {language === 'de' ? 'AlerksAI Chat' : 'AlerksAI Chat'}
            </div>
          </button>

          {/* TAB 4: Schulmodus */}
          <button
            onClick={() => {
              setIsStudyModeActive(true);
              showPage('study');
            }}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center relative transition-all duration-300 cursor-pointer group ${
              currentPage === 'study'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                : (darkMode 
                    ? 'text-slate-450 hover:text-white hover:bg-slate-900/10' 
                    : 'text-[#4a4e6a] hover:text-slate-950 hover:bg-slate-100/50')
            }`}
            title="Schulmodus"
          >
            {currentPage === 'study' && (
              <span className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-emerald-500" />
            )}
            <GraduationCap className="w-5 h-5" />
            
            {/* Glowing dot for active status */}
            <span className={`absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full ${isStudyModeActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-450/30'}`} />

            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[10px] font-black tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
              {language === 'de' ? 'Schulmodus' : 'Study Mode'}
            </div>
          </button>

          {/* TAB 5: Profile & Settings */}
          <button
            onClick={() => {
              if (!currentUser) {
                openAuthModal('login');
                return;
              }
              showPage('profile');
            }}
            className={`w-10 h-10 md:w-11 md:h-11 rounded-2xl flex items-center justify-center relative transition-all duration-300 cursor-pointer group ${
              currentPage === 'profile'
                ? (darkMode 
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-[0_0_15px_rgba(99,102,241,0.25)]' 
                    : 'bg-[#eef1ff] text-[#4f6ef7] border border-[#4f6ef7]/30 shadow-sm')
                : (darkMode 
                    ? 'text-slate-450 hover:text-white hover:bg-slate-900/10' 
                    : 'text-[#4a4e6a] hover:text-slate-950 hover:bg-slate-100/50')
            }`}
            title="Mein Profil"
          >
            {currentPage === 'profile' && (
              <span className="absolute left-0 top-1/4 h-1/2 w-1 rounded-r-full bg-[#4f6ef7]" />
            )}
            <UserIcon className="w-5 h-5" />
            
            {/* Tooltip */}
            <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[10px] font-black tracking-wider pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-xl border border-white/10">
              {language === 'de' ? 'Mein Profil' : 'My Profile'}
            </div>
          </button>

        </nav>

        {/* Bottom Shortcuts / Settings */}
        <div className="flex flex-col gap-3.5 items-center w-full px-1.5 relative z-10">
          {/* Quick theme toggler */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer group ${
              darkMode 
                ? 'bg-slate-900 text-amber-400 hover:bg-slate-800' 
                : 'bg-slate-100 text-[#4a4e6a] hover:bg-slate-200'
            }`}
            title={language === 'de' ? 'Modus wechseln' : 'Toggle theme'}
          >
            <span className="text-sm select-none group-hover:scale-110 transition">{darkMode ? '☀️' : '🌙'}</span>
          </button>

          {/* User profile initial circular button */}
          {currentUser && (
            <div 
              onClick={() => showPage('profile')}
              className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4f6ef7] to-[#8b5cf6] border border-blue-200/20 text-white flex items-center justify-center font-black text-xs hover:scale-105 active:scale-95 transition-all shadow-md cursor-pointer relative group shrink-0 animate-fade-in"
              title={currentUser.firstName}
            >
              {currentUser.profilePic ? (
                <img src={currentUser.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                currentUser.firstName[0].toUpperCase()
              )}
              
              {/* Tooltip */}
              <div className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-slate-950 text-white text-[9px] uppercase font-black tracking-widest pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 border border-white/10 animate-fade-in">
                {currentUser.firstName}
              </div>
            </div>
          )}

          {/* ↩️ SLICK COLLAPSE SIDEBAR TRIGGER */}
          <button
            onClick={toggleSidebar}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 cursor-pointer group ${
              darkMode 
                ? 'bg-slate-900 border border-white/5 text-slate-405 hover:text-violet-400 hover:bg-slate-800 shadow-md' 
                : 'bg-white border border-slate-200/50 text-[#4a4e6a] hover:text-[#4f6ef7] hover:bg-slate-50 shadow-sm'
            }`}
            title={language === 'de' ? 'Menü einklappen' : 'Collapse Sidebar'}
          >
            <ChevronLeft className="w-4.5 h-4.5 group-hover:-translate-x-0.5 transition-transform duration-200" />
          </button>
        </div>
      </aside>

      {/* ── HEADER NAVIGATION ── */}
      <nav className={`fixed top-0 ${sidebarActive ? 'left-16 md:left-20' : 'left-0'} right-0 z-40 border-b h-16 flex items-center justify-between px-4 md:px-6 transition-all duration-300 ${darkMode ? 'bg-[#0f172a]/95 border-slate-800 text-white' : 'bg-white/95 border-[#e2e5f1]'}`}>
        <div className="flex items-center gap-2 md:gap-3">
          <div 
            onClick={() => showPage('home')}
            className="flex items-center gap-2 font-extrabold text-[15px] sm:text-[18px] md:text-[20px] cursor-pointer"
          >
            <AleksAILogo className="w-5 h-5 sm:w-6 sm:h-6 text-[#4f6ef7]" glow={true} />
            <span className="bg-gradient-to-r from-[#4f6ef7] via-[#8b5cf6] to-[#ec4899] bg-clip-text text-transparent font-black tracking-tight">AlerksAI Intelegence</span>
          </div>
        </div>

        {/* Dynamic Model Switcher + Auth Buttons Next to it */}
        <div className="flex items-center gap-2 sm:gap-3" ref={dropdownRef}>
          {/* Quick theme toggler slider visible on Landing page / Header */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-2 rounded-xl transition cursor-pointer hidden xs:flex ${darkMode ? 'bg-slate-800 text-amber-400 hover:bg-slate-750' : 'bg-slate-100 text-[#4a4e6a] hover:bg-slate-200'}`}
            title="Sonne/Mond Modus wechseln"
          >
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Quick settings button */}
          <button
            onClick={() => {
              setSettingsActiveTab('settings');
              setShowSettingsModal(true);
            }}
            className={`p-2 rounded-xl transition cursor-pointer flex items-center gap-1.5 text-xs font-black ${darkMode ? 'bg-slate-800 text-pink-400 hover:bg-slate-700 hover:text-pink-300' : 'bg-pink-50 text-pink-600 hover:bg-pink-100'}`}
            title={language === 'de' ? "Menü, Profil & Shop" : "Menu, Profile & Shop"}
          >
            ☰ <span className="hidden md:inline">{language === 'de' ? 'Menü & Shop ⚡' : 'Menu & Shop ⚡'}</span>
          </button>

          {/* model switcher dropdown button */}
          <div className="relative">
            <button 
              onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 border rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-750 text-slate-200 hover:border-blue-500' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a] hover:border-[#4f6ef7]'}`}
            >
              <ModelLogo model={activeModel} className="w-4 h-4" />
              <span className="hidden sm:inline">{MODEL_DETAILS[activeModel].shortName}</span>
              <span className="text-[8px] opacity-60">▼</span>
            </button>
            
            {isModelDropdownOpen && (
              <div className={`absolute right-0 mt-2.5 w-[280px] md:w-[320px] rounded-2xl shadow-xl z-50 overflow-hidden border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e2e5f1]'}`}>
                <div className={`p-3 border-b text-left ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f7f8fc] border-[#e2e5f1]'}`}>
                  <span className="text-[10px] font-bold text-[#8b90a8] uppercase tracking-wider">{t('settingsModel')}</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {Object.entries(MODEL_DETAILS).map(([key, details]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectModel(key as AIModel)}
                      className={`w-full text-left p-3 flex gap-3 transition items-start border-b last:border-0 ${darkMode ? 'hover:bg-slate-800 border-slate-850' : 'hover:bg-[#f7f8fc] border-stone-50'} ${activeModel === key ? (darkMode ? 'bg-slate-800 border-l-4 border-blue-550' : 'bg-[#eef1ff] border-l-4 border-[#4f6ef7]') : ''}`}
                    >
                      <ModelLogo model={key as AIModel} className="w-5 h-5 mt-1" />
                      <div className="text-left">
                        <div className={`font-bold text-xs md:text-sm flex items-center gap-1.5 ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                          {details.name}
                          {key === AIModel.GEMINI && (
                            <span className="text-[8px] bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold px-1.5 py-0.5 rounded-full">Standard</span>
                          )}
                        </div>
                        <p className={`text-[10px] md:text-[11px] mt-1 leading-normal ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>{details.description}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>


          <div className={`h-6 w-px ${darkMode ? 'bg-slate-800' : 'bg-[#e2e5f1]'}`}></div>

          {/* User Auth Info State */}
          {!currentUser ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <button 
                onClick={() => openAuthModal('login')}
                className={`text-xs font-bold px-2 sm:px-3 py-1.5 rounded-xl border transition duration-200 cursor-pointer ${darkMode ? 'text-slate-300 border-slate-800 hover:bg-slate-800' : 'text-[#4a4e6a] border-transparent hover:border-[#e2e5f1]'}`}
              >
                {t('login')}
              </button>
              <button 
                onClick={() => openAuthModal('register')}
                className="text-xs font-bold bg-[#4f6ef7] hover:bg-[#6c83f8] text-white px-3 py-1.5 rounded-xl transition duration-200 cursor-pointer shadow-sm"
              >
                {t('register')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-3">
              <button 
                onClick={() => {
                  setSettingsActiveTab('shop');
                  setShowSettingsModal(true);
                  triggerToast(language === 'de' ? "AlerksAI Credit Shop geöffnet ⚡" : "AlerksAI Credit Shop opened ⚡");
                }}
                className={`hidden xs:inline-flex text-[11px] font-black px-2.5 py-1.5 rounded-full items-center gap-1.5 cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 border ${darkMode ? 'bg-indigo-950/40 border-indigo-900/40 text-indigo-300 hover:bg-indigo-900/50 shadow-[0_0_12px_rgba(99,102,241,0.2)]' : 'bg-pink-50 border-pink-100 text-pink-600 hover:bg-pink-100 shadow-[0_0_12px_rgba(236,72,153,0.15)]'}`}
                title={language === 'de' ? "Credits aufladen / Shop öffnen" : "Recharge credits / Open shop"}
              >
                ⚡ {currentUser.credits}
              </button>
              {currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && (
                <button 
                  onClick={() => setShowAdminModal(true)}
                  className={`text-[10px] md:text-xs font-black px-2.5 py-1.5 rounded-xl border transition duration-200 cursor-pointer flex items-center gap-1 shadow-sm leading-none animate-pulse ${darkMode ? 'bg-emerald-950/50 border-emerald-800 text-emerald-400 hover:bg-emerald-900/40' : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'}`}
                  title="Aleks Admin Panel"
                >
                  👑 Admin
                </button>
              )}
              <button 
                onClick={() => showPage('chat')}
                className={`text-xs font-bold px-2.5 py-1.5 border rounded-xl transition ${darkMode ? 'text-slate-300 border-slate-850 hover:bg-slate-800' : 'text-[#4a4e6a] border-[#e2e5f1] hover:border-[#4f6ef7]'}`}
              >
                {t('chat')}
              </button>
              <div 
                onClick={() => showPage('profile')}
                className="w-8 h-8 border border-blue-200 rounded-full bg-gradient-to-tr from-[#4f6ef7] to-[#8b5cf6] flex items-center justify-center font-bold text-white text-[12px] hover:scale-105 transition duration-200 shadow-sm cursor-pointer shrink-0"
              >
                {currentUser.profilePic ? (
                  <img src={currentUser.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
                ) : (
                  currentUser.firstName[0].toUpperCase()
                )}
              </div>
            </div>
          )}
        </div>
      </nav>

      {adminBroadcast && (
        <div className={`fixed top-16 ${sidebarActive ? 'left-16 md:left-20' : 'left-0'} right-0 z-35 bg-gradient-to-r from-[#d946ef] via-[#8b5cf6] to-[#3b82f6] text-white text-[10px] sm:text-xs py-2 px-4 font-black text-center flex items-center justify-center gap-2 shadow-md transition-all duration-300`}>
          <span className="w-2 h-2 bg-[#22c55e] rounded-full shrink-0 animate-ping"></span>
          <span className="uppercase tracking-widest text-[9px] bg-black/40 px-2 py-0.5 rounded font-black">Mitteilung</span>
          <span className="truncate">{adminBroadcast}</span>
          {currentUser?.email?.toLowerCase() === 'aleks.smolovic@web.de' && (
            <button 
              onClick={() => { setAdminBroadcast(''); localStorage.removeItem('aleksai_broadcast'); triggerToast('Ankündigung gelöscht!'); }}
              className="text-[10px] ml-2 hover:text-red-200 font-bold ml-auto cursor-pointer p-1"
              title="Ankündigung löschen"
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* ── PAGE CONTENT ROUTING ── */}
      <main className={`flex-1 mt-16 flex flex-col transition-all duration-300 ${sidebarActive ? 'pl-16 md:pl-20' : 'pl-0'} ${adminBroadcast ? 'pt-8' : ''}`}>
        {/* ── HOME LANDING SCREEN ── */}
        {currentPage === 'home' && (
          <div className="min-h-[calc(100vh-64px)] flex flex-col justify-between">
            <section className={`flex-1 flex flex-col items-center justify-center text-center px-4 py-8 md:py-16 transition-colors ${darkMode ? 'bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950' : 'bg-gradient-to-b from-[#eef1ff]/40 via-white to-white'}`}>
              
              {/* Starbadge free info */}
              <div className={`inline-flex items-center gap-1.5 border px-4 py-1.5 rounded-full text-[11px] font-black mb-6 animate-fade-in shadow-sm ${darkMode ? 'bg-slate-900/60 border-slate-800 text-blue-400' : 'bg-[#eef1ff] border-blue-200/60 text-[#4f6ef7]'}`}>
                <AleksAILogo className="w-3.5 h-3.5" glow={true} /> ✨ Komplett kostenlos · Keine Abos
              </div>
              
              <h1 className={`text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.15] mb-5 max-w-4xl ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                {t('homeTitle').split('\n')[0]}<br />
                <span className="bg-gradient-to-r from-[#4f6ef7] via-[#a855f7] to-[#ec4899] bg-clip-text text-transparent font-black tracking-tight">{t('welcome')}</span>
              </h1>
              
              <p className={`text-xs sm:text-sm md:text-base max-w-xl leading-relaxed mb-8 ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>
                {t('homeSubtitle')}
              </p>

              {/* Light and dark Switch directly on the home page */}
              <div className={`p-1.5 rounded-2xl flex items-center gap-1.5 mb-8 border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-[#e2e5f1]'}`}>
                <button
                  onClick={() => setDarkMode(false)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${!darkMode ? 'bg-white text-slate-900 shadow-md scale-105' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  ☀️ Light Mode
                </button>
                <button
                  onClick={() => setDarkMode(true)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${darkMode ? 'bg-slate-850 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}
                >
                  🌙 Dark Mode
                </button>
              </div>

              {/* Main Prompt search input box */}
              <div className={`w-full max-w-2xl border-2 rounded-[22px] p-2 flex items-end gap-2.5 shadow-xl transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 focus-within:border-blue-500' : 'bg-white border-[#c8ccdf] focus-within:border-[#4f6ef7]'}`}>
                <textarea
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleHomeSearchSubmit();
                    }
                  }}
                  placeholder={t('placeholderHome')}
                  rows={2}
                  className={`flex-1 bg-transparent border-0 outline-none resize-none text-xs sm:text-sm py-1.5 pl-3 select-text font-normal leading-normal ${darkMode ? 'text-white placeholder:text-slate-500' : 'text-[#0d0f1a] placeholder:text-[#8b90a8]'}`}
                />
                <button 
                  onClick={handleHomeSearchSubmit}
                  className="w-11 h-11 bg-[#4f6ef7] hover:bg-[#6c83f8] rounded-xl flex items-center justify-center text-white cursor-pointer hover:scale-105 transition shrink-0 shadow-md"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                  </svg>
                </button>
              </div>

              {/* Suggestions quick chips */}
              <div className="flex flex-wrap gap-2 mt-5 max-w-xl justify-center">
                <button
                  onClick={() => setHomeSuggestedText(t('suggestedQuanten') + ' ' + (language === 'de' ? 'erklären' : 'explain'))}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition duration-150 cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a] hover:border-[#4f6ef7]'}`}
                >
                  ⚛️ {t('suggestedQuanten')}
                </button>
                <button
                  onClick={() => setHomeSuggestedText(t('suggestedPython') + ' ' + (language === 'de' ? 'Code schreiben' : 'Code'))}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition duration-150 cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a] hover:border-[#4f6ef7]'}`}
                >
                  🐍 {t('suggestedPython')}
                </button>
                <button
                  onClick={() => setHomeSuggestedText(t('suggestedSchlaf'))}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition duration-150 cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a] hover:border-[#4f6ef7]'}`}
                >
                  💤 {t('suggestedSchlaf')}
                </button>
                <button
                  onClick={() => setHomeSuggestedText(t('suggestedScharze') + ' ' + (language === 'de' ? 'Erklärung' : 'explain'))}
                  className={`px-3.5 py-1.5 rounded-full text-[11px] font-bold border transition duration-150 cursor-pointer ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:border-blue-500' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a] hover:border-[#4f6ef7]'}`}
                >
                  🌌 {t('suggestedScharze')}
                </button>
              </div>

              {/* Models selection card grid featuring customized AleksAILogo for each model */}
              <div className="w-full max-w-5xl mt-12 text-left">
                <span className={`text-[10px] font-extrabold uppercase tracking-widest block mb-3 text-center ${darkMode ? 'text-blue-400' : 'text-[#4f6ef7]'}`}>
                  {t('selectPreferModel')}
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {Object.entries(MODEL_DETAILS).map(([key, details]) => (
                    <button
                      key={key}
                      onClick={() => handleSelectModel(key as AIModel)}
                      className={`p-3.5 rounded-2xl border text-left transition-all duration-300 cursor-pointer flex flex-col justify-between h-36 relative overflow-hidden group ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-blue-500' : 'bg-white border-[#e2e5f1] hover:border-[#4f6ef7] shadow-sm hover:shadow-md'} ${activeModel === key ? (darkMode ? 'ring-2 ring-blue-500 bg-slate-850 border-transparent' : 'ring-2 ring-[#4f6ef7] bg-blue-50/40 border-transparent') : ''}`}
                    >
                      {/* Ambient background decoration with exact AleksAI Logo contour */}
                      <div className="absolute right-[-15px] bottom-[-15px] opacity-[0.06] group-hover:scale-110 group-hover:rotate-6 transition duration-500">
                        <AleksAILogo className="w-24 h-24 text-current" />
                      </div>

                      <div className="flex justify-between items-start w-full">
                        {/* Custom styled AleksAI Logo badge with model's specific color overlay */}
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${details.color} text-white flex items-center justify-center p-1.5 shadow-sm`}>
                          <ModelLogo model={key as AIModel} className="w-5 h-5 text-white" color="text-white" />
                        </div>
                      </div>

                      <div className="mt-4">
                        <span className={`font-black tracking-tight text-[11.5px] block leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>{details.name}</span>
                        <span className="text-[9px] opacity-65 line-clamp-2 mt-0.5 leading-snug">{details.description}</span>
                      </div>

                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Aleks features list section */}
            <section className={`py-12 px-4 md:px-8 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-900/45 border-slate-800/80' : 'bg-[#f7f8fc] border-[#e2e5f1]'}`}>
              <div className="max-w-[1100px] mx-auto text-center">
                <span className={`text-xs font-black uppercase tracking-widest block mb-2 ${darkMode ? 'text-blue-400' : 'text-[#4f6ef7]'}`}>{t('advantages')}</span>
                <h2 className={`text-2xl md:text-3xl font-extrabold mb-10 ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{t('whyUs')}</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                  <div className={`border rounded-2xl p-5 shadow-sm transition duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e2e5f1]'}`}>
                    <div className="w-10 h-10 bg-[#eef1ff] dark:bg-blue-950/45 rounded-lg flex items-center justify-center text-[#4f6ef7] dark:text-blue-400 font-semibold text-lg mb-3">⚡</div>
                    <h3 className={`font-bold text-xs md:text-sm mb-1.5 ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{t('benefitsCreditsTitle')}</h3>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>{t('benefitsCreditsDesc')}</p>
                  </div>

                  <div className={`border rounded-2xl p-5 shadow-sm transition duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e2e5f1]'}`}>
                    <div className="w-10 h-10 bg-[#eef1ff] dark:bg-purple-950/45 rounded-lg flex items-center justify-center text-[#4f6ef7] dark:text-purple-400 font-semibold text-lg mb-3">🔮</div>
                    <h3 className={`font-bold text-xs md:text-sm mb-1.5 ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{t('benefitsModelsTitle')}</h3>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>{t('benefitsModelsDesc')}</p>
                  </div>

                  <div className={`border rounded-2xl p-5 shadow-sm transition duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e2e5f1]'}`}>
                    <div className="w-10 h-10 bg-[#eef1ff] dark:bg-emerald-950/45 rounded-lg flex items-center justify-center text-[#4f6ef7] dark:text-emerald-400 font-semibold text-lg mb-3">🔐</div>
                    <h3 className={`font-bold text-xs md:text-sm mb-1.5 ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{t('benefitsAccountTitle')}</h3>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>{t('benefitsAccountDesc')}</p>
                  </div>

                  <div className={`border rounded-2xl p-5 shadow-sm transition duration-200 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-[#e2e5f1]'}`}>
                    <div className="w-10 h-10 bg-[#eef1ff] dark:bg-orange-950/45 rounded-lg flex items-center justify-center text-[#4f6ef7] dark:text-orange-400 font-semibold text-lg mb-3">🎁</div>
                    <h3 className={`font-bold text-xs md:text-sm mb-1.5 ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{t('benefitsFreeTitle')}</h3>
                    <p className={`text-[11px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>{t('benefitsFreeDesc')}</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ── INTERACTIVE SAVINGS CALCULATOR: DEIN ERSPARNIS BEI ALEKSAI ── */}
            <section className={`py-14 px-4 md:px-8 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-900 border-slate-850' : 'bg-slate-50/75 border-slate-200'}`}>
              <div className="max-w-[1100px] mx-auto animate-fade-in">
                <div className="text-center mb-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${darkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-[#eef1ff] text-[#4f6ef7]'}`}>
                    {language === 'de' ? '💰 Finanz-Vorteil' : '💰 Financial Advantage'}
                  </span>
                  <h2 className={`text-2xl md:text-3xl font-black mt-3 mb-2.5 tracking-tight ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                    {language === 'de' ? 'Dein Ersparnis bei AlerksAI' : 'Your Savings at AlerksAI'}
                  </h2>
                  <p className={`text-xs md:text-sm max-w-xl mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>
                    {language === 'de' 
                      ? 'Berechne live, wie viel Geld du durch den kostenlosen Zugang zu AlerksAI Max, neo, Pro, Ultra und Business im Vergleich zu teuren Abos sparst!'
                      : 'Calculate in real-time how much money you save by using AlerksAI’s free tools instead of paying for expensive monthly subscriptions.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                  {/* LEFT: SUBSCRIPTION SERVICE SELECTORS */}
                  <div className={`lg:col-span-5 p-6 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-slate-950 border-slate-850' : 'bg-white border-[#e2e5f1] shadow-sm'}`}>
                    <div>
                      <h3 className={`font-black text-xs md:text-sm mb-4 uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-[#0d0f1a]'}`}>
                        {language === 'de' ? '1. Welche Abos ersetzt du?' : '1. Which subscriptions do you replace?'}
                      </h3>
                      <div className="space-y-3">
                        <label className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-xs font-semibold ${includeGPT ? (darkMode ? 'bg-blue-955/20 border-blue-500 text-blue-400' : 'bg-blue-50/50 border-[#4f6ef7] text-[#4f6ef7]') : (darkMode ? 'border-slate-850 hover:border-slate-750' : 'border-[#e2e5f1] hover:border-[#4f6ef7]')}`}>
                          <input 
                            type="checkbox" 
                            checked={includeGPT} 
                            onChange={(e) => setIncludeGPT(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#4f6ef7] cursor-pointer"
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <span>ChatGPT Plus (OpenAI)</span>
                            <span className="font-extrabold text-xs">€20.00 / {language === 'de' ? 'Monat' : 'Month'}</span>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-xs font-semibold ${includeClaude ? (darkMode ? 'bg-blue-955/20 border-blue-500 text-blue-400' : 'bg-blue-50/50 border-[#4f6ef7] text-[#4f6ef7]') : (darkMode ? 'border-slate-850 hover:border-slate-750' : 'border-[#e2e5f1] hover:border-[#4f6ef7]')}`}>
                          <input 
                            type="checkbox" 
                            checked={includeClaude}
                            onChange={(e) => setIncludeClaude(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#4f6ef7] cursor-pointer"
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <span>Claude Pro (Anthropic)</span>
                            <span className="font-extrabold text-xs">€20.00 / {language === 'de' ? 'Monat' : 'Month'}</span>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-xs font-semibold ${includeGemini ? (darkMode ? 'bg-blue-955/20 border-blue-500 text-blue-400' : 'bg-blue-50/50 border-[#4f6ef7] text-[#4f6ef7]') : (darkMode ? 'border-slate-850 hover:border-slate-750' : 'border-[#e2e5f1] hover:border-[#4f6ef7]')}`}>
                          <input 
                            type="checkbox" 
                            checked={includeGemini} 
                            onChange={(e) => setIncludeGemini(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#4f6ef7] cursor-pointer"
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <span>Gemini Advanced (Google)</span>
                            <span className="font-extrabold text-xs">€21.99 / {language === 'de' ? 'Monat' : 'Month'}</span>
                          </div>
                        </label>

                        <label className={`flex items-center gap-3 p-3 rounded-xl border transition cursor-pointer text-xs font-semibold ${includeImageGen ? (darkMode ? 'bg-blue-955/20 border-blue-500 text-blue-400' : 'bg-blue-50/50 border-[#4f6ef7] text-[#4f6ef7]') : (darkMode ? 'border-slate-850 hover:border-slate-750' : 'border-[#e2e5f1] hover:border-[#4f6ef7]')}`}>
                          <input 
                            type="checkbox" 
                            checked={includeImageGen} 
                            onChange={(e) => setIncludeImageGen(e.target.checked)}
                            className="w-4 h-4 rounded accent-[#4f6ef7] cursor-pointer"
                          />
                          <div className="flex-1 flex justify-between items-center">
                            <span>Midjourney / Dall-E</span>
                            <span className="font-extrabold text-xs">€15.00 / {language === 'de' ? 'Monat' : 'Month'}</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200/55 dark:border-slate-850/55 text-[10px] text-slate-400 flex items-center justify-between font-bold">
                      <span>AlerksAI Intelegence Cost:</span>
                      <span className="text-green-500 font-black uppercase text-xs tracking-wider">€0.00 (FREE FOR EVER)</span>
                    </div>
                  </div>

                  {/* MIDDLE: USAGE INTENSITY SLIDER */}
                  <div className={`lg:col-span-4 p-6 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-slate-950 border-slate-850' : 'bg-white border-[#e2e5f1] shadow-sm'}`}>
                    <div>
                      <h3 className={`font-black text-xs md:text-sm mb-4 uppercase tracking-wider ${darkMode ? 'text-slate-300' : 'text-[#0d0f1a]'}`}>
                        {language === 'de' ? '2. Deine Nutzungsintensität' : '2. Your usage intensity'}
                      </h3>
                      <p className="text-[11px] text-slate-400 leading-normal mb-4">
                        {language === 'de'
                          ? 'Verschiebe den Regler, um einzustellen wie viele Fragen du AlerksAI durchschnittlich pro Tag stellst.'
                          : 'Drag the slider to adjust how many questions you ask AlerksAI on average per day.'}
                      </p>

                      <div className="space-y-4">
                        <div className="flex justify-between items-baseline">
                          <span className="text-[11px] font-extrabold">{language === 'de' ? 'Tägliche Anfragen' : 'Daily Queries'}:</span>
                          <span className="text-lg font-black text-[#4f6ef7] dark:text-blue-400">{savingsPromptsCount}</span>
                        </div>
                        <input 
                          type="range" 
                          min="1" 
                          max="100" 
                          value={savingsPromptsCount}
                          onChange={(e) => setSavingsPromptsCount(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#4f6ef7]"
                        />
                        <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                          <span>1 {language === 'de' ? 'Anfrage' : 'Query'}</span>
                          <span>100 {language === 'de' ? 'Anfragen' : 'Queries'}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 space-y-2 pt-4 border-t border-slate-200/55 dark:border-slate-850/55 text-xs">
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>{language === 'de' ? 'Anfragen pro Monat:' : 'Queries per month:'}</span>
                        <span className={`font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{savingsPromptsCount * 30}</span>
                      </div>
                      <div className="flex justify-between font-bold text-slate-400">
                        <span>{language === 'de' ? 'Gegenwert (API Kosten):' : 'API Equivalent value:'}</span>
                        <span className="text-green-500 font-bold">€{(savingsPromptsCount * 0.04 * 30).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT: LIVE RESULT DISPLAY CARD */}
                  <div className="lg:col-span-3 rounded-2xl bg-gradient-to-br from-[#4f6ef7] via-[#855ff7] to-[#d946ef] p-0.5 shadow-xl flex items-stretch">
                    <div className="flex-1 bg-slate-950/95 dark:bg-slate-950/98 rounded-[14px] p-6 text-white text-center flex flex-col justify-between items-center relative overflow-hidden">
                      {/* Decorative glowing background mesh */}
                      <div className="absolute -top-12 -right-12 w-28 h-28 bg-[#4f6ef7]/20 blur-2xl rounded-full"></div>
                      <div className="absolute -bottom-12 -left-12 w-28 h-28 bg-pink-500/10 blur-2xl rounded-full"></div>

                      <div className="z-10">
                        <span className="bg-white/10 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                          {language === 'de' ? 'Live Ersparnis' : 'Savings Live'}
                        </span>
                      </div>

                      <div className="my-5 z-10">
                        <p className="text-[10px] uppercase font-bold tracking-widest text-[#8b90a8] mb-1">
                          {language === 'de' ? 'Deine Einsparung' : 'Your savings'}
                        </p>
                        <p className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-300 to-cyan-300 tracking-tight animate-pulse">
                          €{(() => {
                            const subscriptionBase = (includeGPT ? 20 : 0) + (includeClaude ? 20 : 0) + (includeGemini ? 22 : 0) + (includeImageGen ? 15 : 0);
                            const apiEquivalent = savingsPromptsCount * 0.04 * 30;
                            return (subscriptionBase + apiEquivalent).toFixed(2);
                          })()}
                        </p>
                        <p className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider mt-1">
                          {language === 'de' ? 'Pro Monat' : 'Per Month'}
                        </p>
                      </div>

                      <div className="w-full z-10 pt-4 border-t border-slate-800">
                        <p className="text-[9px] uppercase font-bold text-slate-400 tracking-wider">
                          {language === 'de' ? 'Ersparnis pro Jahr' : 'Yearly savings'}
                        </p>
                        <p className="text-xl font-black text-white mt-0.5">
                          €{(() => {
                            const subscriptionBase = (includeGPT ? 20 : 0) + (includeClaude ? 20 : 0) + (includeGemini ? 22 : 0) + (includeImageGen ? 15 : 0);
                            const apiEquivalent = savingsPromptsCount * 0.04 * 30;
                            return ((subscriptionBase + apiEquivalent) * 12).toFixed(0);
                          })()} / {language === 'de' ? 'Jahr' : 'Year'}
                        </p>
                        <span className="text-[8px] text-green-400 font-extrabold mt-1 block">
                          ⚡ 100% {language === 'de' ? 'Kostenfreie Premium-Modelle' : 'Free premium models'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <section className={`py-14 px-4 md:px-8 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-950 border-slate-900 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950' : 'bg-white border-[#e2e5f1]'}`}>
              <div className="max-w-[1100px] mx-auto animate-fade-in">
                <div className="text-center mb-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${darkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-[#eef1ff] text-[#4f6ef7]'}`}>
                    {OTHER_TEXTS.modelLabel[language] || OTHER_TEXTS.modelLabel['de']}
                  </span>
                  <h2 className={`text-2xl md:text-3xl font-black mt-3 mb-2.5 tracking-tight ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                    {OTHER_TEXTS.modelMatrixTitle[language] || OTHER_TEXTS.modelMatrixTitle['de']}
                  </h2>
                  <p className={`text-xs md:text-sm max-w-xl mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>
                    {OTHER_TEXTS.modelMatrixSubtitle[language] || OTHER_TEXTS.modelMatrixSubtitle['de']}
                  </p>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm scrollbar-thin">
                  <table className="w-full text-left border-collapse min-w-[700px]">
                    <thead>
                      <tr className={darkMode ? 'bg-slate-900 text-slate-300 border-b border-slate-850' : 'bg-slate-50 text-[#4a4e6a] border-b border-slate-200'}>
                        <th className="p-4 text-xs font-black uppercase tracking-wider">{language === 'de' ? 'Kriterium' : 'Specification'}</th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-[#4f6ef7] dark:text-blue-400">
                          <span className="inline-flex items-center gap-1.5"><ModelLogo model={AIModel.GEMINI} className="w-3.5 h-3.5" /> Max (Gemini)</span>
                        </th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                          <span className="inline-flex items-center gap-1.5"><ModelLogo model={AIModel.LLAMA_SCOUT} className="w-3.5 h-3.5" /> neo (Llama)</span>
                        </th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          <span className="inline-flex items-center gap-1.5"><ModelLogo model={AIModel.OPENAI} className="w-3.5 h-3.5" /> Pro (GPT-4o)</span>
                        </th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-pink-600 dark:text-pink-400">
                          <span className="inline-flex items-center gap-1.5"><ModelLogo model={AIModel.LLAMA_ULTRA} className="w-3.5 h-3.5" /> Ultra (Meta Llama)</span>
                        </th>
                        <th className="p-4 text-xs font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                          <span className="inline-flex items-center gap-1.5"><ModelLogo model={AIModel.CLAUDE} className="w-3.5 h-3.5" /> Business (Claude)</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y ${darkMode ? 'divide-slate-850 bg-slate-900/20' : 'divide-slate-150 bg-white'}`}>
                      {MODEL_COMPARISON_MATRIX.map((row, idx) => (
                        <tr key={idx} className={`text-xs ${darkMode ? 'hover:bg-slate-900/40 text-slate-300' : 'hover:bg-slate-50/75 text-slate-800'}`}>
                          <td className="p-4 font-black bg-slate-500/5 whitespace-nowrap whitespace-nowrap">
                            {row.benefit[language] || row.benefit['de']}
                          </td>
                          <td className="p-4 font-semibold">{row.max}</td>
                          <td className="p-4 font-semibold">{row.neo}</td>
                          <td className="p-4 font-semibold">{row.pro}</td>
                          <td className="p-4 font-semibold text-green-600 dark:text-green-400 font-bold">{row.ultra}</td>
                          <td className="p-4 font-semibold">{row.buissnis}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>



            {/* ── 3. INTERACTIVE FAQ ACCORDION SECTION ── */}
            <section className={`py-14 px-4 md:px-8 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-950 border-slate-900' : 'bg-white border-[#e2e5f1]'}`}>
              <div className="max-w-[760px] mx-auto animate-fade-in">
                <div className="text-center mb-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${darkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-[#eef1ff] text-[#4f6ef7]'}`}>
                    FAQ
                  </span>
                  <h2 className={`text-2xl md:text-3xl font-black mt-3 mb-2.5 tracking-tight ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                    {OTHER_TEXTS.faqTitle[language] || OTHER_TEXTS.faqTitle['de']}
                  </h2>
                  <p className={`text-xs md:text-sm max-w-lg mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>
                    {OTHER_TEXTS.faqSubtitle[language] || OTHER_TEXTS.faqSubtitle['de']}
                  </p>
                </div>

                <div className="space-y-3.5">
                  {FAQ_DATA.map((faq) => {
                    const isOpen = faqOpenId === faq.id;
                    return (
                      <div 
                        key={faq.id} 
                        className={`rounded-2xl border transition duration-250 overflow-hidden ${isOpen ? (darkMode ? 'bg-slate-900 border-blue-500' : 'bg-[#eef1ff]/40 border-[#4f6ef7]') : (darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-[#f7f8fc] border-[#e2e5f1]')}`}
                      >
                        <button 
                          onClick={() => setFaqOpenId(isOpen ? null : faq.id)}
                          className="w-full p-4 text-left font-bold text-xs sm:text-sm flex items-center justify-between gap-3 text-inherit transition"
                        >
                          <span className={darkMode ? 'text-white font-extrabold' : 'text-[#0d0f1a] font-black'}>
                            {faq.question[language] || faq.question['de']}
                          </span>
                          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-black transition-transform duration-200 ${isOpen ? 'rotate-180 bg-blue-500 text-white' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>
                            ▼
                          </span>
                        </button>
                        
                        {isOpen && (
                          <div className={`px-4 pb-4.5 pt-1 text-xs sm:text-[13px] leading-relaxed border-t ${darkMode ? 'text-slate-300 border-slate-850/50' : 'text-[#4a4e6a] border-blue-100/50'}`}>
                            {faq.answer[language] || faq.answer['de']}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>

            {/* ── 4. CHANGELOG / VERSION HISTORY SECTION ── */}
            <section className={`py-14 px-4 md:px-8 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-900 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 border-slate-850' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="max-w-[800px] mx-auto animate-fade-in">
                <div className="text-center mb-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${darkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-[#eef1ff] text-[#4f6ef7]'}`}>
                    DEVELOPER CHANGELOG
                  </span>
                  <h2 className={`text-2xl md:text-3xl font-black mt-3 mb-2.5 tracking-tight ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                    {OTHER_TEXTS.updatesTitle[language] || OTHER_TEXTS.updatesTitle['de']}
                  </h2>
                  <p className={`text-xs md:text-sm max-w-lg mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>
                    {OTHER_TEXTS.updatesSubtitle[language] || OTHER_TEXTS.updatesSubtitle['de']}
                  </p>
                </div>

                <div className="relative border-l-2 border-dashed border-[#4f6ef7]/40 dark:border-blue-400/30 pl-5 md:pl-8 space-y-10 py-2 ml-2 md:ml-4">
                  {CHANGELOG_DATA.map((item, idx) => (
                    <div key={idx} className="relative">
                      {/* Timeline Dot Indicator */}
                      <div className="absolute top-1 -left-[30px] md:-left-[42px] w-5 h-5 rounded-full bg-gradient-to-tr from-[#4f6ef7] to-[#8b5cf6] flex items-center justify-center text-[10px] text-white font-black shadow ring-4 ring-white dark:ring-[#0a0d16]">
                        ✓
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#4f6ef7] text-white tracking-wide uppercase">
                          {item.version}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">
                          {item.date}
                        </span>
                      </div>

                      <h3 className={`text-sm sm:text-base font-extrabold mb-3 tracking-tight ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                        {item.title[language] || item.title['de']}
                      </h3>

                      <ul className="space-y-1.5 pl-2">
                        {(item.bullets[language] || item.bullets['de']).map((bullet, starIdx) => (
                          <li key={starIdx} className="text-xs flex items-start gap-2 text-slate-500 dark:text-slate-400">
                            <span className="text-[#4f6ef7] dark:text-blue-400 text-[10px] mt-0.5 shrink-0">◆</span>
                            <span className="leading-relaxed">{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* ── 2. BEWERTUNGEN & LIVE FEEDBACK CENTER (Moved to Bottom) ── */}
            <section className={`py-14 px-4 md:px-8 border-t transition-colors duration-300 ${darkMode ? 'bg-slate-900/30 border-slate-850' : 'bg-slate-50/50 border-slate-100'}`}>
              <div className="max-w-[1100px] mx-auto">
                <div className="text-center mb-10">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${darkMode ? 'bg-blue-950/50 text-blue-400' : 'bg-[#eef1ff] text-[#4f6ef7]'}`}>
                    ★★★★★
                  </span>
                  <h2 className={`text-2xl md:text-3xl font-black mt-3 mb-2.5 tracking-tight ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                    {OTHER_TEXTS.reviewsTitle[language] || OTHER_TEXTS.reviewsTitle['de']}
                  </h2>
                  <p className={`text-xs md:text-sm max-w-xl mx-auto leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>
                    {OTHER_TEXTS.reviewsSubtitle[language] || OTHER_TEXTS.reviewsSubtitle['de']}
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* LEFT COLUMN: STATS SUMMARY & REVIEW FORM */}
                  <div className="lg:col-span-12 xl:col-span-5 space-y-6">
                    {/* Rating statistics card */}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-905 border-slate-800' : 'bg-white border-[#e2e5f1] shadow-sm'}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <p className={`text-3xl font-extrabold pb-0.5 ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                            {(() => {
                              const total = customReviews.length + INITIAL_REVIEWS.length;
                              const sum = [...customReviews, ...INITIAL_REVIEWS].reduce((acc, r) => acc + r.rating, 0);
                              return total > 0 ? (sum / total).toFixed(1) : "5.0";
                            })()}
                          </p>
                          <p className="text-[10px] uppercase font-bold text-slate-405 tracking-wider">
                            {OTHER_TEXTS.averageRatingLabel[language] || OTHER_TEXTS.averageRatingLabel['de']}
                          </p>
                        </div>
                        <div className="flex-1">
                          <div className="flex gap-0.5 text-yellow-500 text-sm">
                            {[1, 2, 3, 4, 5].map((_, i) => <span key={i}>★</span>)}
                          </div>
                          <p className="text-[11px] text-[#4a4e6a] dark:text-slate-400 mt-1 font-bold">
                            {(customReviews.length + INITIAL_REVIEWS.length)} {OTHER_TEXTS.totalReviewsLabel[language] || OTHER_TEXTS.totalReviewsLabel['de']}
                          </p>
                        </div>
                      </div>

                      {/* Progress tracks */}
                      <div className="mt-4 space-y-2.5 border-t pt-3.5 border-slate-100 dark:border-slate-850">
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const items = [...customReviews, ...INITIAL_REVIEWS];
                          const total = items.length;
                          const count = items.filter(r => r.rating === stars).length;
                          const percentage = total > 0 ? (count / total) * 100 : 0;
                          return (
                            <div key={stars} className="flex items-center gap-2 text-[11px] font-semibold text-slate-440">
                              <span className="w-4 shrink-0 text-right">{stars}★</span>
                              <div className="flex-1 h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                <div className="bg-yellow-400 h-full rounded-full transition-all duration-500" style={{ width: `${percentage}%` }}></div>
                              </div>
                              <span className="w-8 text-right shrink-0">{Math.round(percentage)}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Submit Review Form */}
                    <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-905 border-slate-800' : 'bg-white border-[#e2e5f1] shadow-sm'}`}>
                      <h3 className={`font-black text-xs mb-4 tracking-tight flex items-center gap-1.5 uppercase tracking-wider ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>
                        {OTHER_TEXTS.writeReviewTitle[language] || OTHER_TEXTS.writeReviewTitle['de']}
                      </h3>
                      <form onSubmit={handleAddReviewSubmit} className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                            {OTHER_TEXTS.nameLabel[language] || OTHER_TEXTS.nameLabel['de']}
                          </label>
                          <input 
                            type="text" 
                            required
                            placeholder={currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "z.B. Aleks S."}
                            value={rName}
                            onChange={(e) => setRName(e.target.value)}
                            className={`w-full text-xs font-bold px-3 py-2.5 rounded-xl border-2 outline-none transition ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-[#f7f8fc] border-slate-200 text-slate-900 focus:border-[#4f6ef7]'}`}
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                              {OTHER_TEXTS.ratingLabel[language] || OTHER_TEXTS.ratingLabel['de']}
                            </label>
                            <div className="flex gap-1.5 mt-2">
                              {[1, 2, 3, 4, 5].map((stars) => (
                                <button 
                                  key={stars}
                                  type="button"
                                  onClick={() => setRRating(stars)}
                                  className={`text-lg transition-transform active:scale-95 cursor-pointer ${rRating >= stars ? 'text-yellow-400' : 'text-slate-300 dark:text-slate-700'}`}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                              {OTHER_TEXTS.modelLabel[language] || OTHER_TEXTS.modelLabel['de']}
                            </label>
                            <select 
                              value={rModel}
                              onChange={(e) => setRModel(e.target.value)}
                              className={`w-full text-xs font-bold px-3 py-2 rounded-xl border-2 outline-none transition cursor-pointer ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-[#f7f8fc] border-slate-200 text-slate-900 focus:border-[#4f6ef7]'}`}
                            >
                              <option value="AlerksAI Max">AlerksAI Max</option>
                              <option value="AlerksAI neo">AlerksAI neo</option>
                              <option value="AlerksAI Pro">AlerksAI Pro</option>
                              <option value="AlerksAI Intelegence">AlerksAI Intelegence</option>
                              <option value="AlerksAI Business">AlerksAI Business</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                            {OTHER_TEXTS.commentLabel[language] || OTHER_TEXTS.commentLabel['de']}
                          </label>
                          <textarea 
                            rows={3}
                            required
                            placeholder={language === 'de' ? "Ich finde AlerksAI super, weil..." : "I love AlerksAI because..."}
                            value={rText}
                            onChange={(e) => setRText(e.target.value)}
                            className={`w-full text-xs font-bold px-3 py-2 rounded-xl border-2 outline-none transition resize-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white focus:border-blue-500' : 'bg-[#f7f8fc] border-slate-200 text-slate-900 focus:border-[#4f6ef7]'}`}
                          />
                        </div>

                        <button 
                          type="submit"
                          className="w-full py-3 bg-[#4f6ef7] hover:bg-[#6c83f8] text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all cursor-pointer"
                        >
                          {OTHER_TEXTS.submitReviewBtn[language] || OTHER_TEXTS.submitReviewBtn['de']}
                        </button>
                      </form>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: REVIEWS FEED */}
                  <div className="lg:col-span-12 xl:col-span-7">
                    <div className="max-h-[550px] overflow-y-auto pr-2 space-y-4 scrollbar-thin">
                      {[...customReviews, ...INITIAL_REVIEWS].map((review) => (
                        <div 
                          key={review.id} 
                          className={`p-4 rounded-xl border relative transition-all group ${darkMode ? 'bg-slate-900 border-slate-850' : 'bg-white border-[#e2e5f1] shadow-sm'}`}
                        >
                          {review.isCustom && (
                            <button 
                              type="button"
                              onClick={() => {
                                const updated = customReviews.filter(r => r.id !== review.id);
                                setCustomReviews(updated);
                                localStorage.setItem('aleksai_custom_reviews', JSON.stringify(updated));
                                triggerToast(language === 'de' ? 'Bewertung gelöscht' : 'Review deleted');
                              }}
                              className="absolute top-3.5 right-3.5 opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 font-extrabold text-xs transition cursor-pointer"
                              title="Delete review"
                            >
                              ✕
                            </button>
                          )}

                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-yellow-400 text-xs font-semibold select-none">
                              {"★".repeat(review.rating)}{"☆".repeat(5-review.rating)}
                            </span>
                            <span className="text-[9px] opacity-65 font-bold uppercase tracking-wider">
                              via {review.model}
                            </span>
                          </div>

                          <p className={`text-xs leading-relaxed font-normal mb-2.5 ${darkMode ? 'text-slate-300' : 'text-[#4a4e6a]'}`}>
                            "{review.text}"
                          </p>

                          <div className="flex justify-between items-center border-t border-slate-100 dark:border-slate-850/65 pt-2.5">
                            <span className={`text-[11px] font-black ${darkMode ? 'text-blue-400' : 'text-[#4f6ef7]'}`}>
                              {review.name}
                            </span>
                            <span className="text-[10px] text-slate-440 font-bold">
                              {review.date}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}

        {/* ── MAIN CHAT WORKSPACE SCREEN ── */}
        {currentPage === 'chat' && (
          <div className="h-[calc(100vh-64px)] flex overflow-hidden">
            {/* Sidebar with list */}
            {isSidebarOpen && (
              <aside className={`w-72 border-r flex flex-col p-4 shrink-0 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#f7f8fc] border-[#e2e5f1]'}`}>
                <div className="flex justify-between items-center mb-2.5">
                  <span className={`text-[10px] font-black uppercase tracking-wider ${darkMode ? 'text-slate-500' : 'text-[#8b90a8]'}`}>{language === 'de' ? 'Verlauf / Chats' : `${t('chat')}s`}</span>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className={`p-1 rounded-lg transition-colors border cursor-pointer hover:scale-102 active:scale-98 transition ${
                      darkMode 
                        ? 'bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border-slate-700' 
                        : 'bg-white hover:bg-slate-100 text-[#4a4e6a] hover:text-slate-950 border-[#e2e5f1] shadow-sm'
                    }`}
                    title={language === 'de' ? 'Verlauf schließen' : 'Close history'}
                  >
                    <span className="text-[10px] font-black px-1.5 py-0.5 flex items-center justify-center gap-1 uppercase tracking-wider">
                      ✕ {language === 'de' ? 'Schließen' : 'Close'}
                    </span>
                  </button>
                </div>
                <button 
                  onClick={startNewChat}
                  className="w-full bg-[#4f6ef7] hover:bg-[#6c83f8] text-white rounded-xl py-2.5 px-4 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition cursor-pointer mb-4 shadow"
                >
                  <span>+</span> {t('newChat')}
                </button>

                <div className="flex-1 overflow-y-auto space-y-1">
                  {sessions.length === 0 ? (
                    <div className="text-center py-6 text-xs text-slate-400">{t('noChats')}</div>
                  ) : (
                    sessions.map(s => {
                      const isEditingThisS = editingSessionId === s.id;
                      
                      return (
                        <div 
                          key={s.id}
                          onClick={() => {
                            if (!isEditingThisS) {
                              loadChatSession(s.id);
                            }
                          }}
                          onMouseDown={() => startHold(s.id, s.title)}
                          onMouseUp={cancelHold}
                          onMouseLeave={cancelHold}
                          onTouchStart={() => startHold(s.id, s.title)}
                          onTouchEnd={cancelHold}
                          className={`group p-2.5 rounded-xl text-xs sm:text-[13px] flex items-center justify-between cursor-pointer transition relative select-none ${s.id === activeSessionId ? (darkMode ? 'bg-slate-800 text-white font-bold' : 'bg-[#eef0f8] text-[#0d0f1a] font-bold') : (darkMode ? 'text-slate-400 hover:bg-slate-850/50 hover:text-white' : 'text-[#4a4e6a] hover:bg-[#eef0f8]/50')}`}
                          title={language === 'de' ? "Gedrückt halten zum Umbenennen / Löschen" : "Hold down to rename / delete"}
                        >
                          {isEditingThisS ? (
                            <div className="flex items-center gap-1.5 w-full pr-1" onClick={(e) => e.stopPropagation()}>
                              <input 
                                type="text"
                                value={editingTitle}
                                onChange={(e) => setEditingTitle(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    setSessions(prev => prev.map(item => item.id === s.id ? { ...item, title: editingTitle } : item));
                                    setEditingSessionId(null);
                                    triggerToast('Erfolgreich umbenannt!');
                                  } else if (e.key === 'Escape') {
                                    setEditingSessionId(null);
                                  }
                                }}
                                className={`text-xs px-2 py-0.5 rounded w-full border outline-none font-sans font-normal ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-350 text-slate-900'}`}
                                autoFocus
                              />
                              <button 
                                onClick={() => {
                                  setSessions(prev => prev.map(item => item.id === s.id ? { ...item, title: editingTitle } : item));
                                  setEditingSessionId(null);
                                  triggerToast('Erfolgreich umbenannt!');
                                }}
                                className="text-emerald-500 font-bold px-1 text-xs"
                                title="Speichern"
                              >
                                ✓
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 truncate text-xs">
                                <ModelLogo model={s.model} className="w-3.5 h-3.5" />
                                <p className="truncate pr-1">{s.title}</p>
                              </div>
                              
                              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition duration-155">
                                {/* Rename Pen */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingSessionId(s.id);
                                    setEditingTitle(s.title);
                                  }}
                                  className="text-stone-400 hover:text-blue-500 px-0.5 text-xs"
                                  title="Umbenennen"
                                >
                                  ✏️
                                </button>
                                
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSessions(prev => prev.filter(item => item.id !== s.id));
                                    if (activeSessionId === s.id) {
                                      setActiveSessionId(null);
                                    }
                                    triggerToast('Gespräch gelöscht');
                                  }}
                                  className="text-stone-400 hover:text-red-500 px-0.5 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Remaining credits status visual and Promo Code Field */}
                {currentUser && (
                  <div className="mt-auto space-y-2.5">
                    <div className={`border rounded-xl p-4 transition-colors ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#eef1ff] border-blue-200/50'}`}>
                      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${darkMode ? 'text-blue-400' : 'text-[#4f6ef7]'}`}>⚡ {t('credits')}</p>
                      <div className="flex justify-between items-baseline mb-2">
                        <span className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-[#4a4e6a]'}`}>{currentUser.credits}</span>
                        <span className="text-[9px] opacity-75 font-semibold">Täglich +100</span>
                      </div>
                      <div className={`w-full h-1.5 rounded-full overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`}>
                        <div 
                          className="bg-[#4f6ef7] h-full rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, Math.max(0, (currentUser.credits / 100) * 100))}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Promocode Redeem Input Container */}
                    <div className={`border rounded-xl p-3 flex flex-col gap-1.5 text-left transition-colors duration-200 ${darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-white border-slate-200/60 shadow-sm'}`}>
                      <div className="flex items-center gap-1">
                        <span className="text-amber-500 font-extrabold text-[10px] uppercase tracking-widest">🎁 Code einlösen</span>
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={profileCouponCode}
                          placeholder="z.B. ALEKSVIP..."
                          onChange={(e) => setProfileCouponCode(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleRedeemCoupon(profileCouponCode);
                            }
                          }}
                          className={`flex-1 min-w-0 px-2.5 py-1.5 text-[10.5px] rounded-lg border focus:outline-none focus:border-amber-500 uppercase font-mono font-bold transition-all ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-150 placeholder-slate-600' : 'bg-[#f7f8fc] border-slate-200 text-slate-900 placeholder-slate-400'}`}
                        />
                        <button
                          onClick={() => handleRedeemCoupon(profileCouponCode)}
                          className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-95 text-white text-[10.5px] font-black px-3 py-1.5 rounded-lg transition shrink-0 cursor-pointer shadow-sm uppercase tracking-wider"
                        >
                          Einlösen
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </aside>
            )}

            {/* Chat Frame Panel */}
            <div className={`flex-1 flex flex-col overflow-hidden relative ${darkMode ? 'bg-[#0f172a]' : isStartPage ? 'bg-[#fff5f8]' : 'bg-white'}`}>
              
              {isStartPage && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
                  {/* Blended pink / rose glowing ambient circles */}
                  <div className="absolute top-[15%] left-[25%] -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] rounded-full bg-pink-500/15 dark:bg-pink-500/10 blur-[80px] sm:blur-[120px] animate-pulse duration-[8000ms]" />
                  <div className="absolute bottom-[20%] right-[20%] translate-x-1/2 translate-y-1/2 w-[400px] sm:w-[600px] h-[400px] sm:h-[600px] rounded-full bg-rose-500/15 dark:bg-rose-600/10 blur-[100px] sm:blur-[150px] animate-pulse duration-[12000ms]" />
                  <div className="absolute top-[60%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[450px] h-[300px] sm:h-[450px] rounded-full bg-fuchsia-500/15 dark:bg-fuchsia-600/10 blur-[90px] sm:blur-[130px]" />
                </div>
              )}
              
              {/* Header with collapsible toggle and current active model */}
              <div className={`px-4 py-3 border-b flex items-center justify-between transition-colors ${darkMode ? 'bg-slate-900 border-slate-850' : 'bg-slate-50 border-[#e2e5f1]'}`}>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl font-bold text-xs border transition-all hover:scale-103 ${darkMode ? 'bg-slate-800 hover:bg-slate-755 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-100 border-[#e2e5f1] text-[#4a4e6a]'}`}
                    title="Verlauf umschalten"
                  >
                    <span>💬</span>
                    <span>{isSidebarOpen ? 'Verlauf aus' : 'Verlauf ein'}</span>
                  </button>
                  <span className="text-[10px] uppercase font-black tracking-widest text-[#8b90a8] hidden sm:inline">AlerksAI WorkSpace</span>
                </div>
                
                {activeSessionObj && (
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#4f6ef7]">
                    <ModelLogo model={activeSessionObj.model} className="w-4 h-4" />
                    <span className="opacity-80 text-[11px] truncate max-w-[120px] sm:max-w-none">{MODEL_DETAILS[activeSessionObj.model]?.shortName || MODEL_DETAILS[activeSessionObj.model]?.name}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5">
                {isLiveModeActive ? (
                  <div className="h-full min-h-[350px] flex flex-col items-center justify-between py-6 max-w-lg mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
                    {/* Header info */}
                    <div className="space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase font-black tracking-widest bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 animate-pulse">
                        <Radio className="w-3 h-3 text-indigo-500" />
                        {language === 'de' ? 'Sprachverbindung Aktiv' : 'Voice Link Active'}
                      </span>
                      <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                        AlerksAI Voice-Channel v2.5
                      </p>
                    </div>

                    {/* Calling Animation Circle */}
                    <div className="relative my-8 flex items-center justify-center">
                      {/* Pulse rings */}
                      <div className={`absolute w-36 h-36 rounded-full border border-indigo-500/20 animate-ping duration-1000 ${liveStatus === 'listening' ? 'opacity-100' : 'opacity-0'}`} />
                      <div className={`absolute w-44 h-44 rounded-full border border-indigo-500/10 animate-pulse ${liveStatus === 'speaking' ? 'opacity-100' : 'opacity-0'}`} />
                      
                      <div className={`w-28 h-28 rounded-full flex flex-col items-center justify-center relative shadow-2xl transition-all duration-500 border-4 ${
                        liveStatus === 'listening'
                          ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)]'
                          : liveStatus === 'speaking'
                            ? 'bg-emerald-600/10 border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                            : liveStatus === 'processing'
                              ? 'bg-amber-600/10 border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.4)]'
                              : 'bg-slate-800/10 border-slate-700'
                      }`}>
                        {/* Center Icon */}
                        {liveStatus === 'listening' ? (
                          <Mic className="w-10 h-10 text-indigo-500 animate-bounce" />
                        ) : liveStatus === 'speaking' ? (
                          <Volume2 className="w-10 h-10 text-emerald-500 animate-pulse" />
                        ) : liveStatus === 'processing' ? (
                          <Loader2 className="w-10 h-10 text-amber-500 animate-spin" />
                        ) : (
                          <Radio className="w-10 h-10 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Status Text & Real-time Transcript */}
                    <div className="space-y-4 px-4 w-full">
                      <div>
                        <h3 className="text-lg font-black tracking-tight text-slate-800 dark:text-white">
                          {liveStatus === 'listening' && (language === 'de' ? 'Ich höre zu...' : 'Listening to you...')}
                          {liveStatus === 'speaking' && (language === 'de' ? 'AlerksAI spricht...' : 'AlerksAI is speaking...')}
                          {liveStatus === 'processing' && (language === 'de' ? 'Nachdenken...' : 'Thinking...')}
                          {liveStatus === 'idle' && (language === 'de' ? 'Bereit für Gespräch' : 'Ready to speak')}
                        </h3>
                        <p className={`text-[11px] font-bold ${
                          liveStatus === 'listening' ? 'text-indigo-500' : liveStatus === 'speaking' ? 'text-emerald-500' : 'text-slate-400'
                        }`}>
                          {liveStatus === 'listening' && (language === 'de' ? 'Spreche jetzt ganz natürlich' : 'Speak normally now')}
                          {liveStatus === 'speaking' && (language === 'de' ? 'Text-to-Speech aktiv' : 'Text-to-Speech active')}
                          {liveStatus === 'processing' && (language === 'de' ? 'Antwort wird formuliert' : 'Formulating reply')}
                          {liveStatus === 'idle' && (language === 'de' ? 'Sag einfach etwas...' : 'Just say something...')}
                        </p>
                      </div>

                      {/* Live spoken feedback card */}
                      <div className={`p-4 rounded-2xl border min-h-[60px] flex items-center justify-center max-w-sm mx-auto transition ${
                        darkMode ? 'bg-slate-950/60 border-slate-850' : 'bg-[#f8f9fc] border-[#e2e5f1]'
                      }`}>
                        {activeSpokenText ? (
                          <p className="text-xs font-semibold leading-relaxed text-slate-800 dark:text-slate-200 select-all">
                            "{activeSpokenText}"
                          </p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">
                            {language === 'de' ? 'Noch keine Worte erkannt...' : 'No spoken words detected yet...'}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Call Utilities / Actions Row */}
                    <div className="flex items-center gap-3 mt-6">
                      {/* Mic active toggle */}
                      <button
                        onClick={() => {
                          const nextVal = !micActive;
                          setMicActive(nextVal);
                          if (nextVal) {
                            triggerToast(language === 'de' ? 'Mikrofon eingeschaltet' : 'Microphone unmuted');
                          } else {
                            stopSpeechRecognition();
                            triggerToast(language === 'de' ? 'Mikrofon stummgeschaltet' : 'Microphone muted');
                          }
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                          micActive 
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-200' 
                            : 'bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20'
                        }`}
                        title={micActive ? (language === 'de' ? 'Mikrofon stumm' : 'Mute Mic') : (language === 'de' ? 'Mikrofon an' : 'Unmute Mic')}
                      >
                        {micActive ? <Mic className="w-4.5 h-4.5" /> : <MicOff className="w-4.5 h-4.5" />}
                      </button>

                      {/* Red Hang Up Button */}
                      <button
                        onClick={() => {
                          setIsLiveModeActive(false);
                          stopSpeechRecognition();
                          if (window.speechSynthesis) {
                            window.speechSynthesis.cancel();
                          }
                          triggerToast(language === 'de' ? 'Sprachanruf beendet' : 'Voice Call ended');
                        }}
                        className="bg-red-600 hover:bg-red-500 hover:scale-105 active:scale-95 text-white font-bold text-xs px-6 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-red-500/20 transition cursor-pointer"
                      >
                        <PhoneOff className="w-4 h-4" />
                        <span>{language === 'de' ? 'Anruf beenden' : 'End Call'}</span>
                      </button>

                      {/* Silent mode toggle */}
                      <button
                        onClick={() => {
                          const nextVal = !isSilentMode;
                          setIsSilentMode(nextVal);
                          if (nextVal) {
                            if (window.speechSynthesis) window.speechSynthesis.cancel();
                            triggerToast(language === 'de' ? 'AI-Stimme stumm' : 'AI voice muted');
                          } else {
                            triggerToast(language === 'de' ? 'AI-Stimme aktiv' : 'AI voice active');
                          }
                        }}
                        className={`w-11 h-11 rounded-full flex items-center justify-center border transition-all cursor-pointer ${
                          !isSilentMode 
                            ? 'bg-slate-100 hover:bg-slate-200 border-slate-250 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-750 dark:border-slate-700 dark:text-slate-200' 
                            : 'bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20'
                        }`}
                        title={!isSilentMode ? (language === 'de' ? 'Stimme aus' : 'Mute Voice') : (language === 'de' ? 'Stimme an' : 'Unmute Voice')}
                      >
                        {!isSilentMode ? <Volume2 className="w-4.5 h-4.5" /> : <VolumeX className="w-4.5 h-4.5" />}
                      </button>
                    </div>
                  </div>
                ) : !activeSessionObj || activeSessionObj.messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-8">
                    <div className="rainbow-border-container !rounded-full !p-[2.5px] mb-4 shadow-lg animate-bounce duration-[3000ms]">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl ${darkMode ? 'bg-slate-900 text-white' : 'bg-white text-[#4f6ef7]'}`}>
                        <AleksAILogo className="w-6 h-6 text-[#4f6ef7]" glow={true} />
                      </div>
                    </div>
                    <h2 className="text-lg font-extrabold mb-1">{t('greeting')}</h2>
                    <p className={`text-xs md:text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-[#4a4e6a]'}`}>
                      {t('greetingDesc')}
                    </p>
                    {activeSessionObj && (
                      <div className={`mt-4 px-3.5 py-1 rounded-full text-[10px] sm:text-xs font-black flex items-center gap-1.5 border ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a]'}`}>
                        {t('activeModelLabel')}: <ModelLogo model={activeSessionObj.model} className="w-3.5 h-3.5 inline-block" /> {MODEL_DETAILS[activeSessionObj.model].name}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="max-w-3xl mx-auto space-y-5">
                    {activeSessionObj.messages.map((msg, i) => (
                      <div key={i} className={`flex gap-3.5 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        {/* Avatar */}
                        <div className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center font-bold text-[12px] shadow-sm ${msg.role === 'user' ? 'bg-gradient-to-tr from-[#22c55e] to-[#16a34a] text-white' : 'bg-gradient-to-tr from-[#4f6ef7] to-[#8b5cf6] text-white'}`}>
                          {msg.role === 'user' ? (
                            currentUser?.profilePic ? (
                              <img src={currentUser.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              currentUser?.firstName[0].toUpperCase() ?? 'U'
                            )
                          ) : (
                            msg.model && MODEL_DETAILS[msg.model] ? (
                              <ModelLogo model={msg.model} className="w-5 h-5" />
                            ) : (
                              <AleksAILogo className="w-5 h-5 text-white" />
                            )
                          )}
                        </div>
                        {/* Message content bubble wrapper */}
                        <div className={`${msg.role === 'ai' ? 'w-full' : 'max-w-[85%]'} flex flex-col`}>
                          {/* Image Attachment Rendering */}
                          {msg.imageUrl && (
                            <div className="mb-2 relative group overflow-hidden rounded-2xl max-w-sm sm:max-w-md max-h-72 border border-slate-205/15 shadow-md">
                              <img 
                                src={msg.imageUrl} 
                                alt="Attachment" 
                                className="w-full h-full object-cover transition duration-350 group-hover:scale-102"
                                referrerPolicy="no-referrer"
                              />
                            </div>
                          )}

                          {/* File Attachment Card Rendering */}
                          {msg.fileName && (
                            <div className={`flex items-center gap-2.5 p-2.5 mb-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-850 border-slate-750 text-slate-100' : 'bg-slate-50 border-slate-200 text-slate-800'}`}>
                              <span className="text-xl">📄</span>
                              <div className="text-left font-sans text-[11px]">
                                <p className="font-extrabold truncate max-w-[150px]">{msg.fileName}</p>
                                <p className="text-[9px] opacity-65">{msg.fileSize || 'Größe unbekannt'}</p>
                              </div>
                            </div>
                          )}

                          <div className={msg.role === 'user' 
                            ? `rainbow-border-container rounded-2xl shadow-sm rounded-tr-sm` 
                            : `pl-1 pr-4 py-1 text-sm md:text-[15.5px] leading-relaxed select-text w-full ${darkMode ? 'text-slate-100' : 'text-[#0d0f1a]'}`
                          }>
                            {msg.role === 'ai' ? (
                              renderMessageContent(msg, i === activeSessionObj.messages.length - 1)
                            ) : (
                              <div className={darkMode ? "rainbow-border-inner-user" : "rainbow-border-inner-light-user"}>
                                <p className="text-sm md:text-[15px] whitespace-pre-wrap leading-relaxed select-text">{msg.content}</p>
                              </div>
                            )}
                          </div>

                          {/* Sound Player Rendering */}
                          {msg.role === 'ai' && msg.audioUrl === 'procedural' && msg.audioType === 'sound' && (
                            <ProceduralSoundPlayer 
                              soundType={msg.soundType || 'synth'} 
                              prompt={msg.content} 
                              darkMode={darkMode} 
                              language={language} 
                            />
                          )}

                          {/* Music Player Rendering */}
                          {msg.role === 'ai' && msg.audioUrl === 'procedural' && msg.audioType === 'music' && (
                            <ProceduralMusicPlayer 
                              musicStyle={msg.musicStyle || 'ambient'} 
                              prompt={msg.content} 
                              darkMode={darkMode} 
                              language={language} 
                            />
                          )}

                          {/* Video Player Rendering */}
                          {msg.role === 'ai' && msg.videoUrl && (
                            <LoopingVideoPlayer 
                              videoUrl={msg.videoUrl} 
                              videoType={msg.videoType} 
                              videoTitle={msg.videoTitle} 
                              darkMode={darkMode} 
                              language={language} 
                            />
                          )}

                          {msg.role === 'ai' && msg.searchSources && msg.searchSources.length > 0 && (
                            <div className="mt-2.5 mb-2 p-3 rounded-xl border text-left bg-slate-50/50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800">
                              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-[#4f6ef7] tracking-wider mb-2">
                                <Globe className="w-3.5 h-3.5 text-[#4f6ef7] animate-pulse" />
                                <span>{language === 'de' ? 'Internetsuche: Quellen' : 'Internet Search: Sources'}</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.searchSources.map((source, idx) => (
                                  <a
                                    key={idx}
                                    href={source.uri}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1.5 text-[10.5px] font-semibold px-2 py-1.5 rounded-lg border bg-white dark:bg-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 border-slate-250 dark:border-slate-750 transition text-[#4f6ef7] hover:text-[#3b59df] max-w-xs truncate"
                                  >
                                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[9px]">[{idx + 1}]</span>
                                    <span className="truncate">{source.title || source.uri}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Copy, Listen and Ask follow-up Action Utilities */}
                          {msg.role === 'ai' && (
                            <div className="flex flex-wrap items-center gap-2 mt-3 p-1 select-none">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(msg.content);
                                  triggerToast(language === 'de' ? 'In Zwischenablage kopiert!' : 'Copied to clipboard!');
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold tracking-wide transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                  darkMode 
                                    ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-750 shadow-sm' 
                                    : 'bg-white hover:bg-slate-50 text-[#4a4e6a] hover:text-[#4f6ef7] border-[#e2e5f1] shadow-sm'
                                }`}
                                title={language === 'de' ? 'Kopieren' : 'Copy'}
                              >
                                <Copy className="w-3.5 h-3.5 text-[#4f6ef7]" />
                                <span>{language === 'de' ? 'Kopieren' : 'Copy'}</span>
                              </button>
                              
                              <button
                                onClick={() => {
                                  if ('speechSynthesis' in window) {
                                    if (window.speechSynthesis.speaking) {
                                      window.speechSynthesis.cancel();
                                      triggerToast(language === 'de' ? 'Vorlesen beendet' : 'Stopped speaking');
                                      return;
                                    }
                                    speakText(msg.content, false);
                                    triggerToast(language === 'de' ? 'Lese laut vor...' : 'Speaking...');
                                  } else {
                                    triggerToast('TTS nicht unterstützt.');
                                  }
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold tracking-wide transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                  darkMode 
                                    ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-750 shadow-sm' 
                                    : 'bg-white hover:bg-slate-50 text-[#4a4e6a] hover:text-[#e11d48] border-[#e2e5f1] shadow-sm'
                                }`}
                                title={language === 'de' ? 'Anhören' : 'Listen'}
                              >
                                <Volume2 className="w-3.5 h-3.5 text-[#e11d48]" />
                                <span>{language === 'de' ? 'Anhören' : 'Listen'}</span>
                              </button>
 
                              <button
                                onClick={() => {
                                  setChatInput(language === 'de' ? 'Dazu eine Frage: ' : 'Follow-up question: ');
                                  setTimeout(() => {
                                    chatInputRef.current?.focus();
                                  }, 80);
                                }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[11px] font-extrabold tracking-wide transition cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                                  darkMode 
                                    ? 'bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-750 shadow-sm' 
                                    : 'bg-white hover:bg-slate-50 text-[#4a4e6a] hover:text-[#10b981] border-[#e2e5f1] shadow-sm'
                                }`}
                                title={language === 'de' ? 'Dazu etwas fragen' : 'Ask about this'}
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-[#10b981]" />
                                <span>{language === 'de' ? 'Dazu etwas fragen' : 'Ask about this'}</span>
                              </button>
                            </div>
                          )}

                          <span className="text-[9px] text-[#8b90a8] mt-2 select-none font-semibold px-1 flex gap-2 items-center">
                            {msg.timestamp}
                            {msg.role === 'ai' && msg.model && (
                              <span className={`px-1.5 py-0.5 rounded-md font-bold text-[8px] border ${darkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-[#eef0f8] border-[#e2e5f1]/60 text-[#4a4e6a]'}`}>
                                {MODEL_DETAILS[msg.model].shortName}
                              </span>
                            )}
                          </span>
                        </div>
                      </div>
                    ))}
                    
                    {/* Running generation indicator */}
                    {isGenerating && (
                      <div className="flex gap-3.5 items-start">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#4f6ef7] to-[#8b5cf6] flex items-center justify-center text-white font-bold text-[12px] shadow-sm">
                          {activeModel && MODEL_DETAILS[activeModel] ? (
                            <ModelLogo model={activeModel} className="w-5 h-5" />
                          ) : (
                            <AleksAILogo className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div className="py-2.5 px-1 max-w-[80%]">
                          <div className="typing-dots flex gap-1.5 items-center justify-start">
                            <span className="w-2.5 h-2.5 bg-[#4f6ef7] rounded-full animate-bounce"></span>
                            <span className="w-2.5 h-2.5 bg-[#4f6ef7] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                            <span className="w-2.5 h-2.5 bg-[#4f6ef7] rounded-full animate-bounce [animation-delay:0.4s]"></span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Chat Send Area Controls */}
              <div className={`p-4 border-t transition-colors ${darkMode ? 'bg-[#0f172a] border-slate-850' : 'bg-white border-[#e2e5f1]'}`}>
                <div className="max-w-3xl mx-auto">
                  {currentUser && currentUser.credits <= 0 && !(currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && localStorage.getItem('aleksai_admin_infinite') === 'true') && (
                    <div className="bg-[#fef3c7] border border-[#fbbf24] rounded-xl px-4 py-2.5 mb-3 text-[11px] text-[#92400e] text-center font-bold">
                      {t('noCreditsText')}
                    </div>
                  )}

                  <div className={`border-2 p-2 rounded-2xl flex flex-col gap-2 transition ${darkMode ? 'bg-slate-900 border-slate-800 focus-within:border-blue-500' : 'bg-[#f7f8fc] border-[#e2e5f1] focus-within:border-[#4f6ef7]'}`}>
                      {/* Realtime-Websearch & Study-Mode dynamic toggles row */}
                    <div className="flex flex-wrap items-center gap-2.5 px-2 py-1 text-[10.5px] font-black border-b border-dashed dark:border-slate-800 border-slate-200 pb-2 mb-1">
                      <div className="relative">
                        <button
                          onClick={() => setIsOptionsDropdownOpen(!isOptionsDropdownOpen)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-200 cursor-pointer text-[10.5px] font-black tracking-wide ${
                            isWebSearchActive || isStudyModeActive || isLiveModeActive
                              ? 'bg-[#4f6ef7]/10 text-[#4f6ef7] border-[#4f6ef7]/30 shadow-sm'
                              : (darkMode ? 'text-slate-400 border-slate-800 hover:bg-slate-850 hover:text-slate-200' : 'text-slate-500 border-slate-200/90 hover:bg-slate-100 hover:text-[#4f6ef7]')
                          }`}
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5 text-[#4f6ef7]" />
                          <span>{language === 'de' ? 'Smarte Assistenten-Optionen' : 'Smart Assistant Options'}</span>
                          <div className="flex items-center gap-1">
                            {isWebSearchActive && <span className="text-[9px] bg-[#4f6ef7]/20 px-1 py-0.5 rounded text-[#4f6ef7]">🌐 WEB</span>}
                            {isStudyModeActive && <span className="text-[9px] bg-emerald-500/20 px-1 py-0.5 rounded text-emerald-500">🎓 SCHULE</span>}
                            {isLiveModeActive && <span className="text-[9px] bg-indigo-500/20 px-1 py-0.5 rounded text-indigo-500">🎙️ ANRUF</span>}
                          </div>
                          <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isOptionsDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        {isOptionsDropdownOpen && (
                          <>
                            <div 
                              className="fixed inset-0 z-40" 
                              onClick={() => setIsOptionsDropdownOpen(false)} 
                            />
                            <div className={`absolute left-0 bottom-full mb-2 w-72 rounded-2xl p-4 shadow-2xl border z-50 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
                              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-150 text-slate-800'
                            }`}>
                              <div className="flex items-center justify-between pb-2 border-b border-dashed dark:border-slate-800 border-slate-200 mb-3">
                                <span className="text-[10px] font-black uppercase tracking-wider text-[#4f6ef7]">
                                  {language === 'de' ? 'Assistenten-Modifikationen' : 'Assistant Modifiers'}
                                </span>
                                <span className="text-[9px] font-bold text-slate-400">
                                  {language === 'de' ? 'Konfigurieren' : 'Configure'}
                                </span>
                              </div>

                              <div className="space-y-3.5">
                                {/* Option 1: Internetsuche */}
                                <label className="flex items-start gap-3 cursor-pointer group select-none">
                                  <input
                                    type="checkbox"
                                    checked={isWebSearchActive}
                                    onChange={() => {
                                      setIsWebSearchActive(!isWebSearchActive);
                                      triggerToast(
                                        !isWebSearchActive
                                          ? (language === 'de' ? '🌐 Echtzeit-Internetsuche aktiviert.' : '🌐 Real-time internet search enabled.')
                                          : (language === 'de' ? 'Internetsuche deaktiviert' : 'Internet search disabled')
                                      );
                                    }}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#4f6ef7] focus:ring-[#4f6ef7] cursor-pointer"
                                  />
                                  <div>
                                    <div className="text-[11.5px] font-black flex items-center gap-1.5 text-slate-800 dark:text-white">
                                      <Globe className={`w-3.5 h-3.5 ${isWebSearchActive ? 'text-[#4f6ef7]' : 'text-slate-400'}`} />
                                      <span>{language === 'de' ? 'Echtzeit-Internetsuche' : 'Real-time Web Search'}</span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                                      {language === 'de' 
                                        ? 'AlerksAI sucht live im Web nach aktuellen Ereignissen und Quellennachweisen.' 
                                        : 'AlerksAI searches the web live for real-time events and dynamic source links.'}
                                    </p>
                                  </div>
                                </label>

                                {/* Option 2: Schulmodus */}
                                <label className="flex items-start gap-3 cursor-pointer group select-none">
                                  <input
                                    type="checkbox"
                                    checked={isStudyModeActive}
                                    onChange={() => {
                                      setIsStudyModeActive(!isStudyModeActive);
                                      triggerToast(
                                        !isStudyModeActive
                                          ? (language === 'de' ? '🎓 Schulmodus aktiv! AlerksAI fokussiert sich rein auf Schule.' : '🎓 Study mode active! AlerksAI is now focused only on learning.')
                                          : (language === 'de' ? 'Schulmodus deaktiviert' : 'Study mode disabled')
                                      );
                                    }}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                                  />
                                  <div>
                                    <div className="text-[11.5px] font-black flex items-center gap-1.5 text-slate-800 dark:text-white">
                                      <GraduationCap className={`w-3.5 h-3.5 ${isStudyModeActive ? 'text-emerald-500' : 'text-slate-400'}`} />
                                      <span>{language === 'de' ? 'Premium Schulmodus' : 'Premium Study Mode'}</span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                                      {language === 'de'
                                        ? 'Konzentriert AlerksAI rein auf pädagogisch wertvolle Schulerklärungen und Hausaufgaben.'
                                        : 'Locks AlerksAI into dedicated educational help, preventing non-study distractions.'}
                                    </p>
                                  </div>
                                </label>

                                {/* Option 3: Live Sprach-Anruf */}
                                <label className="flex items-start gap-3 cursor-pointer group select-none">
                                  <input
                                    type="checkbox"
                                    checked={isLiveModeActive}
                                    onChange={() => {
                                      const nextVal = !isLiveModeActive;
                                      setIsLiveModeActive(nextVal);
                                      if (nextVal) {
                                        setMicActive(true);
                                        setIsSilentMode(false);
                                        triggerToast(
                                          language === 'de' 
                                            ? '🎙️ Live-Anruf gestartet! AlerksAI hört dir jetzt live zu.' 
                                            : '🎙️ Live Call started! AlerksAI is listening to you live.'
                                        );
                                      } else {
                                        triggerToast(
                                          language === 'de' 
                                            ? 'Live-Anruf beendet.' 
                                            : 'Live Call ended.'
                                        );
                                      }
                                    }}
                                    className="mt-0.5 h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                  />
                                  <div>
                                    <div className="text-[11.5px] font-black flex items-center gap-1.5 text-slate-800 dark:text-white">
                                      <Radio className={`w-3.5 h-3.5 ${isLiveModeActive ? 'text-indigo-500 animate-pulse' : 'text-slate-400'}`} />
                                      <span>{language === 'de' ? 'Echtzeit Sprach-Anruf' : 'Real-time Voice Call'}</span>
                                    </div>
                                    <p className="text-[9.5px] text-slate-400 font-medium leading-relaxed mt-0.5">
                                      {language === 'de'
                                        ? 'Telefoniere direkt per Sprache mit AlerksAI. Er spricht und hört dir vollautomatisch zu.'
                                        : 'Talk directly with AlerksAI using your voice. He will speak and listen in real-time.'}
                                    </p>
                                  </div>
                                </label>
                              </div>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Render active attachments if any */}
                    {attachedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 px-2 pt-1 border-b pb-2 border-slate-200 dark:border-slate-800">
                        {attachedFiles.map((file, idx) => (
                          <div 
                            key={idx} 
                            className={`flex items-center gap-2 p-1.5 rounded-xl border text-[11px] relative pr-6 ${darkMode ? 'bg-slate-850 border-slate-750 text-slate-100' : 'bg-white border-[#e2e5f1] text-[#0d0f1a]'}`}
                          >
                            {file.type.startsWith('image/') ? (
                              <img src={file.dataUrl} alt="Thumbnail" className="w-5 h-5 rounded-md object-cover" />
                            ) : (
                              <span>📄</span>
                            )}
                            <span className="font-extrabold max-w-[100px] truncate">{file.name}</span>
                            <span className="opacity-60 text-[9px]">{file.size}</span>
                            <button
                              onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] text-[#ef4444] font-black hover:scale-110 transition"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex items-end gap-2.5 w-full">
                      {/* Paperclip Button for file upload */}
                      <button
                        onClick={() => document.getElementById('aleksai-chat-file-uploader')?.click()}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                          darkMode 
                            ? 'bg-slate-850 hover:text-[#4f6ef7] hover:bg-slate-800 border-slate-750 text-slate-300' 
                            : 'bg-white hover:text-[#4f6ef7] hover:bg-slate-50 border-[#e2e5f1] text-[#4a4e6a]'
                        }`}
                        title={language === 'de' ? 'Dateien oder Bilder anhängen' : 'Attach files or images'}
                      >
                        <Paperclip className="w-4 h-4" />
                      </button>

                      {/* Creator Hub Button & Popover */}
                      <div className="relative shrink-0">
                        <button
                          onClick={() => setIsCreatorPopoverOpen(!isCreatorPopoverOpen)}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border cursor-pointer hover:scale-[1.02] active:scale-[0.98] ${
                            isImageGeneratorMode 
                              ? 'bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white border-transparent shadow-lg scale-105 animate-pulse' 
                              : isSoundGeneratorMode
                                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-white border-transparent shadow-lg scale-105 animate-pulse'
                                : isMusicGeneratorMode
                                  ? 'bg-gradient-to-tr from-emerald-500 to-teal-500 text-white border-transparent shadow-lg scale-105 animate-pulse'
                                  : isVideoGeneratorMode
                                    ? 'bg-gradient-to-tr from-indigo-500 via-blue-500 to-cyan-500 text-white border-transparent shadow-lg scale-105 animate-pulse'
                                    : (darkMode ? 'bg-slate-850 hover:bg-slate-800 border-slate-750 text-slate-300 hover:text-[#a855f7]' : 'bg-white hover:bg-slate-50 border-[#e2e5f1] text-[#4a4e6a] hover:text-[#a855f7]')
                          }`}
                          title={language === 'de' ? 'KI-Erstellungs-Hub' : 'AI Creator Hub'}
                        >
                          {isImageGeneratorMode && <span className="text-sm">🎨</span>}
                          {isSoundGeneratorMode && <span className="text-sm">🔊</span>}
                          {isMusicGeneratorMode && <span className="text-sm">🎵</span>}
                          {isVideoGeneratorMode && <span className="text-sm">🎬</span>}
                          {!isImageGeneratorMode && !isSoundGeneratorMode && !isMusicGeneratorMode && !isVideoGeneratorMode && (
                            <Sparkles className="w-4 h-4 animate-pulse" />
                          )}
                        </button>

                        {/* Floating Creator Popover */}
                        {isCreatorPopoverOpen && (
                          <>
                            <div className="fixed inset-0 z-40" onClick={() => setIsCreatorPopoverOpen(false)} />
                            <div className={`absolute bottom-12 left-0 w-64 p-3.5 rounded-2xl shadow-2xl border z-50 animate-in slide-in-from-bottom-2 duration-200 ${
                              darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-[#e2e5f1] text-[#0d0f1a]'
                            }`}>
                              <h3 className="text-[11px] font-black uppercase tracking-wider mb-2.5 opacity-75">
                                {language === 'de' ? 'AlerksAI Creator-Hub' : 'AlerksAI Creator Hub'}
                              </h3>
                              
                              <div className="space-y-1.5">
                                {/* Mode 1: Image Generator */}
                                <button
                                  onClick={() => {
                                    const active = !isImageGeneratorMode;
                                    setIsImageGeneratorMode(active);
                                    setIsSoundGeneratorMode(false);
                                    setIsMusicGeneratorMode(false);
                                    setIsVideoGeneratorMode(false);
                                    setIsCreatorPopoverOpen(false);
                                    triggerToast(
                                      active 
                                        ? (language === 'de' ? '🎨 Bildgenerator-Modus aktiv! Beschreibe dein Bild.' : '🎨 Image generator active!')
                                        : (language === 'de' ? 'Standard Chat-Modus' : 'Standard chat mode')
                                    );
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                                    isImageGeneratorMode 
                                      ? 'bg-pink-500/10 border-pink-500/20 text-pink-500 font-extrabold border' 
                                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-sm">🎨</span>
                                    <div className="text-[10.5px] leading-tight">
                                      <p className="font-extrabold">{language === 'de' ? 'Bild erstellen' : 'Create Image'}</p>
                                      <p className="text-[9px] opacity-60 font-medium">{language === 'de' ? 'Bilder per Text erzeugen' : 'Generate text-to-image'}</p>
                                    </div>
                                  </div>
                                  {isImageGeneratorMode && <span className="text-[9px] bg-pink-500/25 px-1.5 py-0.5 rounded-full">AKTIV</span>}
                                </button>

                                {/* Mode 2: Sound Generator */}
                                <button
                                  onClick={() => {
                                    const active = !isSoundGeneratorMode;
                                    setIsSoundGeneratorMode(active);
                                    setIsImageGeneratorMode(false);
                                    setIsMusicGeneratorMode(false);
                                    setIsVideoGeneratorMode(false);
                                    setIsCreatorPopoverOpen(false);
                                    triggerToast(
                                      active 
                                        ? (language === 'de' ? '🔊 Sound-Synthese aktiv! Beschreibe deinen Sound (z.B. Laser, Explosion).' : '🔊 Sound synthesis active!')
                                        : (language === 'de' ? 'Standard Chat-Modus' : 'Standard chat mode')
                                    );
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                                    isSoundGeneratorMode 
                                      ? 'bg-amber-500/10 border-amber-500/20 text-amber-500 font-extrabold border' 
                                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-sm">🔊</span>
                                    <div className="text-[10.5px] leading-tight">
                                      <p className="font-extrabold">{language === 'de' ? 'Sound-Effekt' : 'Create Sound'}</p>
                                      <p className="text-[9px] opacity-60 font-medium">{language === 'de' ? 'Soundeffekte synthetisieren' : 'Synthesize sound effects'}</p>
                                    </div>
                                  </div>
                                  {isSoundGeneratorMode && <span className="text-[9px] bg-amber-500/25 px-1.5 py-0.5 rounded-full">AKTIV</span>}
                                </button>

                                {/* Mode 3: Music Generator */}
                                <button
                                  onClick={() => {
                                    const active = !isMusicGeneratorMode;
                                    setIsMusicGeneratorMode(active);
                                    setIsImageGeneratorMode(false);
                                    setIsSoundGeneratorMode(false);
                                    setIsVideoGeneratorMode(false);
                                    setIsCreatorPopoverOpen(false);
                                    triggerToast(
                                      active 
                                        ? (language === 'de' ? '🎵 Musik-Komposition aktiv! Beschreibe deine Stimmung (z.B. Lofi, Techno).' : '🎵 Music composition active!')
                                        : (language === 'de' ? 'Standard Chat-Modus' : 'Standard chat mode')
                                    );
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                                    isMusicGeneratorMode 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500 font-extrabold border' 
                                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-sm">🎵</span>
                                    <div className="text-[10.5px] leading-tight">
                                      <p className="font-extrabold">{language === 'de' ? 'Musik komponieren' : 'Create Music'}</p>
                                      <p className="text-[9px] opacity-60 font-medium">{language === 'de' ? 'Atmosphärische Beats generieren' : 'Generate atmospheric beats'}</p>
                                    </div>
                                  </div>
                                  {isMusicGeneratorMode && <span className="text-[9px] bg-emerald-500/25 px-1.5 py-0.5 rounded-full">AKTIV</span>}
                                </button>

                                {/* Mode 4: Video Generator */}
                                <button
                                  onClick={() => {
                                    const active = !isVideoGeneratorMode;
                                    setIsVideoGeneratorMode(active);
                                    setIsImageGeneratorMode(false);
                                    setIsSoundGeneratorMode(false);
                                    setIsMusicGeneratorMode(false);
                                    setIsCreatorPopoverOpen(false);
                                    triggerToast(
                                      active 
                                        ? (language === 'de' ? '🎬 Video-Generator aktiv! Beschreibe deine Szene oder lade ein Foto hoch.' : '🎬 Video generator active!')
                                        : (language === 'de' ? 'Standard Chat-Modus' : 'Standard chat mode')
                                    );
                                  }}
                                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all cursor-pointer text-left ${
                                    isVideoGeneratorMode 
                                      ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-500 font-extrabold border' 
                                      : 'hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent'
                                  }`}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-sm">🎬</span>
                                    <div className="text-[10.5px] leading-tight">
                                      <p className="font-extrabold">{language === 'de' ? 'Video erstellen' : 'Create Video'}</p>
                                      <p className="text-[9px] opacity-60 font-medium">{language === 'de' ? 'Text oder Foto zu Video' : 'Text or photo to video'}</p>
                                    </div>
                                  </div>
                                  {isVideoGeneratorMode && <span className="text-[9px] bg-indigo-500/25 px-1.5 py-0.5 rounded-full">AKTIV</span>}
                                </button>
                              </div>
                            </div>
                          </>
                        )}
                      </div>

                      <textarea
                        ref={chatInputRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatFieldSubmit();
                          }
                        }}
                        placeholder={
                          isImageGeneratorMode 
                            ? (language === 'de' ? 'Beschreibe das Bild, das AlerksAI generieren soll...' : 'Describe the image AlerksAI should generate...')
                            : isSoundGeneratorMode
                              ? (language === 'de' ? 'Beschreibe den Sound-Effekt, den AlerksAI erzeugen soll...' : 'Describe the sound effect AlerksAI should create...')
                              : isMusicGeneratorMode
                                ? (language === 'de' ? 'Beschreibe das Musikstück, das AlerksAI komponieren soll...' : 'Describe the music AlerksAI should compose...')
                                : isVideoGeneratorMode
                                  ? (language === 'de' ? 'Beschreibe das Video, das AlerksAI erzeugen soll...' : 'Describe the video AlerksAI should generate...')
                                  : t('placeholderChat')
                        }
                        rows={1}
                        disabled={isGenerating || (currentUser && currentUser.credits <= 0 && !(currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && localStorage.getItem('aleksai_admin_infinite') === 'true'))}
                        className={`flex-1 bg-transparent border-0 outline-none resize-none pt-2.5 pl-1.5 text-xs sm:text-sm select-text min-h-[38px] max-h-32 ${darkMode ? 'text-white placeholder-slate-500' : 'text-[#0d0f1a] placeholder-slate-400'}`}
                      />

                      <input 
                        type="file" 
                        id="aleksai-chat-file-uploader" 
                        multiple 
                        accept="image/*,application/pdf,text/*" 
                        className="hidden" 
                        onChange={handleFileChange}
                      />

                      <button
                        onClick={handleChatFieldSubmit}
                        disabled={(!chatInput.trim() && attachedFiles.length === 0) || isGenerating || (currentUser && currentUser.credits <= 0 && !(currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && localStorage.getItem('aleksai_admin_infinite') === 'true'))}
                        className="w-10 h-10 bg-[#4f6ef7] disabled:bg-slate-200/50 hover:bg-[#6c83f8] disabled:text-slate-400 disabled:scale-100 text-white rounded-xl flex items-center justify-center transition-all cursor-pointer hover:scale-105 shrink-0"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <div className="text-[9px] text-[#8b90a8] text-center mt-2 font-bold uppercase tracking-wider">
                    {t('footerDisclaimer')} · {MODEL_DETAILS[activeModel].name} · {(currentUser && currentUser.email?.toLowerCase() === 'aleks.smolovic@web.de' && localStorage.getItem('aleksai_admin_infinite') === 'true') ? '∞' : (currentUser ? currentUser.credits : 0)} {t('credits')} remaining
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── SCHULMODUS / EDUCATION LERNZENTRUM SCREEN ── */}
        {currentPage === 'study' && (
          <div className="max-w-4xl mx-auto px-4 py-8 md:py-12 flex-1 w-full animate-fade-in text-left">
            {/* Header Banner */}
            <div className={`p-6 md:p-8 rounded-3xl border mb-6 relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${darkMode ? 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800' : 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-white border-emerald-500/20'}`}>
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-500 uppercase">
                  🎓 AlerksAI Premium Schulmodus
                </span>
                <h1 className={`text-2xl md:text-3xl font-black mt-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  🧑🏽‍🏫 Lernzentrum & Hausaufgaben-Helfer
                </h1>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {language === 'de' 
                    ? 'Klassische Lernunterstützung, verständliche Erklärungen für Mathe, Physik und Sprachen mit pädagogischer Geduld.'
                    : 'Study aid, easy explanatory models for stem, history and language learning with pedagogical assistance.'}
                </p>
              </div>
            </div>

            {/* Sub-tools row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Educational Helper Prompt Panel */}
              <div className={`md:col-span-1 p-5 rounded-2xl border h-fit space-y-4 ${darkMode ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-[#e2e5f1] shadow-sm'}`}>
                <h3 className={`text-sm font-black uppercase tracking-wider ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  🧠 {language === 'de' ? 'Fach auswählen' : 'Select Subject'}
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  {['Mathe', 'Physik', 'Deutsch', 'Englisch', 'Chemie', 'Geschichte'].map((sub) => (
                    <button
                      key={sub}
                      onClick={() => setStudySubject(sub)}
                      className={`py-2 px-3 text-[11px] font-black rounded-xl border transition ${
                        studySubject === sub 
                          ? 'bg-emerald-500 text-white border-emerald-600 shadow-md' 
                          : (darkMode ? 'bg-slate-850/60 border-slate-750 text-slate-300 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100')
                      } cursor-pointer`}
                    >
                      {sub === 'Mathe' ? '📐 Mathe' : sub === 'Physik' ? '🔬 Physik' : sub === 'Deutsch' ? '✍️ Deutsch' : sub === 'Englisch' ? '🇬🇧 Englisch' : sub === 'Chemie' ? '🧪 Chemie' : '📜 Geschichte'}
                    </button>
                  ))}
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">
                    {language === 'de' ? `Dein Problem in ${studySubject}` : `Your Question in ${studySubject}`}
                  </label>
                  <textarea
                    value={studyInput}
                    onChange={(e) => setStudyInput(e.target.value)}
                    rows={4}
                    placeholder={
                      studySubject === 'Mathe' 
                        ? 'z. B. Erkläre mir quadratische Gleichungen verständlich mit Beispielen.'
                        : studySubject === 'Physik' 
                          ? 'z. B. Wie funktionieren die Newtonschen Gesetze anschaulich?'
                          : 'Beschreibe dein Thema oder füge deine Aufgabe hier ein...'
                    }
                    className={`w-full px-3 py-2 text-xs rounded-xl border transition-all resize-none ${darkMode ? 'bg-slate-850 border-slate-755 text-slate-100 placeholder-slate-600 focus:border-emerald-500 outline-none' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#0d0f1a]'}`}
                  />

                  <button
                    onClick={async () => {
                      if (!studyInput.trim()) {
                        triggerToast(language === 'de' ? 'Bitte gib eine Fragestellung an' : 'Please provide a prompt');
                        return;
                      }
                      
                      setIsStudyLoading(true);
                      setStudyResult('');
                      triggerToast(language === 'de' ? '💡 AlerksAI formuliert Lernunterstützung...' : '💡 Generating answer...');
                      
                      try {
                        const explanatoryContext = `Du bist AlerksAI Premium im pädagogisch wertvollsten Schulmodus. Erkläre dem Schüler das Thema "${studySubject}" so anschaulich, motivierend und einfach wie möglich auf Deutsch. Verwende übersichtliche Punkte, verständliche Schritte und ein konkretes Anwendungsbeispiel. Stelle am Schluss eine kleine Kontrollfrage zum Mitdenken! Hier ist die Frage des Schülers: ${studyInput}`;
                        
                        const model = activeModel;
                        const keyToUse = customApiKey || '';
                        
                        const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + (keyToUse || process.env.GEMINI_API_KEY || '');
                        
                        const response = await fetch(url, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            contents: [{ parts: [{ text: explanatoryContext }] }],
                            generationConfig: { maxOutputTokens: 1000 }
                          })
                        });
                        
                        if (!response.ok) {
                          throw new Error("HTTP error " + response.status);
                        }
                        
                        const data = await response.json();
                        const genText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
                        
                        setStudyResult(genText || "Keine Rückmeldung erhalten. Bitte überprüfe dein API-Guthaben.");
                      } catch (err) {
                        console.error(err);
                        setStudyResult('Das konnte leider nicht beantwortet werden. Bitte vergewissere dich, dass deine Internetverbindung aktiv ist, oder füge deinen eigenen Gemini-API-Key unter Profil hinzu.');
                      } finally {
                        setIsStudyLoading(false);
                      }
                    }}
                    disabled={isStudyLoading}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 font-black text-xs text-white py-2.5 rounded-xl transition duration-150 cursor-pointer text-center flex items-center justify-center gap-1"
                  >
                    {isStudyLoading ? '⏳ Denkt nach...' : '💡 Verständlich erklären!'}
                  </button>
                </div>
              </div>

              {/* Study Area Explanation Result Board */}
              <div className="md:col-span-2 space-y-4 text-left">
                <div className={`p-5 rounded-2xl border min-h-[350px] flex flex-col justify-between ${darkMode ? 'bg-slate-900/40 border-slate-800' : 'bg-white border-[#e2e5f1] shadow-sm'}`}>
                  <div>
                    <div className="flex justify-between items-center pb-3 border-b border-stone-100 dark:border-slate-800 mb-3">
                      <span className="text-[10px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded font-black uppercase tracking-wider">
                        {studySubject} - {language === 'de' ? 'Tafelbild' : 'Blackboard'}
                      </span>
                      {studyResult && (
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(studyResult);
                            triggerToast(language === 'de' ? '📋 Kopiert!' : '📋 Copied!');
                          }}
                          className="text-xs text-emerald-500 hover:underline cursor-pointer"
                        >
                          📋 Kopieren
                        </button>
                      )}
                    </div>

                    {isStudyLoading ? (
                      <div className="flex flex-col items-center justify-center py-16 space-y-3">
                        <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
                        <span className="text-xs text-slate-400 font-bold">{language === 'de' ? 'AlerksAI schreibt an der Wandtafel...' : 'AlerksAI is generating...'}</span>
                      </div>
                    ) : studyResult ? (
                      <div className="text-xs md:text-sm leading-relaxed text-left font-normal select-text space-y-2 whitespace-pre-wrap select-text">
                        {studyResult}
                      </div>
                    ) : (
                      <div className="text-center py-16 text-slate-500 space-y-2">
                        <p className="font-extrabold text-2xl">⚡</p>
                        <p className="text-xs font-bold leading-relaxed max-w-xs mx-auto">
                          {language === 'de' 
                            ? 'Wähle links ein Fach, stell deine Frage und AlerksAI bereitet dir eine didaktisch verständliche Hilfestellung auf.'
                            : 'Select a subject, write down your problem, and AlerksAI will prepare easy-to-understand explanations.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Built-in quick helper sample */}
                  <div className="border-t border-stone-100 dark:border-slate-800 pt-3.5 mt-4 flex justify-between items-center text-[10.5px]">
                    <span className="text-slate-450 font-bold">💡 {language === 'de' ? 'Lern-Tipp: Erstelle Eselsbrücken!' : 'Learn tip: Stagger study chunks!'}</span>
                    <button
                      onClick={() => {
                        setStudyInput('Erstelle mir 5 schnelle Quiz-Karteikarten zu den wichtigsten physikalischen Krafteinheiten.');
                        setStudySubject('Physik');
                        triggerToast('Quiz-Beispiel geladen! Klicke jetzt auf erklären.');
                      }}
                      className="text-emerald-500 hover:underline font-extrabold cursor-pointer"
                    >
                      🔥 {language === 'de' ? 'Beispiel laden' : 'Try example'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── USER PROFILE VIEW SCREEN ── */}
        {currentPage === 'profile' && currentUser && (
          <div className="max-w-2xl mx-auto px-4 py-8 md:py-12 flex-1 w-full">
            <div className={`border rounded-2xl p-6 text-center shadow-sm ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#f7f8fc] border-[#e2e5f1]'}`}>
              {/* Profile Avatar with Photo Picker */}
              <div 
                className="relative group w-20 h-20 mx-auto mb-4 cursor-pointer" 
                onClick={() => document.getElementById('aleksai-avatar-input')?.click()}
                title="Profilbild hochladen / ändern"
              >
                {currentUser.profilePic ? (
                  <img 
                    src={currentUser.profilePic} 
                    alt="User Profile" 
                    className="w-20 h-20 rounded-full object-cover border-2 border-violet-500 shadow-md transition group-hover:brightness-75"
                  />
                ) : (
                  <div className="w-20 h-20 bg-gradient-to-tr from-[#4f6ef7] to-[#8b5cf6] text-white rounded-full flex items-center justify-center text-4xl font-black shadow-md transition group-hover:brightness-90">
                    {currentUser.firstName[0].toUpperCase()}
                  </div>
                )}
                <div className="absolute inset-0 bg-slate-950/65 rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-[10px] text-white font-extrabold uppercase tracking-wide">Ändern</span>
                </div>
              </div>
              <input 
                type="file" 
                id="aleksai-avatar-input" 
                accept="image/*" 
                className="hidden" 
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 2 * 1024 * 1024) {
                      triggerToast('⚠️ Bild ist zu groß (Maximal 2MB)');
                      return;
                    }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = reader.result as string;
                      const updatedUser = { ...currentUser, profilePic: base64 };
                      updateAndSaveUser(updatedUser);
                      triggerToast('✨ Profilbild erfolgreich aktualisiert!');
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />

              <h2 className={`text-xl font-extrabold ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{currentUser.firstName} {currentUser.lastName}</h2>
              <p className="text-xs text-[#4f6ef7] mt-1 font-black">@{currentUser.username}</p>
            </div>

            <div className="bg-gradient-to-br from-[#4f6ef7] to-[#8b5cf6] text-white rounded-2xl p-6 shadow-md mt-4">
              <div className="text-xs font-bold opacity-85 mb-1">{t('credits')}</div>
              <span className="text-4xl font-extrabold">{currentUser.credits}</span>
              <p className="text-[11px] opacity-80 mt-2 leading-relaxed font-bold">Jeden neuen Tag werden deinem Guthaben automatisch +100 Credits gratis hinzugefügt.</p>
            </div>

            <div className={`border rounded-2xl p-5 mt-4 space-y-3.5 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#f7f8fc] border-[#e2e5f1]'}`}>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-850">
                <span className="text-xs text-[#4a4e6a] font-bold">Vorname</span>
                <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{currentUser.firstName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-850">
                <span className="text-xs text-[#4a4e6a] font-bold">Nachname</span>
                <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{currentUser.lastName}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-850">
                <span className="text-xs text-[#4a4e6a] font-bold">Benutzername</span>
                <span className="text-xs font-mono font-black text-[#4f6ef7]">@{currentUser.username}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100 dark:border-slate-850">
                <span className="text-xs text-[#4a4e6a] font-bold">Geburtstag</span>
                <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{new Date(currentUser.birthday).toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}</span>
              </div>
              <div className="flex justify-between items-center pt-1">
                <span className="text-xs text-[#4a4e6a] font-bold">Mitglied seit</span>
                <span className={`text-xs font-black ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{currentUser.createdAt}</span>
              </div>
            </div>

            {/* REDEEM COUPON CODE (GUTSCHEIN EINLÖSEN) PANEL */}
            <div className={`border rounded-2xl p-5 mt-4 space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-[#f7f8fc] border-[#e2e5f1]'}`}>
              <div className="flex justify-between items-center">
                <span className={`text-xs font-black uppercase tracking-wider text-amber-500`}>
                  🎁 {language === 'de' ? 'Gutscheincode einlösen' : 'Redeem Coupon Code'}
                </span>
                <span className="text-[9.5px] bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded font-black uppercase border border-amber-500/20">
                  Promo
                </span>
              </div>
              
              <p className="text-[10.5px] text-slate-400 leading-relaxed font-normal">
                {language === 'de' 
                  ? 'Gib hier deinen Gutscheincode ein (z. B. ALEKSVIP, WELCOME500 oder einen vom Admin generierten Code), um dein Guthaben sofort aufzuladen.'
                  : 'Enter your promo/coupon code here (e.g. ALEKSVIP, WELCOME500 or any admin generated code) to top up your credits.'}
              </p>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={profileCouponCode}
                  placeholder={language === 'de' ? 'Gutscheincode...' : 'Enter coupon...'}
                  onChange={(e) => setProfileCouponCode(e.target.value)}
                  className={`flex-1 px-3 py-2 text-xs rounded-xl border transition-all uppercase font-mono font-bold ${darkMode ? 'bg-slate-850 border-slate-750 text-slate-100 placeholder-slate-600 focus:border-amber-500' : 'bg-white border-[#e2e5f1] text-slate-850 placeholder-slate-400 focus:border-amber-500'} focus:outline-none`}
                />
                <button
                  type="button"
                  onClick={() => handleRedeemCoupon(profileCouponCode)}
                  className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 active:scale-95 text-white text-xs font-black px-4 py-2 rounded-xl transition duration-150 cursor-pointer"
                >
                  {language === 'de' ? 'Einlösen' : 'Redeem'}
                </button>
              </div>
            </div>

            <button 
              onClick={doLogout}
              className={`w-full rounded-xl py-3 mt-4 font-black text-xs md:text-sm border transition duration-200 cursor-pointer text-center ${darkMode ? 'bg-red-950/20 border-red-900/50 text-red-400 hover:bg-red-950/40' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'}`}
            >
              🚪 Account abmelden
            </button>
          </div>
        )}
      </main>

      {/* ── SETTINGS CONFIGURATION MODAL DIALOG ── */}
      {showSettingsModal && (
        <div 
          onClick={() => setShowSettingsModal(false)}
          className="fixed inset-0 bg-black/85 z-55 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className={`rounded-2xl w-full ${settingsActiveTab === 'shop' ? 'max-w-[580px]' : 'max-w-[440px]'} max-h-[85vh] flex flex-col p-4 sm:p-5 relative shadow-2xl animate-zoom-in border transition-all duration-300 ${darkMode ? 'bg-slate-900 text-white border-slate-800' : 'bg-white text-slate-950 border-[#e2e5f1]'}`}
          >
            <button 
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#f4f4f7] dark:bg-slate-800 hover:bg-[#e2e5f1] dark:hover:bg-slate-700 transition flex items-center justify-center text-xs font-black text-stone-500 hover:text-red-500 cursor-pointer z-10"
              title={t('close')}
            >
              ✕
            </button>
            
            <div className="flex items-center gap-2 mb-3 shrink-0 pr-8">
              <AleksAILogo className="w-5 h-5 text-[#4f6ef7]" glow={true} />
              <div>
                <h3 className="text-sm sm:text-base font-black tracking-tight">
                  {settingsActiveTab === 'shop' ? (language === 'de' ? 'AlerksAI Credit Shop ⚡' : 'AlerksAI Credit Shop ⚡') : t('settings')}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AlerksAI Intelegence</p>
              </div>
            </div>

            {/* Elegant Tab Switcher */}
            <div className={`flex items-center gap-1 p-1 rounded-xl mb-4 text-xs font-bold shrink-0 ${darkMode ? 'bg-slate-950/60' : 'bg-slate-100'}`}>
              <button
                onClick={() => setSettingsActiveTab('settings')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer text-[10px] sm:text-xs ${settingsActiveTab === 'settings' ? (darkMode ? 'bg-[#4f6ef7] text-white shadow' : 'bg-white text-[#4f6ef7] shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
              >
                ⚙️ {language === 'de' ? 'Einstellungen' : 'Settings'}
              </button>
              <button
                onClick={() => setSettingsActiveTab('profile')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer text-[10px] sm:text-xs ${settingsActiveTab === 'profile' ? (darkMode ? 'bg-[#4f6ef7] text-white shadow' : 'bg-white text-[#4f6ef7] shadow-sm') : 'text-slate-400 hover:text-slate-200'}`}
              >
                👤 {language === 'de' ? 'Benutzer' : 'User'}
              </button>
              <button
                onClick={() => setSettingsActiveTab('shop')}
                className={`flex-1 py-1.5 rounded-lg transition-all text-center cursor-pointer text-[10px] sm:text-xs flex items-center justify-center gap-1 ${settingsActiveTab === 'shop' ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md' : 'text-pink-600 dark:text-pink-400 hover:text-pink-500'}`}
              >
                ⚡ {language === 'de' ? 'Shop' : 'Shop'}
                <span className="text-[8px] bg-amber-400 text-slate-950 px-1 rounded font-black uppercase animate-pulse">New</span>
              </button>
            </div>
 
            {/* Scrollable container for density */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              
              {/* TAB 1: SETTINGS / OPTIONEN */}
              {settingsActiveTab === 'settings' && (
                <>
                  {/* LANGUAGE SELECTOR */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#8b90a8] uppercase tracking-widest block">{t('settingsLanguage')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {[
                        { code: 'de', label: 'Deutsch 🇩🇪' },
                        { code: 'en', label: 'English 🇬🇧' },
                        { code: 'es', label: 'Español 🇪🇸' },
                        { code: 'fr', label: 'Français 🇫🇷' },
                        { code: 'it', label: 'Italiano 🇮🇹' },
                        { code: 'tr', label: 'Türkçe 🇹🇷' },
                        { code: 'sr', label: 'Srpski 🇷🇸' }
                      ].map((langObj) => (
                        <button
                          key={langObj.code}
                          onClick={() => {
                            setLanguage(langObj.code as any);
                            triggerToast(`Sprache gewechselt auf ${langObj.label}`);
                          }}
                          className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-left border transition ${language === langObj.code ? 'bg-[#4f6ef7] border-transparent text-white' : (darkMode ? 'bg-slate-800 border-slate-750 text-slate-300 hover:border-slate-600' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a] hover:border-slate-400')}`}
                        >
                          {langObj.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* APPEARANCE / DARK SWITCH */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#8b90a8] uppercase tracking-widest block">{t('settingsTheme')}</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={() => { setDarkMode(false); triggerToast("Heller Modus aktiviert"); }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 ${!darkMode ? 'bg-amber-500 border-transparent text-white shadow' : (darkMode ? 'bg-slate-800 border-slate-750 text-slate-300' : 'bg-slate-100')}`}
                      >
                        ☀️ Light Mode
                      </button>
                      <button
                        onClick={() => { setDarkMode(true); triggerToast("Dunkler Modus aktiviert"); }}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border transition flex items-center justify-center gap-1.5 ${darkMode ? 'bg-blue-650 border-transparent text-white shadow' : 'bg-slate-200/50 text-slate-700'}`}
                      >
                        🌙 Dark Mode
                      </button>
                    </div>
                  </div>

                  {/* SCREEN SIZE EMULATOR SELECTOR */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#8b90a8] uppercase tracking-widest block">{t('settingsSize')}</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                      {[
                        { size: 'auto', label: t('automaticSize') },
                        { size: 'iPhone', label: '📱 iPhone' },
                        { size: 'iPad', label: '📟 iPad' },
                        { size: 'PC', label: '🖥️ PC' }
                      ].map((sizeObj) => (
                        <button
                          key={sizeObj.size}
                          onClick={() => {
                            setDeviceSize(sizeObj.size as any);
                            triggerToast(`Ansicht geändert auf ${sizeObj.size}`);
                          }}
                          className={`px-2 py-1.5 rounded-xl text-[10px] font-bold border transition truncate text-center ${deviceSize === sizeObj.size ? 'bg-[#4f6ef7] border-transparent text-white' : (darkMode ? 'bg-slate-800 border-slate-755 text-slate-300' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a] hover:border-slate-300')}`}
                          title={sizeObj.label}
                        >
                          {sizeObj.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* MODEL SELECTOR IN SETTINGS */}
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-[#8b90a8] uppercase tracking-widest block">{t('settingsModel')}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {Object.entries(MODEL_DETAILS).map(([key, details]) => (
                        <button
                          key={key}
                          onClick={() => handleSelectModel(key as AIModel)}
                          className={`p-2 rounded-xl border text-left flex items-center gap-2 transition cursor-pointer text-xs ${activeModel === key ? 'bg-[#eef1ff] border-[#4f6ef7] text-[#4f6ef7] font-bold' : (darkMode ? 'bg-slate-800 border-slate-750 text-slate-300 hover:border-slate-500' : 'bg-[#f7f8fc] border-[#e2e5f1] text-[#4a4e6a]')}`}
                        >
                          <ModelLogo model={key as AIModel} className="w-4 h-4 shrink-0" />
                          <div className="truncate text-left">
                            <p className="font-extrabold truncate text-[11px]">{details.name}</p>
                            <p className="text-[9px] opacity-75 truncate">{details.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CUSTOM API KEY SETTING */}
                  <div className="space-y-1.5 pt-3.5 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex justify-between items-center">
                      <label className="text-[9px] font-black text-[#8b90a8] uppercase tracking-widest block">
                        {language === 'de' ? 'Eigener Gemini API-Schlüssel (Optional)' : 'Custom Gemini API Key (Optional)'}
                      </label>
                      {customApiKey ? (
                        <span className="text-[9.5px] bg-emerald-500/10 text-emerald-500 px-1.5 py-0.5 rounded font-black uppercase">
                          Aktiv / Active
                        </span>
                      ) : (
                        <span className="text-[9.5px] bg-slate-500/10 text-slate-450 px-1.5 py-0.5 rounded font-black uppercase">
                          Standard
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 leading-normal">
                      {language === 'de'
                        ? 'Füge hier deinen eigenen Google AI Studio API-Schlüssel ein, um Überlastungen oder temporäre Sperren (wie 503-Fehler) komplett zu umgehen. Er bleibt sicher lokal in deinem Browser gespeichert.'
                        : 'Paste your own Google AI Studio API key here to bypass any rate-limiting or heavy demand on shared models. Rest assured, your key remains securely stored local-only in your browser.'}
                    </p>
                    <div className="relative">
                      <input
                        type="password"
                        value={customApiKey}
                        placeholder="AIzaSy..."
                        onChange={(e) => {
                          const val = e.target.value.trim();
                          handleSaveCustomApiKey(val);
                        }}
                        className={`w-full px-3 py-2 text-xs rounded-xl border transition-all ${darkMode ? 'bg-slate-800 border-slate-750 text-slate-100 placeholder-slate-500 focus:border-blue-500' : 'bg-[#f7f8fc] border-[#e2e5f1] text-slate-850 placeholder-slate-400 focus:border-[#4f6ef7]'} focus:outline-none`}
                      />
                      {customApiKey && (
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveCustomApiKey('');
                            triggerToast(language === 'de' ? 'API-Schlüssel gelöscht' : 'API Key removed');
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-black text-red-500 hover:underline cursor-pointer"
                        >
                          {language === 'de' ? 'Löschen' : 'Clear'}
                        </button>
                      )}
                    </div>
                    <div className="flex justify-between items-center text-[9px] font-bold opacity-80 pt-0.5">
                      <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-[#4f6ef7] hover:underline flex items-center gap-1"
                      >
                        🚀 {language === 'de' ? 'Kostenlosen API-Schlüssel holen' : 'Get a free Gemini API Key'}
                      </a>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: USER PROFILE & STATS */}
              {settingsActiveTab === 'profile' && (
                <div className="space-y-4">
                  {currentUser ? (
                    <>
                      {/* Logged in User Badge Card */}
                      <div className={`p-4 rounded-2xl border flex items-center gap-3.5 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#4f6ef7] to-[#8b5cf6] flex items-center justify-center font-black text-white text-lg shadow-sm shrink-0">
                          {currentUser.profilePic ? (
                            <img src={currentUser.profilePic} alt="" className="w-full h-full rounded-full object-cover" />
                          ) : (
                            currentUser.firstName[0].toUpperCase()
                          )}
                        </div>
                        <div className="text-left leading-normal">
                          <h4 className="font-extrabold text-sm text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-pink-500">
                            {currentUser.firstName} {currentUser.lastName}
                          </h4>
                          <p className="text-[10px] font-black text-[#4f6ef7]">@{currentUser.username}</p>
                          <p className="text-[10px] text-slate-400 font-bold truncate max-w-[220px]">{currentUser.email}</p>
                        </div>
                      </div>

                      {/* Display Credits in interactive visual box */}
                      <div className={`p-5 rounded-2xl border text-center space-y-2 relative overflow-hidden ${darkMode ? 'bg-slate-950/80 border-slate-800' : 'bg-[#fff5f8]/50 border-pink-100'}`}>
                        {/* Pink glowing ambient glow behind */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-pink-500/10 blur-[40px] pointer-events-none" />
                        
                        <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest relative z-10">
                          {language === 'de' ? 'Verfügbares Energie-Guthaben' : 'Energy Credits Balance'}
                        </p>
                        
                        <div className="flex items-baseline justify-center gap-2.5 relative z-10">
                          <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-[#4f6ef7] drop-shadow-sm">
                            ⚡ {currentUser.credits}
                          </span>
                          <span className="text-xs font-black text-slate-450 uppercase tracking-wider">Credits</span>
                        </div>
                        
                        <p className="text-[10.5px] text-slate-450 leading-relaxed max-w-xs mx-auto relative z-10">
                          {language === 'de' 
                            ? 'Jede KI-Antwort verbraucht genau 1 Energie-Credit. Dein Guthaben füllt sich täglich automatisch um +100 Credits!' 
                            : 'Each AI prompt uses 1 credit. Your balance is refilled automatically with +100 credits every single day!'}
                        </p>

                        <button
                          onClick={() => setSettingsActiveTab('shop')}
                          className="w-full mt-3 py-3 rounded-xl text-xs font-black bg-gradient-to-r from-pink-500 via-rose-500 to-violet-600 hover:opacity-90 text-white flex items-center justify-center gap-2 cursor-pointer shadow-md transition transform active:scale-95 duration-200"
                        >
                          ⚡ {language === 'de' ? 'Credits aufladen (Shop)' : 'Buy more credits (Shop)'}
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          setShowSettingsModal(false);
                          doLogout();
                        }}
                        className={`w-full rounded-xl py-2.5 font-bold text-xs border transition duration-200 cursor-pointer text-center ${darkMode ? 'bg-red-950/20 border-red-900/40 text-red-400 hover:bg-red-950/35' : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200'}`}
                      >
                        🚪 {language === 'de' ? 'Von AlerksAI abmelden' : 'Logout from AlerksAI'}
                      </button>
                    </>
                  ) : (
                    /* Guest View */
                    <div className="space-y-4">
                      <div className={`p-5 rounded-2xl border text-center space-y-3 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center mx-auto text-sm">
                          👤
                        </div>
                        <div className="space-y-1">
                          <h4 className="font-extrabold text-sm">{language === 'de' ? 'Gast-Benutzer' : 'Guest Account'}</h4>
                          <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
                            {language === 'de'
                              ? 'Du nutzt AlerksAI derzeit im anonymen Gastmodus. Deine Chats und Energie-Guthaben sind lokal an diesen Browser gebunden.'
                              : 'You are using AlerksAI as a Guest. Your chats and credit balances are stored locally in this browser session.'}
                          </p>
                        </div>
                        <div className="pt-2 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => {
                              setShowSettingsModal(false);
                              openAuthModal('register');
                            }}
                            className="flex-1 py-2 rounded-xl bg-[#4f6ef7] hover:bg-[#6c83f8] text-white text-xs font-black cursor-pointer transition shadow-sm"
                          >
                            📝 {language === 'de' ? 'Konto registrieren' : 'Register Account'}
                          </button>
                          <button
                            onClick={() => {
                              setShowSettingsModal(false);
                              openAuthModal('login');
                            }}
                            className={`flex-1 py-2 rounded-xl border text-xs font-bold cursor-pointer transition ${darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-white' : 'bg-white border-[#e2e5f1] hover:bg-slate-50 text-slate-700'}`}
                          >
                            🔑 {language === 'de' ? 'Anmelden' : 'Login'}
                          </button>
                        </div>
                      </div>

                      {/* Display Credits in guest box */}
                      <div className={`p-4 rounded-2xl border text-center space-y-1.5 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-pink-50/30 border-pink-100'}`}>
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">{language === 'de' ? 'Gast-Credits' : 'Guest Credits'}</p>
                        <div className="text-3xl font-black text-slate-800 dark:text-white">⚡ 50</div>
                        <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                          {language === 'de' ? 'Erhalte +50 gratis Credits täglich. Registriere dich kostenlos für dauerhafte Ersparnisse.' : 'Get +50 free credits daily. Create an account to unlock permanent secure token storage.'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: THE CREDIT SHOP ⚡ */}
              {settingsActiveTab === 'shop' && (
                <div className="space-y-4">
                  {/* Shop Header banner */}
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-pink-500 via-rose-500 to-indigo-600 text-white text-left shadow-lg relative overflow-hidden">
                    {/* Glowing background circles inside banner */}
                    <div className="absolute right-0 bottom-0 w-32 h-32 rounded-full bg-white/10 blur-[20px]" />
                    <div className="relative z-10 space-y-1">
                      <div className="flex items-center gap-1 text-[9px] font-black tracking-widest bg-white/20 px-2 py-0.5 rounded-full uppercase w-max">
                        ⚡ Premium Energy Shop
                      </div>
                      <h4 className="text-base font-black tracking-tight">{language === 'de' ? 'Bunte Rechenpower ohne Limits' : 'Vibrant Unlimited Reasoning Power'}</h4>
                      <p className="text-[10.5px] text-pink-50 leading-relaxed max-w-md">
                        {language === 'de' 
                          ? 'Wähle dein bevorzugtes Energie-Paket. Jedes Paket schaltet zusätzliche Tokens für extrem anspruchsvolle Aufgaben, Hausaufgaben & Deep-Reasoning frei!' 
                          : 'Select your preferred energy bundle. Each package grants tokens to interact with our highly advanced analytical and reasoning AI models!'}
                      </p>
                    </div>
                  </div>

                  {!currentUser && (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl text-[10.5px] text-left leading-normal flex items-start gap-2">
                      <span className="text-base shrink-0">💡</span>
                      <div>
                        <strong>{language === 'de' ? 'Tipp für Gäste:' : 'Tip for Guests:'}</strong>{' '}
                        {language === 'de' 
                          ? 'Registriere dich am besten kostenlos, damit deine gekauften Credits permanent mit deinem Benutzerkonto gesichert und synchronisiert werden!' 
                          : 'We recommend registering a free account so your purchased credits are permanently secured and synced to your credentials!'}
                      </div>
                    </div>
                  )}

                  {/* 🌟 VIP Subscription Tier */}
                  <div className="rainbow-border-container w-full !p-[2.5px] !rounded-[18px] shadow-md">
                    <div className={`w-full p-4 rounded-[15.5px] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${darkMode ? 'bg-slate-950' : 'bg-white'}`}>
                      <div className="space-y-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] sm:text-[9px] font-black bg-gradient-to-r from-pink-500 to-rose-500 text-white px-2 py-0.5 rounded-full uppercase tracking-widest">
                            {language === 'de' ? 'Monatliches Abo' : 'Monthly Subscription'}
                          </span>
                          <span className="text-[10px] sm:text-[11px] font-black text-amber-500 flex items-center gap-0.5">🌟 VIP Access</span>
                        </div>
                        <h4 className="text-sm font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-rose-500 to-violet-500">
                          AlerksAI VIP Membership
                        </h4>
                        <p className="text-[11px] text-slate-400 leading-normal">
                          {language === 'de'
                            ? 'Erhalte 1200 Tokens monatlich + VIP-Vorteile (Zugriff auf mehr Modelle, exklusive Premium-Designs, priorisiertes, superschnelles Chattering, werbefreies Erlebnis)'
                            : 'Get 1200 Tokens monthly + VIP perks (extra models, exclusive designs, priority high-speed chatting, entirely ad-free)'}
                        </p>
                      </div>
                      <div className="w-full sm:w-auto shrink-0 flex flex-col items-end gap-1.5 text-right mt-2 sm:mt-0">
                        <span className="text-lg font-black tracking-tight text-pink-500">
                          12,99€ <span className="text-[10px] text-slate-450 font-bold">/ {language === 'de' ? 'Monat' : 'month'}</span>
                        </span>
                        <button
                          disabled
                          className="w-full sm:w-auto px-3.5 py-1.5 rounded-xl bg-slate-800 text-slate-500 border border-slate-700/50 text-[9.5px] font-black uppercase flex items-center justify-center gap-1 cursor-not-allowed"
                        >
                          🔒 {language === 'de' ? 'Kauf bald verfügbar' : 'Purchase coming soon'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Token packages grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Pack 1: 100 Tokens */}
                    <div className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 text-left transition ${darkMode ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-[#f7f8fc] border-slate-200 hover:border-slate-300'}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">⚡ 100 Tokens</span>
                          <span className="text-xs font-black text-[#4f6ef7]">3,99€</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'de' ? 'Der perfekte Einstieg, um alle Premium-Modelle gründlich auszutesten.' : 'The perfect bundle to thoroughly test all elite AI models.'}
                        </p>
                      </div>
                      <button disabled className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700/40 text-slate-500 text-[9.5px] font-black uppercase flex items-center justify-center gap-1 cursor-not-allowed">
                        🔒 {language === 'de' ? 'Kauf bald verfügbar' : 'Purchase coming soon'}
                      </button>
                    </div>

                    {/* Pack 2: 200 Tokens */}
                    <div className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 text-left transition ${darkMode ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-[#f7f8fc] border-slate-200 hover:border-slate-300'}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">⚡ 200 Tokens</span>
                          <span className="text-xs font-black text-[#4f6ef7]">5,99€</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'de' ? 'Zusätzliche Rechenleistung für mittlere Chats, Analysen & Hausaufgaben.' : 'Extra compute credits for medium-sized chats, data analysis & school tasks.'}
                        </p>
                      </div>
                      <button disabled className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700/40 text-slate-500 text-[9.5px] font-black uppercase flex items-center justify-center gap-1 cursor-not-allowed">
                        🔒 {language === 'de' ? 'Kauf bald verfügbar' : 'Purchase coming soon'}
                      </button>
                    </div>

                    {/* Pack 3: 500 Tokens */}
                    <div className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between gap-3 text-left relative overflow-hidden transition ${darkMode ? 'bg-slate-950/70 border-[#4f6ef7]/50' : 'bg-blue-50/45 border-[#4f6ef7]/30'}`}>
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-[#4f6ef7] to-indigo-600 text-white text-[7.5px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg tracking-widest animate-pulse">
                        💡 Bestseller
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-[#4f6ef7] dark:text-blue-300">⚡ 500 Tokens</span>
                          <span className="text-xs font-black text-[#4f6ef7] dark:text-blue-300">9,99€</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'de' ? 'Großartige Ersparnis! Ideal für den täglichen Einsatz bei Hausaufgaben & Coding.' : 'Outstanding value pack! Ideal for daily support in homeworks, study & coding.'}
                        </p>
                      </div>
                      <button disabled className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700/40 text-slate-500 text-[9.5px] font-black uppercase flex items-center justify-center gap-1 cursor-not-allowed">
                        🔒 {language === 'de' ? 'Kauf bald verfügbar' : 'Purchase coming soon'}
                      </button>
                    </div>

                    {/* Pack 4: 1200 Tokens */}
                    <div className={`p-3.5 rounded-2xl border flex flex-col justify-between gap-3 text-left transition ${darkMode ? 'bg-slate-950/40 border-slate-800 hover:border-slate-700' : 'bg-[#f7f8fc] border-slate-200 hover:border-slate-300'}`}>
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">⚡ 1200 Tokens</span>
                          <span className="text-xs font-black text-[#4f6ef7]">16,99€</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'de' ? 'Großes Paket für Power-User, intensive Programmier-Sessions & Texter.' : 'Big package for power-users, intensive developer sessions & creative copywriters.'}
                        </p>
                      </div>
                      <button disabled className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700/40 text-slate-500 text-[9.5px] font-black uppercase flex items-center justify-center gap-1 cursor-not-allowed">
                        🔒 {language === 'de' ? 'Kauf bald verfügbar' : 'Purchase coming soon'}
                      </button>
                    </div>

                    {/* Pack 5: 4000 Tokens */}
                    <div className={`p-3.5 rounded-2xl border-2 flex flex-col justify-between gap-3 text-left relative overflow-hidden transition ${darkMode ? 'bg-slate-950/70 border-pink-500/50' : 'bg-pink-50/25 border-pink-200'}`}>
                      <div className="absolute top-0 right-0 bg-pink-500 text-white text-[7.5px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg tracking-widest">
                        Mega Sparpaket
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-pink-500 dark:text-pink-400">⚡ 4000 Tokens</span>
                          <span className="text-xs font-black text-pink-500 dark:text-pink-400">36,99€</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'de' ? 'Professionelle Rechenpower für unbeschwerte, unbegrenzte AI-Interaktionen.' : 'Professional reasoning grade package for carefree, massive scale AI tasks.'}
                        </p>
                      </div>
                      <button disabled className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700/40 text-slate-500 text-[9.5px] font-black uppercase flex items-center justify-center gap-1 cursor-not-allowed">
                        🔒 {language === 'de' ? 'Kauf bald verfügbar' : 'Purchase coming soon'}
                      </button>
                    </div>

                    {/* Pack 6: Lifetime Access Card */}
                    <div className={`p-4 rounded-2xl border-2 flex flex-col justify-between gap-3 text-left relative overflow-hidden transition sm:col-span-2 ${darkMode ? 'bg-slate-950/80 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-400' : 'bg-amber-50/20 border-amber-300 hover:border-amber-400'}`}>
                      <div className="absolute top-0 right-0 bg-amber-500 text-slate-950 text-[7.5px] font-black uppercase px-2.5 py-0.5 rounded-bl-lg tracking-widest">
                        👑 Lifetime Unlimited
                      </div>
                      <div className="space-y-1 pt-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-black text-amber-500 flex items-center gap-1">♾️ Zugriff für immer</span>
                          <span className="text-xs font-black text-amber-500">99,99€</span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-normal">
                          {language === 'de' 
                            ? 'Einmal zahlen. Lebenslang unbegrenzt alle Modelle, Features & Updates nutzen – komplett ohne Energie-Limits!' 
                            : 'One-time investment. Access all models and upcoming platform upgrades forever, completely uncapped and energy-free!'}
                        </p>
                      </div>
                      <button disabled className="w-full py-2 rounded-xl bg-slate-800 border border-slate-700/40 text-slate-500 text-[9.5px] font-black uppercase flex items-center justify-center gap-1 cursor-not-allowed">
                        🔒 {language === 'de' ? 'Kauf bald verfügbar' : 'Purchase coming soon'}
                      </button>
                    </div>

                  </div>

                  {/* Payment notice info */}
                  <p className="text-[9.5px] text-slate-450 leading-relaxed text-center font-bold">
                    🛡️ {language === 'de' ? 'Sicheres Zahlungssystem wird derzeit vorbereitet. Käufe werden in Kürze freigeschaltet.' : 'Secure payment gateway is currently under preparation. Transactions will be activated soon.'}
                  </p>

                  {/* GDPR and Purchase compliance links */}
                  <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 text-[10px] text-[#4f6ef7] dark:text-blue-400 font-bold pt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <button 
                      onClick={() => { setShowLegalModal('privacy'); }}
                      className="hover:underline hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer"
                    >
                      {language === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy'}
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button 
                      onClick={() => { setShowLegalModal('terms'); }}
                      className="hover:underline hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer"
                    >
                      {language === 'de' ? 'Einkaufsbedingungen (Shop)' : 'Purchase Terms'}
                    </button>
                    <span className="text-slate-300 dark:text-slate-700">•</span>
                    <button 
                      onClick={() => { setShowLegalModal('cookies'); }}
                      className="hover:underline hover:text-blue-600 dark:hover:text-blue-300 cursor-pointer"
                    >
                      {language === 'de' ? 'Cookie-Richtlinie' : 'Cookie Policy'}
                    </button>
                  </div>
                </div>
              )}

            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end shrink-0">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-[#4f6ef7] hover:bg-[#6c83f8] text-white font-extrabold text-xs rounded-xl transition cursor-pointer shadow-sm"
              >
                {t('close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUTH DIALOG MODAL IF OPEN ── */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className={`rounded-3xl w-full max-w-[430px] p-6 relative shadow-2xl overflow-hidden animate-zoom-in ${darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-950'}`}>
            <button 
              onClick={closeAuthModal}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f4f4f7] dark:bg-slate-800 hover:bg-[#e2e5f1] dark:hover:bg-slate-750 transition flex items-center justify-center text-sm font-bold text-stone-500 hover:text-red-500 cursor-pointer"
            >
              ✕
            </button>
            <div className="text-center mb-6">
              <AleksAILogo className="w-10 h-10 text-[#4f6ef7] mx-auto mb-2" glow={true} />
              <div className="text-xl font-black bg-gradient-to-r from-[#4f6ef7] to-[#8b5cf6] bg-clip-text text-transparent mb-1">AlerksAI Intelegence</div>
              <p className="text-xs text-[#8b90a8] font-medium">{t('subtitle')}</p>
            </div>

            {/* TAB CONTAINER */}
            {(authModalTab === 'login' || authModalTab === 'register') && (
              <div className={`flex rounded-xl p-1 mb-6 border ${darkMode ? 'bg-slate-950 border-slate-800' : 'bg-[#f7f8fc] border-[#e2e5f1]'}`}>
                <button 
                  onClick={() => { setAuthModalTab('login'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition duration-150 cursor-pointer ${authModalTab === 'login' ? (darkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-[#4f6ef7] shadow-sm') : 'text-[#8b90a8]'}`}
                >
                  {t('login')}
                </button>
                <button 
                  onClick={() => { setAuthModalTab('register'); setAuthError(''); }}
                  className={`flex-1 py-2 rounded-lg text-xs md:text-sm font-bold transition duration-150 cursor-pointer ${authModalTab === 'register' ? (darkMode ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-[#4f6ef7] shadow-sm') : 'text-[#8b90a8]'}`}
                >
                  {t('register')}
                </button>
              </div>
            )}

            {authError && (
              <div className="mb-4 text-xs bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-2.5 font-semibold text-center leading-normal">
                ⚠️ {authError}
              </div>
            )}

            {/* LOGIN TAB FIELD VIEW */}
            {authModalTab === 'login' && (
              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">
                    {language === 'de' ? 'E-Mail-Adresse' : (language === 'en' ? 'Email Address' : 'E-Mail')}
                  </label>
                  <input 
                    type="email" 
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white placeholder-slate-600' : 'border-[#e2e5f1] bg-stone-50 text-slate-900 placeholder-slate-400'}`}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center pl-1">
                    <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">{t('password')}</label>
                    <button 
                      type="button"
                      onClick={() => { setAuthModalTab('forgot_password'); setResetStep('request'); setAuthError(''); setResetEmail(''); }}
                      className="text-xs font-semibold text-[#4f6ef7] hover:underline cursor-pointer mb-1.5"
                    >
                      {language === 'de' ? 'Passwort vergessen?' : 'Forgot password?'}
                    </button>
                  </div>
                  <input 
                    type="password" 
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doLogin()}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white' : 'border-[#e2e5f1] bg-stone-50'}`}
                    placeholder={t('password')}
                  />
                </div>
                <button 
                  onClick={doLogin}
                  className="w-full bg-[#4f6ef7] hover:bg-[#6c83f8] text-white font-bold py-3.5 rounded-xl text-sm transition duration-200 cursor-pointer shadow-md mt-2"
                >
                  {t('login')}
                </button>
              </div>
            )}

            {/* REGISTER TAB FORM VIEW */}
            {authModalTab === 'register' && (
              <div className="space-y-4 pr-1">
                <div>
                  <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">
                    {language === 'de' ? 'Vorname (Optional)' : 'First Name (Optional)'}
                  </label>
                  <input 
                    type="text" 
                    value={regFirst}
                    onChange={(e) => setRegFirst(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white placeholder-slate-600' : 'border-[#e2e5f1] bg-stone-50 text-slate-900 placeholder-slate-400'}`}
                    placeholder={language === 'de' ? 'Dein Vorname' : 'Your First Name'}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">
                    {language === 'de' ? 'E-Mail-Adresse' : 'Email Address'}
                  </label>
                  <input 
                    type="email" 
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white placeholder-slate-600' : 'border-[#e2e5f1] bg-stone-50 text-slate-900 placeholder-slate-400'}`}
                    placeholder="email@example.com"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">{t('password')}</label>
                  <input 
                    type="password" 
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && doRegister()}
                    className={`w-full px-4 py-3 border rounded-xl text-sm transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white' : 'border-[#e2e5f1] bg-stone-50'}`}
                    placeholder={language === 'de' ? 'Passwort wählen (mind. 6 Zeichen)' : 'Choose password (min. 6 characters)'}
                  />
                </div>
                <button 
                  onClick={doRegister}
                  className="w-full bg-[#4f6ef7] hover:bg-[#6c83f8] text-white font-bold py-3.5 rounded-xl text-sm transition duration-200 cursor-pointer shadow-md mt-2"
                >
                  {t('register')}
                </button>
              </div>
            )}

            {/* SOCIAL CODE VERIFICATION TAB */}
            {authModalTab === 'verify_google' && pendingGoogleLogin && (
              <div className="space-y-5 text-left animate-zoom-in">
                <div className="text-center pb-2">
                  <h4 className="text-base font-black text-[#4f6ef7] dark:text-blue-400">
                    {language === 'de' 
                      ? `🔐 ${socialProviderName === 'apple' ? 'Apple' : 'Google'}-Anmeldung verifizieren` 
                      : `🔐 Verify ${socialProviderName === 'apple' ? 'Apple' : 'Google'} Login`}
                  </h4>
                  <p className="text-xs text-[#8b90a8] mt-1.5 leading-relaxed">
                    {language === 'de' 
                      ? `Ein 6-stelliger Bestätigungscode von AleksAI wurde automatisch an ${pendingGoogleLogin.email} gesendet. Bitte trage diesen unten ein.` 
                      : `A 6-digit confirmation code from AleksAI was automatically sent to ${pendingGoogleLogin.email}. Please enter it below.`}
                  </p>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 text-center">
                    {language === 'de' ? 'Bestätigungscode' : 'Verification Code'}
                  </label>
                  <input 
                    type="text" 
                    maxLength={6}
                    value={googleVerificationCodeInput}
                    onChange={(e) => setGoogleVerificationCodeInput(e.target.value.replace(/\D/g, ''))}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyGoogleCode()}
                    placeholder="123456"
                    className={`w-full px-4 py-3 border rounded-xl text-center text-xl font-black tracking-[8px] transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white placeholder-slate-850' : 'border-[#e2e5f1] bg-stone-50 text-slate-900 placeholder-stone-200'}`}
                  />
                </div>

                {isSendingGoogleCode ? (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-[#4f6ef7]" />
                    {language === 'de' ? 'Sende Bestätigungscode...' : 'Sending confirmation code...'}
                  </div>
                ) : (
                  <>
                    {googleCodeMethod === 'simulation' && (
                      <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-blue-600 dark:text-blue-300 text-xs text-left font-bold leading-normal space-y-1">
                        <p className="font-extrabold text-center">ℹ️ {language === 'de' ? 'Statischer / Simulations-Modus' : 'Static / Simulation Mode'}</p>
                        <p className="text-[10.5px] font-normal opacity-85 leading-relaxed">
                          {language === 'de'
                            ? 'Da die Anwendung auf Netlify oder einem statischen Hoster läuft, ist das Node.js-Backend nicht direkt erreichbar. Die E-Mail wurde daher simuliert:'
                            : 'Since the application is running on Netlify or a static host, the Node.js backend is not directly reachable. The email has been simulated:'}
                        </p>
                        <p className="text-center pt-1.5 font-black text-sm border-t border-blue-200/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-400">
                          {language === 'de' 
                            ? `Verifizierungscode: ${googleCodeSimulationValue}`
                            : `Verification Code: ${googleCodeSimulationValue}`}
                        </p>
                      </div>
                    )}
                    {googleCodeMethod === 'failed_smtp' && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs text-left leading-relaxed space-y-1">
                        <p className="font-bold">⚠️ SMTP-E-Mail-Versand fehlgeschlagen!</p>
                        <p className="text-[11px] opacity-90">
                          {language === 'de' 
                            ? `Deine SMTP-Zugangsdaten sind ungültig oder nicht konfiguriert (${googleSmtpError || 'Fehler 535'}).`
                            : `Your SMTP credentials are invalid or not configured (${googleSmtpError || 'Error 535'}).`}
                        </p>
                        <p className="pt-1 font-extrabold text-sm border-t border-amber-200/60 dark:border-amber-900/40">
                          {language === 'de' 
                            ? `Dein Verifizierungscode lautet: ${googleCodeSimulationValue}`
                            : `Your verification code is: ${googleCodeSimulationValue}`}
                        </p>
                      </div>
                    )}
                  </>
                )}

                <button 
                  onClick={handleVerifyGoogleCode}
                  className="w-full bg-[#4f6ef7] hover:bg-[#6c83f8] text-white font-bold py-3.5 rounded-xl text-sm transition duration-200 cursor-pointer shadow-md"
                >
                  {language === 'de' ? 'Code bestätigen & einloggen' : 'Verify Code & Log In'}
                </button>

                <button 
                  onClick={() => { setAuthModalTab('login'); setPendingGoogleLogin(null); }}
                  className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition py-1 cursor-pointer text-center block"
                >
                  {language === 'de' ? '← Zurück zum Login' : '← Back to Login'}
                </button>
              </div>
            )}

            {/* PASSWORD FORGOT TAB */}
            {authModalTab === 'forgot_password' && (
              <div className="space-y-4 text-left animate-zoom-in">
                <div className="text-center pb-2">
                  <h4 className="text-base font-black text-[#4f6ef7] dark:text-blue-400">
                    {language === 'de' ? '🔑 Passwort vergessen' : '🔑 Forgot Password'}
                  </h4>
                  <p className="text-xs text-[#8b90a8] mt-1.5 leading-relaxed">
                    {resetStep === 'request'
                      ? (language === 'de' 
                        ? 'Gib deine registrierte E-Mail-Adresse ein. Wir senden dir einen Bestätigungscode, um dein Passwort neu festzulegen.' 
                        : 'Enter your registered email address. We will send you a verification code to set a new password.')
                      : (language === 'de'
                        ? `Ein Code wurde an ${resetEmail} gesendet. Bitte gib ihn unten mit deinem neuen Passwort ein.`
                        : `A code has been sent to ${resetEmail}. Please enter it below with your new password.`)}
                  </p>
                </div>

                {resetStep === 'request' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">
                        {language === 'de' ? 'E-Mail-Adresse' : 'Email Address'}
                      </label>
                      <input 
                        type="email" 
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRequestPasswordReset()}
                        className={`w-full px-4 py-3 border rounded-xl text-sm transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white placeholder-slate-600' : 'border-[#e2e5f1] bg-stone-50 text-slate-900 placeholder-slate-400'}`}
                        placeholder="email@example.com"
                      />
                    </div>

                    <button 
                      onClick={handleRequestPasswordReset}
                      disabled={isSendingResetCode}
                      className="w-full bg-[#4f6ef7] hover:bg-[#6c83f8] text-white font-bold py-3.5 rounded-xl text-sm transition duration-200 cursor-pointer shadow-md flex items-center justify-center gap-2"
                    >
                      {isSendingResetCode && <Loader2 className="w-4 h-4 animate-spin" />}
                      {language === 'de' ? 'Bestätigungscode anfordern' : 'Request Verification Code'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">
                        {language === 'de' ? '6-stelliger Bestätigungscode' : '6-Digit Verification Code'}
                      </label>
                      <input 
                        type="text" 
                        maxLength={6}
                        value={resetCodeInput}
                        onChange={(e) => setResetCodeInput(e.target.value.replace(/\D/g, ''))}
                        className={`w-full px-4 py-3 border rounded-xl text-center text-lg font-black tracking-[6px] transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white' : 'border-[#e2e5f1] bg-stone-50 text-slate-900'}`}
                        placeholder="123456"
                      />
                    </div>

                     {resetCodeMethod === 'simulation' && (
                       <div className="p-3 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-blue-600 dark:text-blue-300 text-xs text-left font-bold leading-normal space-y-1">
                         <p className="font-extrabold text-center">ℹ️ {language === 'de' ? 'Statischer / Simulations-Modus' : 'Static / Simulation Mode'}</p>
                         <p className="text-[10.5px] font-normal opacity-85 leading-relaxed">
                           {language === 'de'
                             ? 'Da die Anwendung auf Netlify oder einem statischen Hoster läuft, ist das Node.js-Backend nicht direkt erreichbar. Die E-Mail wurde daher simuliert:'
                             : 'Since the application is running on Netlify or a static host, the Node.js backend is not directly reachable. The email has been simulated:'}
                         </p>
                         <p className="text-center pt-1.5 font-black text-sm border-t border-blue-200/50 dark:border-blue-900/30 text-blue-700 dark:text-blue-400">
                           {language === 'de' 
                             ? `Verifizierungscode: ${resetCodeSimulationValue}`
                             : `Verification Code: ${resetCodeSimulationValue}`}
                         </p>
                       </div>
                     )}
                    {resetCodeMethod === 'failed_smtp' && (
                      <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-200 text-xs text-left leading-relaxed space-y-1">
                        <p className="font-bold">⚠️ SMTP-E-Mail-Versand fehlgeschlagen!</p>
                        <p className="text-[11px] opacity-90">
                          {language === 'de' 
                            ? `Deine SMTP-Zugangsdaten sind ungültig oder nicht konfiguriert (${resetSmtpError || 'Fehler 535'}).`
                            : `Your SMTP credentials are invalid or not configured (${resetSmtpError || 'Error 535'}).`}
                        </p>
                        <p className="pt-1 font-extrabold text-sm border-t border-amber-200/60 dark:border-amber-900/40">
                          {language === 'de' 
                            ? `Dein Verifizierungscode lautet: ${resetCodeSimulationValue}`
                            : `Your verification code is: ${resetCodeSimulationValue}`}
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="text-[11px] font-bold text-[#4a4e6a] dark:text-slate-300 uppercase tracking-wider block mb-1.5 pl-1">
                        {language === 'de' ? 'Neues Passwort (mind. 6 Zeichen)' : 'New Password (min. 6 chars)'}
                      </label>
                      <input 
                        type="password" 
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleVerifyAndResetPassword()}
                        className={`w-full px-4 py-3 border rounded-xl text-sm transition outline-none ${darkMode ? 'bg-slate-950 border-slate-800 focus:border-blue-500 text-white' : 'border-[#e2e5f1] bg-stone-50'}`}
                        placeholder={language === 'de' ? 'Passwort wählen' : 'Choose password'}
                      />
                    </div>

                    <button 
                      onClick={handleVerifyAndResetPassword}
                      className="w-full bg-[#4f6ef7] hover:bg-[#6c83f8] text-white font-bold py-3.5 rounded-xl text-sm transition duration-200 cursor-pointer shadow-md"
                    >
                      {language === 'de' ? 'Passwort ändern & einloggen' : 'Change Password & Log In'}
                    </button>
                  </div>
                )}

                <button 
                  onClick={() => { setAuthModalTab('login'); setResetStep('request'); }}
                  className="w-full text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-white transition py-1 cursor-pointer text-center block"
                >
                  {language === 'de' ? '← Zurück zum Login' : '← Back to Login'}
                </button>
              </div>
            )}

            {/* GOOGLE & APPLE SIGN IN BUTTONS AND SEPARATOR */}
            {(authModalTab === 'login' || authModalTab === 'register') && (
              <>
                <div className="relative flex py-2 items-center my-3">
                  <div className={`flex-grow border-t ${darkMode ? 'border-slate-800' : 'border-[#e2e5f1]'}`}></div>
                  <span className="flex-shrink mx-3 text-[#8b90a8] text-[10px] font-bold uppercase tracking-wider">{t('or')}</span>
                  <div className={`flex-grow border-t ${darkMode ? 'border-slate-800' : 'border-[#e2e5f1]'}`}></div>
                </div>

                <div className="space-y-2.5">
                  <button 
                    onClick={doGoogleLogin}
                    className={`w-full font-bold py-3 rounded-xl text-xs md:text-sm transition duration-150 cursor-pointer flex items-center justify-center gap-2.5 shadow-sm border ${darkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-100' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                      <path fill="#EA4335" d="M12 5.04c1.61 0 3.05.56 4.19 1.65l3.12-3.12C17.43 1.84 14.92 1 12 1 7.35 1 3.39 3.67 1.42 7.58l3.78 2.93c.89-2.67 3.39-4.47 6.8-4.47z"/>
                      <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.51h6.44c-.28 1.48-1.12 2.74-2.38 3.58l3.7 2.87c2.16-1.99 3.43-4.92 3.43-8.61z"/>
                      <path fill="#FBBC05" d="M5.2 14.73c-.23-.69-.36-1.43-.36-2.2s.13-1.51.36-2.2L1.42 7.4c-.81 1.62-1.27 3.44-1.27 5.37s.46 3.75 1.27 5.37l3.78-2.93z"/>
                      <path fill="#34A853" d="M12 23c3.24 0 5.96-1.08 7.95-2.91l-3.7-2.87c-1.08.73-2.47 1.16-4.25 1.16-3.41 0-5.91-1.8-6.8-4.47l-3.78 2.93C3.39 19.33 7.35 23 12 23z"/>
                    </svg>
                    {language === 'de' ? 'Mit Google anmelden' : (language === 'en' ? 'Sign in with Google' : 'Google Login')}
                  </button>

                  <button 
                    onClick={doAppleLogin}
                    className={`w-full font-bold py-3 rounded-xl text-xs md:text-sm transition duration-150 cursor-pointer flex items-center justify-center gap-2.5 shadow-sm border ${darkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-850 text-slate-100' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <svg className="w-4.5 h-4.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M17.05 20.28c-.98.95-2.05 1.88-3.08 1.88-1.01 0-1.31-.61-2.48-.61-1.15 0-1.5.59-2.46.61-.99.02-2.13-1-3.13-1.92-2.03-1.89-3.58-5.32-3.58-8.52 0-5.07 3.32-7.76 6.46-7.76 1.05 0 2.02.37 2.66.75.64.38 1.25.75 1.93.75.68 0 1.18-.34 1.82-.71.74-.43 1.85-.81 3.01-.81 4.83 0 7.23 3.51 7.23 5.12-1.02.48-2.42 1.34-2.42 3.73 0 2.87 2.37 3.84 2.39 3.85-.02.05-.37 1.27-1.25 2.54M15.42 4.42c1.03-1.24 1.7-2.92 1.51-4.42-1.29.05-2.85.86-3.78 1.95-.8.92-1.5 2.62-1.31 4.1 1.44.11 2.91-.71 3.58-1.63"/>
                    </svg>
                    {language === 'de' ? 'Mit Apple anmelden' : 'Sign in with Apple'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── POST-REGISTRATION SURVEY MODAL ── */}
      {showSurveyModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4 backdrop-blur-md">
          <div className={`rounded-3xl w-full max-w-[460px] p-7 relative shadow-2xl overflow-hidden animate-zoom-in ${
            darkMode ? 'bg-slate-900 border border-slate-800 text-white' : 'bg-white text-slate-950 border border-stone-200'
          }`}>
            
            {/* Skip Option in Top-Right Corner */}
            <button 
              onClick={() => {
                setShowSurveyModal(false);
                triggerToast(language === 'de' ? 'Umfrage übersprungen. Viel Spaß mit AlerksAI!' : 'Survey skipped. Have fun with AlerksAI!');
              }}
              className="absolute top-5 right-5 px-3 py-1 text-xs font-bold rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 transition cursor-pointer text-slate-500 hover:text-slate-800 dark:hover:text-white"
            >
              {language === 'de' ? 'Überspringen ✕' : 'Skip ✕'}
            </button>

            {/* Header */}
            <div className="mb-6 text-left">
              <span className="text-[10px] font-black uppercase text-[#4f6ef7] tracking-widest block mb-1">
                {language === 'de' ? '⚡ Personalisierung' : '⚡ Personalization'}
              </span>
              <h3 className="text-lg font-black tracking-tight">
                {language === 'de' ? 'Unterstütze AlerksAI' : 'Support AlerksAI'}
              </h3>
              <div className="w-12 h-1 bg-[#4f6ef7] rounded-full mt-2" />
            </div>

            {/* Step Content */}
            <div className="space-y-5">
              {surveyStep === 1 && (
                <div className="space-y-3 text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'de' ? 'Frage 1 von 3: Wer bist du?' : 'Question 1 of 3: Who are you?'}
                  </p>
                  <p className="text-sm font-semibold mb-2">
                    {language === 'de' ? 'Welche Rolle beschreibt dich am besten?' : 'Which role describes you best?'}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { key: 'student', label: 'Schüler / Student 🎒', desc: 'Lerne mit dem Hausaufgaben- & Schulassistenten' },
                      { key: 'teacher', label: 'Lehrer / Dozent 👨‍🏫', desc: 'Erstelle Lehrmaterialien und Aufgaben' },
                      { key: 'developer', label: 'Entwickler / Tech-Pro 💻', desc: 'Programmiere interaktive Apps im Studio' },
                      { key: 'hobbyist', label: 'Hobbyist / Entdecker 🎨', desc: 'Gestalte kreative Welten auf eigene Faust' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSurveyAnswers(prev => ({ ...prev, role: opt.key }));
                          setSurveyStep(2);
                        }}
                        className={`p-3 text-left rounded-xl border text-xs font-bold flex flex-col transition cursor-pointer ${
                          surveyAnswers.role === opt.key 
                            ? 'border-violet-500 bg-violet-600/15' 
                            : (darkMode ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-slate-800')
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-normal opacity-60 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {surveyStep === 2 && (
                <div className="space-y-3 text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'de' ? 'Frage 2 von 3: Hauptinteresse' : 'Question 2 of 3: Main Interest'}
                  </p>
                  <p className="text-sm font-semibold mb-2">
                    {language === 'de' ? 'Was möchtest du hauptsächlich mit AlerksAI tun?' : 'What do you mainly want to do with AlerksAI?'}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { key: 'learning', label: 'Hausaufgaben & Schule 📚', desc: 'Effektive Lernbegleitung und Erklärungen' },
                      { key: 'building', label: 'Apps & Spiele entwickeln 🤖', desc: 'AlerksAI Studio AI-Builder ausreizen' },
                      { key: 'copilot', label: 'Allgemeiner Co-Pilot 🧠', desc: 'Allround-Unterstützung für den Alltag' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSurveyAnswers(prev => ({ ...prev, interest: opt.key }));
                          setSurveyStep(3);
                        }}
                        className={`p-3 text-left rounded-xl border text-xs font-bold flex flex-col transition cursor-pointer ${
                          surveyAnswers.interest === opt.key 
                            ? 'border-violet-500 bg-violet-600/15' 
                            : (darkMode ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-slate-800')
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-normal opacity-60 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {surveyStep === 3 && (
                <div className="space-y-3 text-left">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {language === 'de' ? 'Frage 3 von 3: Vorwissen' : 'Question 3 of 3: Experience'}
                  </p>
                  <p className="text-sm font-semibold mb-2">
                    {language === 'de' ? 'Wie gut kennst du dich mit Künstlicher Intelligenz aus?' : 'How well do you know Artificial Intelligence?'}
                  </p>
                  <div className="grid grid-cols-1 gap-2.5">
                    {[
                      { key: 'beginner', label: 'Anfänger 🌟', desc: 'Will Erste Schritte gehen & experimentieren' },
                      { key: 'intermediate', label: 'Fortgeschritten 🚀', desc: 'Kennt Prompts & gängige AI Chatbots bereits' },
                      { key: 'expert', label: 'Experte 👑', desc: 'Möchte komplexe Prompts & Programmier-Synthese' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSurveyAnswers(prev => ({ ...prev, experience: opt.key }));
                        }}
                        className={`p-3 text-left rounded-xl border text-xs font-bold flex flex-col transition cursor-pointer ${
                          surveyAnswers.experience === opt.key 
                            ? 'border-emerald-500 bg-emerald-600/15' 
                            : (darkMode ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300' : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-slate-800')
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="text-[10px] font-normal opacity-60 mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Controls */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                disabled={surveyStep === 1}
                onClick={() => setSurveyStep(prev => prev - 1)}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition cursor-pointer ${
                  surveyStep === 1 
                    ? 'opacity-40 cursor-not-allowed text-stone-400' 
                    : 'bg-[#f4f4f7] dark:bg-slate-800 hover:bg-[#e2e5f1] dark:hover:bg-slate-755 text-slate-500 dark:text-slate-300'
                }`}
              >
                {language === 'de' ? 'Zurück' : 'Back'}
              </button>

              {surveyStep < 3 ? (
                <button
                  onClick={() => {
                    const currentKeys = ['role', 'interest'];
                    const currentKey = currentKeys[surveyStep - 1];
                    if (!surveyAnswers[currentKey]) {
                      const fallback = currentKey === 'role' ? 'student' : 'learning';
                      setSurveyAnswers(prev => ({ ...prev, [currentKey]: fallback }));
                    }
                    setSurveyStep(prev => prev + 1);
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-violet-600 hover:bg-violet-500 rounded-lg shadow-md transition cursor-pointer"
                >
                  {language === 'de' ? 'Weiter' : 'Next'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    if (!surveyAnswers.experience) {
                      setSurveyAnswers(prev => ({ ...prev, experience: 'beginner' }));
                    }
                    setShowSurveyModal(false);
                    triggerToast(language === 'de' ? '🎉 Danke! Dein Erlebnis wurde personalisiert.' : '🎉 Thanks! Your experience has been personalized.');
                  }}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded-lg shadow-md transition cursor-pointer animate-pulse"
                >
                  {language === 'de' ? 'Fertigstellen ✨' : 'Finish ✨'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ── ALEKS ADMIN DASHBOARD OVERLAY MODAL ── */}
      {showAdminModal && currentUser?.email?.toLowerCase() === 'aleks.smolovic@web.de' && (() => {
        // List of administrative commands keeping only Gutscheincode and Willkommensgeschenk
        const ADMIN_COMMANDS = [
          { id: 66, title: "Gutscheincode generieren", category: "credit", desc: "Erstellt einen neuen Promo-Code mit einem bestimmbaren Guthabenbetrag (z.B. für Werbeaktionen oder Belohnungen).", badge: "Gutschein", badgeColor: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" },
          { id: 62, title: "Standard-Willkommensgeschenk", category: "credit", desc: "Legt fest, wie viele kostenlose Start-Credits neue Accounts und Gastsessions bei Registrierung erhalten.", badge: "Willkommensgeschenk", badgeColor: "bg-teal-500/10 text-teal-400 border-teal-500/20" }
        ];
        const UNUSED_PRESETS: any[] = [];

        // Action executors for the commands
        const executeSystemCommand = (cmd: typeof ADMIN_COMMANDS[0], overrides?: {
          couponCode?: string;
          couponCredits?: number;
          welcomeGift?: number;
          resetTarget?: number;
          giftAllAmount?: number;
          testUsersCount?: number;
        }) => {
          setAdminLogs(prev => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] BEFEHL #${cmd.id} AUSGEFÜHRT: ${cmd.title} (${cmd.desc})`
          ]);

          if (cmd.id === 66) {
            // Generate coupon
            const code = (overrides?.couponCode || cmdCouponName).trim().toUpperCase();
            const credits = overrides?.couponCredits !== undefined ? overrides.couponCredits : cmdCouponCredits;
            if (!code) {
              triggerToast("Fehler: Bitte einen Gutscheincode-Namen eingeben!");
              return;
            }
            let coupons: any[] = [];
            try {
              coupons = JSON.parse(localStorage.getItem('aleksai_coupons') || '[]');
            } catch (e) { coupons = []; }

            // Check if coupon already exists
            if (coupons.some(c => c.code.toUpperCase() === code)) {
              triggerToast(`Fehler: Der Code '${code}' existiert bereits!`);
              return;
            }

            coupons.push({ code, credits });
            localStorage.setItem('aleksai_coupons', JSON.stringify(coupons));
            setAdminLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] GUTSCHEIN ERSTELLT: '${code}' im Wert von +${credits} Credits.`
            ]);
            triggerToast(`Gutschein '${code}' mit +${credits} Credits erfolgreich generiert!`);
            setCmdCouponName(''); // clear input
          } else if (cmd.id === 62) {
            // Set welcome gift basic credits
            const val = overrides?.welcomeGift !== undefined ? overrides.welcomeGift : cmdWelcomeGift;
            localStorage.setItem('aleksai_welcome_gift_credits', String(val));
            setCmdWelcomeGift(val);
            setAdminLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] STARTGUTHABEN AKTUALISIERT: Neue Profile starten ab jetzt mit ${val} Credits.`
            ]);
            triggerToast(`Startguthaben beim Registrieren auf ${val} Credits gesetzt!`);
          } else if (cmd.id === 4) {
            // Reset database credits
            const target = overrides?.resetTarget !== undefined ? overrides.resetTarget : cmdResetTarget;
            const updated = adminUsers.map((u: any) => ({ ...u, credits: target }));
            setAdminUsers(updated);
            localStorage.setItem('aleksai_users', JSON.stringify(updated));
            
            // Sync current user state if they are logged in and in the admin accounts list
            if (currentUser) {
              setCurrentUser({ ...currentUser, credits: target });
              localStorage.setItem('aleks_ai_user', JSON.stringify({ ...currentUser, credits: target }));
            }
            setAdminLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] DB-RESET: Alle ${updated.length} Kontoguthaben wurden auf genau ${target} Credits gesetzt.`
            ]);
            triggerToast(`Alle Benutzerkonten erfolgreich auf ${target} Credits zurückgesetzt!`);
          } else if (cmd.id === 20) {
            // Gift all users extra
            const gift = overrides?.giftAllAmount !== undefined ? overrides.giftAllAmount : cmdGiftAllAmount;
            const updated = adminUsers.map((u: any) => ({ ...u, credits: (u.credits || 0) + gift }));
            setAdminUsers(updated);
            localStorage.setItem('aleksai_users', JSON.stringify(updated));

            // Sync current user state
            if (currentUser) {
              const freshCredits = currentUser.credits + gift;
              setCurrentUser({ ...currentUser, credits: freshCredits });
              localStorage.setItem('aleks_ai_user', JSON.stringify({ ...currentUser, credits: freshCredits }));
            }
            setAdminLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] GIFT ALL: Der gesamten Community (+${updated.length} Accounts) wurden je +${gift} Credits geschenkt.`
            ]);
            triggerToast(`🎁 +${gift} Credits erfolgreich an alle User verschenkt!`);
          } else if (cmd.id === 12) {
            // Generate mock users based on test counts
            const count = overrides?.testUsersCount || 5;
            const currentDateStr = new Date().toISOString().split('T')[0];
            const demoPool = [
              { firstName: "Markus", lastName: "Müller", username: "markus_test", credits: 250, email: "markus@test.de", lastCreditDay: currentDateStr, createdAt: new Date().toISOString() },
              { firstName: "Sven", lastName: "Petrovic", username: "sven_py", credits: 500, email: "sven@test.de", lastCreditDay: currentDateStr, createdAt: new Date().toISOString() },
              { firstName: "Elena", lastName: "Kovač", username: "elena_top", credits: 999, email: "elena@test.at", lastCreditDay: currentDateStr, createdAt: new Date().toISOString() },
              { firstName: "Aleks", lastName: "Junior", username: "aleks_jr", credits: 777, email: "junior@aleks.rs", lastCreditDay: currentDateStr, createdAt: new Date().toISOString() },
              { firstName: "Jasmin", lastName: "Schneider", username: "jas_schneider", credits: 1200, email: "jasmin@test.ch", lastCreditDay: currentDateStr, createdAt: new Date().toISOString() },
            ];

            const selectedUsers = demoPool.slice(0, Math.min(count, demoPool.length));
            const merged = [...adminUsers];
            let addedCount = 0;
            selectedUsers.forEach(du => {
              if (!merged.some(m => m.username === du.username)) {
                merged.push(du);
                addedCount++;
              }
            });
            setAdminUsers(merged);
            localStorage.setItem('aleksai_users', JSON.stringify(merged));
            setAdminLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] DEMO GENERIERUNG: ${addedCount} neue simulierte User-Profile der Datenbank hinzugefügt.`
            ]);
            triggerToast(`Erfolgreich ${addedCount} neue Testuser der Datenbank hinzugefügt!`);
          } else if (cmd.id === 3) {
            // Clean up guest sessions
            const registeredOnly = adminUsers.filter((u: any) => u.email && u.email.includes("@"));
            setAdminUsers(registeredOnly);
            localStorage.setItem('aleksai_users', JSON.stringify(registeredOnly));
            setAdminLogs(prev => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] GÄSTE PURGE: Saubere Löschung aller inaktiven Sandbox-Gästesessions abgeschlossen.`
            ]);
            triggerToast("Temporäre Gastsessions erfolgreich bereinigt!");
          } else if (cmd.id === 23) {
            // Hard Reset
            localStorage.clear();
            setAdminLogs([`[${new Date().toLocaleTimeString()}] SYSTEM PURGE: Sämtliche lokale Speicherung weggesprengt.`]);
            triggerToast("Local-Storage komplett plattgemacht! App startet neu...");
            setTimeout(() => {
              window.location.reload();
            }, 1000);
          } else {
            triggerToast(`Befehlsinstanz #${cmd.id} '${cmd.title}' geladen & ausgeführt!`);
          }
        };

        // Realtime stats metrics
        const totalUsers = adminUsers.length || 1;
        const totalCreditsSum = adminUsers.reduce((acc, current) => acc + (current.credits || 0), 0);
        const avgCredits = Math.round(totalCreditsSum / totalUsers);

        // Filter commands
        const filteredCommands = ADMIN_COMMANDS.filter(cmd => {
          // Category match
          if (adminCommandCategory !== 'alle' && cmd.category !== adminCommandCategory) {
            return false;
          }
          // Search string match
          if (adminCommandSearch.trim() !== '') {
            const query = adminCommandSearch.toLowerCase();
            return cmd.title.toLowerCase().includes(query) || cmd.desc.toLowerCase().includes(query) || String(cmd.id) === query;
          }
          return true;
        });

        return (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className={`relative w-full max-w-6xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col my-auto h-[90vh] ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-100 text-slate-900'}`}>
              
              {/* HEADER CONTAINER */}
              <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3">
                  <span className="text-3xl animate-bounce">👑</span>
                  <div className="text-left">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-xl tracking-tight">AlerksAI Master-Zentrum</h3>
                      <span className="bg-black/30 text-[8px] tracking-widest uppercase font-black px-2 py-0.5 rounded-full border border-white/20">v3.5 LIVE</span>
                    </div>
                    <p className="text-[10px] text-emerald-100 opacity-90 font-bold uppercase tracking-widest mt-0.5">ADMIN-KONTROLLE &amp; REALTIME TELEMETRIE · ANGEMELDET ALS: aleks.smolovic@web.de</p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAdminModal(false)}
                  className="bg-white/10 hover:bg-white/25 active:scale-95 transition rounded-full w-10 h-10 flex items-center justify-center font-black cursor-pointer text-sm"
                  title="Schließen"
                >
                  ✕
                </button>
              </div>

              {/* MODERN NAVIGATION TAB BAR */}
              <div className={`border-b flex flex-wrap gap-1 px-6 py-3 shrink-0 ${darkMode ? 'bg-slate-950/70 border-slate-850' : 'bg-stone-50 border-stone-200'}`}>
                <button 
                  onClick={() => setAdminActiveTab('analytics')}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black transition duration-200 cursor-pointer flex items-center gap-2 ${adminActiveTab === 'analytics' ? 'bg-[#4f6ef7] text-white shadow-md' : (darkMode ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-150')}`}
                >
                  📊 Live Analytics Dashboard
                </button>
                <button 
                  onClick={() => setAdminActiveTab('users')}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black transition duration-200 cursor-pointer flex items-center gap-2 ${adminActiveTab === 'users' ? 'bg-[#4f6ef7] text-white shadow-md' : (darkMode ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-150')}`}
                >
                  👥 Benutzerdatenbank ({adminUsers.length})
                </button>
                <button 
                  onClick={() => setAdminActiveTab('commands')}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black transition duration-200 cursor-pointer flex items-center gap-2 ${adminActiveTab === 'commands' ? 'bg-[#4f6ef7] text-white shadow-md text-emerald-300' : (darkMode ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-150')}`}
                >
                  🛠️ System-Befehle ({ADMIN_COMMANDS.length})
                </button>
                <button 
                  onClick={() => setAdminActiveTab('broadcast')}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black transition duration-200 cursor-pointer flex items-center gap-2 ${adminActiveTab === 'broadcast' ? 'bg-[#4f6ef7] text-white shadow-md' : (darkMode ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-150')}`}
                >
                  📣 Rundschreiben
                </button>
                <button 
                  onClick={() => setAdminActiveTab('logs')}
                  className={`px-4.5 py-2 rounded-xl text-xs font-black transition duration-200 cursor-pointer flex items-center gap-2 ${adminActiveTab === 'logs' ? 'bg-[#4f6ef7] text-white shadow-md' : (darkMode ? 'text-slate-300 hover:bg-slate-900' : 'text-slate-600 hover:bg-slate-150')}`}
                >
                  📜 System-Logs
                </button>
              </div>

              {/* CENTRAL VIEW AREA */}
              <div className="flex-1 overflow-y-auto p-6 text-left">
                
                {/* VIEW 1: LIVE ANALYTICS */}
                {adminActiveTab === 'analytics' && (
                  <div className="space-y-6">
                    {/* Core Dashboard Metric KPI Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* KPI 1 */}
                      <div className={`p-5 rounded-2xl border transition shadow-sm flex items-center gap-4 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-[#fcfdfe] border-[#e2e5f1]'}`}>
                        <div className="w-12 h-12 rounded-xl bg-violet-550/10 text-violet-500 font-extrabold flex items-center justify-center text-xl shrink-0">👥</div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Profile Gesamt</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5">{adminUsers.length} Benutzer</div>
                          <div className="text-[9px] text-emerald-500 font-bold mt-0.5">● 100% Echtzeit Sync</div>
                        </div>
                      </div>
                      {/* KPI 2 */}
                      <div className={`p-5 rounded-2xl border transition shadow-sm flex items-center gap-4 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-[#fcfdfe] border-[#e2e5f1]'}`}>
                        <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 font-extrabold flex items-center justify-center text-xl shrink-0">⚡</div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Münzenverbund gelernt</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5">{totalCreditsSum} Credits</div>
                          <div className="text-[9px] text-blue-500 font-bold mt-0.5">Soll-Guthaben im Pool</div>
                        </div>
                      </div>
                      {/* KPI 3 */}
                      <div className={`p-5 rounded-2xl border transition shadow-sm flex items-center gap-4 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-[#fcfdfe] border-[#e2e5f1]'}`}>
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 font-extrabold flex items-center justify-center text-xl shrink-0">📊</div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Ø Guthaben</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5">{avgCredits} Credits</div>
                          <div className="text-[9px] text-slate-400 mt-0.5">Schnitt pro Kopf</div>
                        </div>
                      </div>
                      {/* KPI 4 */}
                      <div className={`p-5 rounded-2xl border transition shadow-sm flex items-center gap-4 ${darkMode ? 'bg-slate-950/40 border-slate-800' : 'bg-[#fcfdfe] border-[#e2e5f1]'}`}>
                        <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-500 font-extrabold flex items-center justify-center text-xl shrink-0">🌍</div>
                        <div>
                          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Server-Status</div>
                          <div className="text-xl font-extrabold tracking-tight mt-0.5 text-emerald-500 flex items-center gap-1.5">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping"></span>
                            Online
                          </div>
                          <div className="text-[9px] text-slate-400 font-bold mt-0.5">Latenz: {adminSimulatedLatency}ms</div>
                        </div>
                      </div>
                    </div>

                    {/* LIVE TELEMETRY GRAPHS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* TRAFFIC SPLINE CHART (8/12 col) */}
                      <div className={`lg:col-span-8 p-6 rounded-2xl border flex flex-col justify-between ${darkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-[#f8f9fc] border-[#e2e5f1]'}`}>
                        <div>
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-[#4f6ef7]">Server-Anfragen &amp; API Call Häufigkeit</h4>
                              <p className={`text-[10px] leading-relaxed mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Visualisierter API-Zugriff über die letzten 12 Belastungsstunden (Simuliert in Echtzeit).</p>
                            </div>
                            <span className="text-[9px] uppercase font-black tracking-widest text-[#22c55e] bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">LIVE UPDATE</span>
                          </div>
                        </div>

                        {/* Spline Graphics drawn in pure inline SVG */}
                        <div className="my-5 w-full">
                          <svg viewBox="0 0 500 120" className="w-full h-32 overflow-visible">
                            <defs>
                              <linearGradient id="gradient-area" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#4f6ef7" stopOpacity="0.4" />
                                <stop offset="100%" stopColor="#4f6ef7" stopOpacity="0.0" />
                              </linearGradient>
                            </defs>
                            {/* Grid lines */}
                            <line x1="0" y1="20" x2="500" y2="20" stroke={darkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="0.5" strokeDasharray="3 3"/>
                            <line x1="0" y1="60" x2="500" y2="60" stroke={darkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="0.5" strokeDasharray="3 3"/>
                            <line x1="0" y1="100" x2="500" y2="100" stroke={darkMode ? "#1e293b" : "#e2e8f0"} strokeWidth="0.5"/>
                            
                            {/* Filled Area under Curve */}
                            <path 
                              d="M 0 100 Q 50 40 100 80 T 200 45 T 300 15 T 400 90 T 500 20 L 500 100 L 0 100 Z" 
                              fill="url(#gradient-area)"
                            />

                            {/* Line path */}
                            <path 
                              d="M 0 100 Q 50 40 100 80 T 200 45 T 300 15 T 400 90 T 500 20" 
                              fill="none" 
                              stroke="#6c83f8" 
                              strokeWidth="2.5"
                              strokeLinecap="round"
                            />

                            {/* Dynamic Live point pulse */}
                            <circle cx="500" cy="20" r="5" fill="#ef4444" className="animate-ping" />
                            <circle cx="500" cy="20" r="4.5" fill="#4f6ef7" />

                            {/* Data Markers */}
                            <circle cx="100" cy="80" r="3" fill="#6c83f8" />
                            <circle cx="200" cy="45" r="3" fill="#6c83f8" />
                            <circle cx="300" cy="15" r="3" fill="#6c83f8" />
                            <circle cx="400" cy="90" r="3" fill="#6c83f8" />

                            {/* Labels */}
                            <text x="5" y="115" className="fill-slate-400 font-mono text-[7px]" fontWeight="bold">-12 Std</text>
                            <text x="250" y="115" className="fill-slate-400 font-mono text-[7px] text-center" fontWeight="bold">-6 Std</text>
                            <text x="460" y="115" className="fill-slate-400 font-mono text-[7px]" fontWeight="bold">Jetzt</text>
                          </svg>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center border-t border-dashed border-slate-200 dark:border-slate-800 pt-3.5">
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-bold">Heutige Abfragen</div>
                            <div className="text-xs font-black mt-0.5">1.482 Calls</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-bold">Erfolgsquote API</div>
                            <div className="text-xs font-black text-emerald-500 mt-0.5">99.85%</div>
                          </div>
                          <div>
                            <div className="text-[9px] text-slate-400 uppercase font-bold">Cached Hits</div>
                            <div className="text-xs font-black text-indigo-500 mt-0.5">32.4%</div>
                          </div>
                        </div>
                      </div>

                      {/* PHYSICAL RESOURCES (4/12 col) */}
                      <div className="lg:col-span-4 space-y-4">
                        {/* 1. INFINITE SWITCH */}
                        <div className={`p-4 rounded-2xl border transition-all ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#f8f9fc] border-[#e2e5f1]'}`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-[11px] font-black uppercase tracking-wider text-[#4f6ef7] mb-0.5">Unbegrenztes Guthaben</h4>
                              <p className={`text-[10px] leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bypass alle Credit-Abzüge nur für deinen Account.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isAdminInfinite} 
                                onChange={(e) => {
                                  const val = e.target.checked;
                                  setIsAdminInfinite(val);
                                  localStorage.setItem('aleksai_admin_infinite', String(val));
                                  setAdminLogs(prev => [
                                    ...prev,
                                    `[${new Date().toLocaleTimeString()}] Admin Infinite Credits: ${val ? 'AKTIVIERTER PREMIUM BYPASS' : 'DEAKTIVIERT'}`
                                  ]);
                                  triggerToast(val ? 'Kostenloser Premium-Bypass aktiv! ⚡' : 'Abzüge aktiv.');
                                }}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-400 dark:bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                        </div>

                        {/* CPU Dials */}
                        <div className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#f8f9fc] border-[#e2e5f1]'}`}>
                          <h4 className="text-[11px] font-black uppercase tracking-wider text-[#4f6ef7] mb-3">Server-Auslastung (Telemetrie)</h4>
                          
                          <div className="space-y-3.5">
                            {/* CPU */}
                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span className="opacity-80">CPU-Last</span>
                                <span className="font-mono text-emerald-500 font-extrabold">{adminSimulatedCpu}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-emerald-500 duration-500 ease-out rounded-full" style={{ width: `${adminSimulatedCpu}%` }}></div>
                              </div>
                            </div>

                            {/* RAM */}
                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span className="opacity-80">RAM-Belegung</span>
                                <span className="font-mono text-blue-500 font-extrabold">{adminSimulatedRam}%</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-[#4f6ef7] duration-500 ease-out rounded-full" style={{ width: `${adminSimulatedRam}%` }}></div>
                              </div>
                            </div>

                            {/* Disk Space */}
                            <div>
                              <div className="flex justify-between text-[11px] font-bold mb-1">
                                <span className="opacity-80">Freier SSD Speicher</span>
                                <span className="font-mono text-purple-400 font-extrabold">87.2 GB</span>
                              </div>
                              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                <div className="h-full bg-purple-500 rounded-full" style={{ width: `72%` }}></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* VIEW 2: BENUTZERDATENBANK */}
                {adminActiveTab === 'users' && (
                  <div className={`p-5 rounded-3xl border flex flex-col min-h-[460px] ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#f8f9fc] border-[#e2e5f1]'}`}>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 mb-5">
                      <div>
                        <h4 className="text-sm font-black uppercase tracking-wider text-[#4f6ef7]">Registrierte Benutzerdatenbank</h4>
                        <p className={`text-[11px] leading-snug ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Erteile Guthaben pro Account, durchsuche Datensätze und entferne unerwünschte Profile.</p>
                      </div>
                      {/* Search Field */}
                      <input 
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Name oder E-Mail suchen..."
                        className={`px-3 py-1.5 text-xs rounded-xl border focus:outline-none w-full sm:w-56 ${darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:border-blue-500' : 'bg-white border-[#e2e5f1] placeholder-slate-400 focus:border-[#4f6ef7]'}`}
                      />
                    </div>

                    {/* Users List Wrapper */}
                    <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
                      {adminUsers.filter(u => {
                        if (!adminSearch) return true;
                        const s = adminSearch.toLowerCase();
                        return u.username?.toLowerCase().includes(s) || 
                               u.firstName?.toLowerCase().includes(s) || 
                               u.lastName?.toLowerCase().includes(s) ||
                               u.email?.toLowerCase().includes(s);
                      }).length === 0 ? (
                        <div className="text-center py-12 text-xs text-slate-400 font-bold border-2 border-dashed border-slate-250 dark:border-slate-800 rounded-3xl">
                          Keine passenden Benutzerkonten in der Datenbank gefunden.
                        </div>
                      ) : (
                        adminUsers
                          .filter(u => {
                            if (!adminSearch) return true;
                            const s = adminSearch.toLowerCase();
                            return u.username?.toLowerCase().includes(s) || 
                                   u.firstName?.toLowerCase().includes(s) || 
                                   u.lastName?.toLowerCase().includes(s) ||
                                   u.email?.toLowerCase().includes(s);
                          })
                          .map((u, uIdx) => {
                            const isItAleks = u.email?.toLowerCase() === 'aleks.smolovic@web.de';
                            return (
                              <div 
                                key={uIdx} 
                                className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between md:items-center gap-4 transition duration-150 ${darkMode ? 'bg-slate-900/60 border-slate-850 hover:border-slate-800' : 'bg-white border-stone-100 hover:border-slate-200'}`}
                              >
                                <div className="space-y-1 text-left">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-7 h-7 rounded-full text-[11px] font-black flex items-center justify-center text-white ${isItAleks ? 'bg-gradient-to-tr from-yellow-500 via-orange-500 to-red-650 shadow' : 'bg-slate-500'}`}>
                                      {isItAleks ? '👑' : (u.firstName ? u.firstName[0].toUpperCase() : '👤')}
                                    </span>
                                    <div>
                                      <span className="font-extrabold text-[#4f6ef7] text-xs">
                                        {u.firstName || 'Gast'} {u.lastName || ''}
                                      </span>
                                      <span className="opacity-60 text-[9px] font-mono block">@{u.username || 'gast'}</span>
                                    </div>
                                    {isItAleks && (
                                      <span className="text-[7px] uppercase font-black text-yellow-500 bg-yellow-500/10 px-1.5 py-0.5 rounded border border-yellow-500/20">Besitzer / Admin</span>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono tracking-tight pl-9">
                                    ✉️ {u.email || 'Keine E-Mail angegeben (Gast)'}
                                  </div>
                                </div>

                                {/* Credits modifier panel right side */}
                                <div className="flex flex-wrap items-center gap-2 pl-9 md:pl-0 md:self-center">
                                  <div className={`px-2.5 py-1 text-xs font-black rounded-lg border flex items-center gap-1 ${darkMode ? 'bg-slate-950 border-slate-800 text-blue-400' : 'bg-[#eef1ff] border-[#e2e5f1] text-[#4f6ef7]'}`} title="Aktuelle Credits">
                                    ⚡ {u.credits}
                                  </div>

                                  <button
                                    onClick={() => handleUpdateUserCredits(u.firebaseUid, u.username, u.credits + 10)}
                                    className={`p-1.5 text-[9px] font-black rounded-lg border cursor-pointer transition ${darkMode ? 'bg-slate-800 border-slate-750 hover:bg-slate-755 text-slate-100' : 'bg-stone-50 border-[#e2e5f1] hover:bg-stone-100 text-[#4a4e6a]'}`}
                                    title="+10 Credits"
                                  >
                                    +10
                                  </button>
                                  <button
                                    onClick={() => handleUpdateUserCredits(u.firebaseUid, u.username, u.credits + 100)}
                                    className={`p-1.5 text-[9px] font-black rounded-lg border cursor-pointer transition ${darkMode ? 'bg-slate-800 border-slate-750 hover:bg-slate-755 text-slate-100' : 'bg-stone-50 border-[#e2e5f1] hover:bg-stone-100 text-[#4a4e6a]'}`}
                                    title="+100 Credits"
                                  >
                                    +100
                                  </button>
                                  <button
                                    onClick={() => handleUpdateUserCredits(u.firebaseUid, u.username, Math.max(0, u.credits - 50))}
                                    className={`p-1.5 text-[9px] font-black rounded-lg border cursor-pointer transition ${darkMode ? 'bg-slate-800 border-slate-750 hover:bg-slate-755 text-slate-100' : 'bg-stone-50 border-[#e2e5f1] hover:bg-stone-100 text-[#4a4e6a]'}`}
                                    title="-50 Credits"
                                  >
                                    -50
                                  </button>
                                  
                                  {/* Custom credit input field */}
                                  <input 
                                    type="number" 
                                    placeholder="Wert..."
                                    className={`w-14 p-1 text-[10px] text-center font-bold rounded-lg border focus:outline-none ${darkMode ? 'bg-slate-950 border-slate-800 text-white' : 'bg-stone-50 border-[#e2e5f1] text-slate-800'}`}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const val = Number((e.target as HTMLInputElement).value);
                                        if (!isNaN(val) && val >= 0) {
                                          handleUpdateUserCredits(u.firebaseUid, u.username, val);
                                          (e.target as HTMLInputElement).value = '';
                                        }
                                      }
                                    }}
                                    title="Spezifisches Guthaben eingeben & Enter drücken"
                                  />

                                  <button
                                    onClick={() => handleUpdateUserCredits(u.firebaseUid, u.username, 1000)}
                                    className="p-1.5 text-[9px] font-extrabold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition cursor-pointer"
                                    title="Direkt auf 1000 Münzen setzen"
                                  >
                                    Satz 1K
                                  </button>

                                  {/* Delete button */}
                                  <button 
                                    onClick={() => {
                                      if (window.confirm(`Möchtest du das Benutzerkonto '${u.firstName || u.username}' (${u.email || u.username}) wirklich dauerhaft löschen?`)) {
                                        handleAdminDeleteUser(u.username);
                                      }
                                    }}
                                    className="p-1.5 rounded-lg cursor-pointer bg-red-100 hover:bg-red-200 dark:bg-red-950/40 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 transition"
                                    title="Profil löschen"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW 3: SYSTEM-BEFEHLE (THE 67 PRESETS) */}
                {adminActiveTab === 'commands' && (
                  <div className="space-y-4">
                    {/* Filter bar and search */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center shrink-0">
                      <div className="md:col-span-8 flex flex-wrap gap-1">
                        {[
                          { key: 'alle', label: 'Alle' },
                          { key: 'db', label: 'Datenbank' },
                          { key: 'credit', label: 'Credits' },
                          { key: 'api', label: 'Modelle & APIs' },
                          { key: 'security', label: 'Sicherheit' },
                          { key: 'sys', label: 'Infrastruktur' }
                        ].map(tab => (
                          <button
                            key={tab.key}
                            onClick={() => setAdminCommandCategory(tab.key)}
                            className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${adminCommandCategory === tab.key ? 'bg-emerald-600 text-white shadow' : (darkMode ? 'bg-slate-850 text-slate-350 hover:bg-slate-800' : 'bg-stone-100 text-stone-600 hover:bg-stone-200')}`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>

                      <div className="md:col-span-4">
                        <input 
                          type="text"
                          value={adminCommandSearch}
                          onChange={(e) => setAdminCommandSearch(e.target.value)}
                          placeholder="Befehl filtern..."
                          className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500 focus:border-emerald-500' : 'bg-white border-slate-205 placeholder-slate-400 focus:border-emerald-500'}`}
                        />
                      </div>
                    </div>

                    {/* Quick counter */}
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between">
                      <span>Gefilterte Ansicht: {filteredCommands.length} von {ADMIN_COMMANDS.length} Befehlsinstanzen</span>
                      <span>Kategorie: {adminCommandCategory.toUpperCase()}</span>
                    </div>

                    {/* INTERACTIVE SELECTED COMMAND PARAMETERS WORKSPACE */}
                    {adminSelectedCommandId !== null && (() => {
                      const selectedCmd = ADMIN_COMMANDS.find(c => c.id === adminSelectedCommandId);
                      if (!selectedCmd) return null;
                      
                      const isCustomizable = [66, 62, 4, 20, 12].includes(selectedCmd.id);

                      return (
                        <div className={`p-5 rounded-2xl border-2 border-emerald-500/20 animate-fade-in text-left ${darkMode ? 'bg-slate-950/60' : 'bg-emerald-50/20'}`}>
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-emerald-500 text-sm">🔧</span>
                                <h4 className="font-extrabold text-[10px] text-emerald-500 uppercase tracking-widest">
                                  Befehls-Parameter konfigurieren: #{selectedCmd.id} von {ADMIN_COMMANDS.length}
                                </h4>
                              </div>
                              <h3 className="font-black text-sm text-slate-900 dark:text-white mt-1">
                                {selectedCmd.title}
                              </h3>
                              <p className={`text-[11px] leading-snug mt-0.5 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                {selectedCmd.desc}
                              </p>
                            </div>
                            <button 
                              onClick={() => setAdminSelectedCommandId(null)}
                              className="text-xs text-red-500 hover:underline font-black px-2 py-1 cursor-pointer"
                            >
                              Schließen ✕
                            </button>
                          </div>

                          {/* INTERACTIVE FORM CONTROLS */}
                          <div className="mt-4 pt-3 border-t border-dashed border-slate-150 dark:border-slate-800 space-y-3">
                            {selectedCmd.id === 66 && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Gutscheincode Name</label>
                                  <input 
                                    type="text" 
                                    placeholder="z.B. ALEKSVIP, WELCOME500..."
                                    value={cmdCouponName}
                                    onChange={(e) => setCmdCouponName(e.target.value)}
                                    className={`w-full px-3 py-2 text-xs rounded-xl border uppercase font-mono font-bold focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600' : 'bg-white border-slate-200 text-slate-900'}`}
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Guthaben (Credits)</label>
                                  <input 
                                    type="number" 
                                    placeholder="z.B. 1000"
                                    value={cmdCouponCredits}
                                    onChange={(e) => setCmdCouponCredits(Math.max(1, Number(e.target.value)))}
                                    className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                  />
                                </div>
                              </div>
                            )}

                            {selectedCmd.id === 62 && (
                              <div className="max-w-md text-left">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Neues Willkommensgeschenk (Credits)</label>
                                <input 
                                  type="number" 
                                  value={cmdWelcomeGift}
                                  onChange={(e) => setCmdWelcomeGift(Math.max(0, Number(e.target.value)))}
                                  className={`w-full max-w-[200px] px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                />
                                <span className="text-[10px] text-slate-400 block mt-1">Neue Registrierungen und Gastsessions erhalten ab sofort genau diesen Betrag statt standardmäßig 100 Credits.</span>
                              </div>
                            )}

                            {selectedCmd.id === 4 && (
                              <div className="max-w-md text-left">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Ziel-Guthaben für alle Benutzer</label>
                                <input 
                                  type="number" 
                                  value={cmdResetTarget}
                                  onChange={(e) => setCmdResetTarget(Math.max(0, Number(e.target.value)))}
                                  className={`w-full max-w-[200px] px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                />
                                <span className="text-[10px] text-red-400 block mt-1 font-bold">⚠️ Warnung: Dies überschreibt das Guthaben von allen {adminUsers.length} registrierten Profilen in der Lokaldatenbank!</span>
                              </div>
                            )}

                            {selectedCmd.id === 20 && (
                              <div className="max-w-md text-left">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Credits-Menge zum Verschenken</label>
                                <input 
                                  type="number" 
                                  value={cmdGiftAllAmount}
                                  onChange={(e) => setCmdGiftAllAmount(Math.max(1, Number(e.target.value)))}
                                  className={`w-full max-w-[200px] px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                />
                                <span className="text-[10px] text-slate-400 block mt-1">Dieser Wert wird jedem existierenden Profil auf sein aktuelles Konto aufaddiert.</span>
                              </div>
                            )}

                            {selectedCmd.id === 12 && (
                              <div className="max-w-md text-left">
                                <label className="block text-[10px] font-black uppercase text-slate-400 mb-1">Anzahl simulierter User-Profile generieren</label>
                                <select 
                                  value={cmdGiftAllAmount > 5 ? 5 : cmdGiftAllAmount} 
                                  onChange={(e) => setCmdGiftAllAmount(Number(e.target.value))}
                                  className={`w-full max-w-[240px] px-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-emerald-500 ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'}`}
                                >
                                  <option value={1}>1 Test-Profil</option>
                                  <option value={2}>2 Test-Profile</option>
                                  <option value={3}>3 Test-Profile</option>
                                  <option value={4}>4 Test-Profile</option>
                                  <option value={5}>5 Test-Profile (Vollständige Demo-Gruppe)</option>
                                </select>
                              </div>
                            )}

                            {!isCustomizable && (
                              <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-xl text-[10.5px] text-slate-450 flex items-center gap-2">
                                <span>ℹ️</span> Dieser Befehl benötigt keine individuellen Zusatzdaten. Er wird mit vordefinierten sicheren Serverparametern gestartet.
                              </div>
                            )}

                            <div className="flex gap-2 justify-end mt-4 pt-2">
                              <button 
                                onClick={() => setAdminSelectedCommandId(null)}
                                className={`text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-750 text-slate-300' : 'bg-stone-50 hover:bg-stone-100 text-[#4a4e6a]'}`}
                              >
                                Abbrechen
                              </button>
                              <button 
                                onClick={() => {
                                  executeSystemCommand(selectedCmd);
                                  setAdminSelectedCommandId(null);
                                }}
                                className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-black px-4 py-2 rounded-xl transition shadow-md flex items-center gap-1.5 active:scale-95 duration-150 cursor-pointer uppercase tracking-wider"
                              >
                                {isCustomizable ? "✓ Befehl mit Custom-Daten ausführen" : "⚡ Befehl starten"}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {/* Commands Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
                      {filteredCommands.map((cmd) => (
                        <div 
                          key={cmd.id} 
                          className={`p-3.5 rounded-2xl border flex flex-col justify-between transition-all duration-150 hover:shadow-sm hover:scale-[1.01] ${darkMode ? 'bg-slate-900/50 border-slate-850 hover:border-slate-800' : 'bg-white border-stone-100 hover:border-slate-200'}`}
                        >
                          <div>
                            <div className="flex justify-between items-start gap-1">
                              <span className="text-[9px] font-black font-mono text-slate-455 dark:text-slate-500">#{cmd.id} (System-Presets)</span>
                              <span className={`text-[7.5px] uppercase font-black px-1.5 py-0.5 rounded border ${cmd.badgeColor}`}>
                                {cmd.badge}
                              </span>
                            </div>
                            <h5 className="font-extrabold text-xs text-slate-900 dark:text-slate-50 mt-1.5 flex items-center gap-1.5">
                              <span>⚡</span> {cmd.title}
                            </h5>
                            <p className="text-[10.5px] text-slate-400 leading-snug mt-1 font-medium">{cmd.desc}</p>
                          </div>

                          <div className="mt-3.5 pt-3 border-t border-dashed border-slate-100 dark:border-slate-850 flex justify-end">
                            <button
                              onClick={() => {
                                setAdminSelectedCommandId(cmd.id);
                                if (cmd.id === 66 && !cmdCouponName) {
                                  setCmdCouponName('ALEKS' + Math.floor(100 + Math.random() * 900));
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 hover:scale-105 duration-100 text-white text-[10px] font-black px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 shadow-sm uppercase tracking-wider"
                            >
                              Konfigurieren
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIEW 4: BROADCAST / RUNDSCHREIBEN */}
                {adminActiveTab === 'broadcast' && (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left Column Settings */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#f8f9fc] border-[#e2e5f1]'}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#4f6ef7] mb-1">Globale System-Mitteilung (Broadcast)</h4>
                        <p className={`text-[11px] leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Erstelle eine leuchtende Info-Nachricht, die sofort ganz oben für alle angemeldeten Benutzer der AlerksAI App eingeblendet wird.</p>
                        
                        <textarea 
                          value={adminBroadcast}
                          onChange={(e) => setAdminBroadcast(e.target.value)}
                          placeholder="Achtung: Systemwartung heute abend ab 20:00 Uhr zur Optimierung / Neues Modell Max freigeschaltet..."
                          rows={3}
                          className={`w-full p-3.5 text-xs rounded-xl border focus:outline-none resize-none mb-3 duration-200 font-bold ${darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-600 focus:border-blue-500' : 'bg-white border-[#e2e5f1] placeholder-slate-400 focus:border-[#4f6ef7]'}`}
                        />

                        <div className="flex gap-2 justify-end">
                          {adminBroadcast && (
                            <button
                              onClick={() => {
                                setAdminBroadcast('');
                                localStorage.removeItem('aleksai_broadcast');
                                setAdminLogs(prev => [
                                  ...prev,
                                  `[${new Date().toLocaleTimeString()}] Systemmeldung gelöscht.`
                                ]);
                                triggerToast('Mitteilung entfernt!');
                              }}
                              className={`text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer ${darkMode ? 'bg-slate-800 hover:bg-slate-750 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
                            >
                              Nachricht löschen
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const sanitized = adminBroadcast.trim();
                              if (sanitized) {
                                localStorage.setItem('aleksai_broadcast', sanitized);
                                setAdminLogs(prev => [
                                  ...prev,
                                  `[${new Date().toLocaleTimeString()}] Rundnachricht geschaltet: "${sanitized}"`
                                ]);
                                triggerToast('Systemmeldung live geschaltet! 📣');
                              } else {
                                triggerToast('Bitte gib einen Text ein.');
                              }
                            }}
                            className="bg-[#4f6ef7] hover:bg-[#6c83f8] text-white text-xs font-black px-5 py-2.5 rounded-xl transition shadow-sm cursor-pointer"
                          >
                            Live schalten
                          </button>
                        </div>
                      </div>

                      {/* Config presets for the broadcast */}
                      <div className={`p-5 rounded-3xl border ${darkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-[#f8f9fc] border-[#e2e5f1]'}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#4f6ef7] mb-2">Tägliche Geschenk-Münzen regulieren</h4>
                        <p className={`text-[11px] leading-relaxed mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Bestimme, mit wie vielen Gratis-Münzen die angemeldeten Benutzer an ihrem täglichen Refill-Zyklus belohnt werden.</p>
                        
                        <div className="flex gap-2">
                          <input 
                            type="number"
                            value={adminDailyGift}
                            onChange={(e) => setAdminDailyGift(Math.max(1, Number(e.target.value)))}
                            className={`px-3 py-2 text-xs rounded-xl border focus:outline-none w-28 font-black ${darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-800'}`}
                          />
                          <button
                            onClick={() => {
                              localStorage.setItem('aleksai_daily_gift_amount', String(adminDailyGift));
                              setAdminLogs(prev => [
                                ...prev,
                                `[${new Date().toLocaleTimeString()}] Geschenk-Münzen-Frequenz geändert auf: ${adminDailyGift} Credits.`
                              ]);
                              triggerToast(`Tägliche Gratisaufladung auf +${adminDailyGift} Münzen gesetzt! 🎁`);
                            }}
                            className="bg-[#4f6ef7] hover:bg-[#6c83f8] text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer"
                          >
                            Speichern
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Right column Preview */}
                    <div className="lg:col-span-5 space-y-4 text-left">
                      <div className={`p-5 rounded-3xl border h-full ${darkMode ? 'bg-slate-950/20 border-slate-800' : 'bg-stone-50 border-stone-200'}`}>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-3">Live-Vorschau der Anzeige</h4>
                        
                        {adminBroadcast ? (
                          <div className="border rounded-2xl p-4 bg-slate-950 text-white text-xs font-bold text-center flex flex-col items-center justify-center gap-3 shadow-inner">
                            <div className="w-full bg-gradient-to-r from-[#d946ef] via-[#8b5cf6] to-[#3b82f6] text-white text-[10px] py-1.5 px-3 font-semibold rounded-lg flex items-center justify-center gap-1">
                              <span className="w-2 h-2 bg-[#22c55e] rounded-full shrink-0 animate-ping"></span>
                              <span className="font-extrabold">MITTEILUNG:</span>
                              <span className="truncate max-w-[200px]">{adminBroadcast}</span>
                            </div>
                            <p className="text-[9px] text-slate-500 font-medium">Diese Zeile heftet sich sofort über alle anderen Layout-Ebenen der App!</p>
                          </div>
                        ) : (
                          <div className="text-center py-12 text-xs opacity-50 dark:text-slate-300 font-bold border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                            Keine aktive Rundnachricht geschaltet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 5: LOG SYSTEM */}
                {adminActiveTab === 'logs' && (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                        <span className="font-mono text-[10px] text-zinc-400 font-extrabold uppercase tracking-wide">Protokoll-Einträge: {adminLogs.length} Zeilen</span>
                      </div>
                      
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setAdminLogs([
                              `[${new Date().toLocaleTimeString()}] Protokoll manuell zurückgesetzt durch Admin.`,
                              `[${new Date().toLocaleTimeString()}] Systemstatus: Bereit.`,
                              `[${new Date().toLocaleTimeString()}] Firebase Auth verbunden (aleks.smolovic@web.de)`
                            ]);
                            triggerToast('Systemprotokolle gelöscht!');
                          }}
                          className="bg-red-950/40 hover:bg-red-900/40 text-red-400 text-[10px] border border-red-800/20 px-3 py-1.5 rounded-lg cursor-pointer font-bold duration-150"
                        >
                          Logs leeren
                        </button>

                        <button
                          onClick={() => {
                            const blob = new Blob([adminLogs.join('\n')], { type: 'text/plain' });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = `aleksai_debug_report_${Date.now()}.txt`;
                            link.click();
                            triggerToast('Debug-Report generiert & heruntergeladen!');
                          }}
                          className="bg-slate-800 hover:bg-slate-750 text-slate-200 text-[10px] border border-slate-700 px-3 py-1.5 rounded-lg cursor-pointer font-bold duration-150"
                        >
                          Report exportieren
                        </button>
                      </div>
                    </div>

                    {/* Developer Terminal Box */}
                    <div className="rounded-2xl bg-black border border-slate-850 p-5 font-mono text-xs text-[#22c55e] space-y-1.5 shadow-2xl">
                      <div className="flex justify-between items-center pb-2.5 border-b border-slate-900 text-[9px] text-slate-500 uppercase font-black tracking-widest">
                        <span>🚀 SECURE ADMIN INSTANCE LOGCONSOLE</span>
                        <span className="text-zinc-500">{new Date().toLocaleDateString('de-DE')}</span>
                      </div>
                      <div className="max-h-[350px] min-h-[250px] overflow-y-auto space-y-1 pr-1 scrollbar-thin select-all text-left font-mono">
                        {adminLogs.map((log, lIdx) => {
                          const isError = log.includes('Fehler') || log.includes('DEAKTIVIERT');
                          const isUpdate = log.includes('Credits') || log.includes('BEFEHL');
                          return (
                            <div 
                              key={lIdx} 
                              className={`leading-relaxed break-all font-mono opacity-90 text-[10.5px] ${isError ? 'text-red-450 dark:text-red-400' : isUpdate ? 'text-blue-450 dark:text-blue-400' : 'text-emerald-400'}`}
                            >
                              <span className="text-slate-550 mr-1.5">›</span>{log}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* FOOTER ACTIONS */}
              <div className={`p-4.5 border-t flex justify-end shrink-0 gap-2 items-center ${darkMode ? 'bg-slate-950 border-slate-850' : 'bg-stone-55 border-stone-200'}`}>
                <span className="mr-auto text-[9px] font-mono text-slate-400 font-extrabold uppercase">
                  ALEKS EXECUTIVE MANAGEMENT PANEL · SYSTEM: {MODEL_DETAILS[activeModel].name} ONLINE
                </span>
                <button
                  onClick={() => setShowAdminModal(false)}
                  className="bg-gradient-to-r from-teal-600 to-indigo-600 hover:opacity-90 text-white text-xs font-black px-6 py-2.5 rounded-xl transition shadow-md leading-none cursor-pointer"
                >
                  Dashboard Schließen
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* 🔮 SLICK FLOATING SIDEPANEL TRIGGER BUTTON */}
      {!sidebarActive && (
        <button
          onClick={toggleSidebar}
          className={`fixed top-1/2 left-3 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center border z-50 cursor-pointer shadow-lg transition-all duration-300 hover:scale-110 ${
            darkMode 
              ? 'bg-slate-900/95 border-slate-800 text-violet-400 hover:text-violet-300 shadow-[0_0_15px_rgba(139,92,246,0.25)]' 
              : 'bg-white/95 border-slate-200 text-[#4f6ef7] hover:text-blue-600 shadow-md'
          }`}
          title={language === 'de' ? 'Menü öffnen' : 'Open Menu'}
        >
          {currentUser ? (
            <MoreHorizontal className="w-5 h-5 animate-pulse" />
          ) : (
            <Lock className="w-4 h-4 text-amber-500 animate-bounce" />
          )}
        </button>
      )}

      {/* ── COOKIE CONSENT BANNER ── */}
      {showCookieBanner && (
        <div className={`fixed bottom-4 right-4 max-w-md w-[calc(100%-2rem)] z-55 rounded-3xl p-5 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border transition-all duration-300 animate-slide-in ${
          darkMode ? 'bg-slate-900/95 backdrop-blur-md border-slate-800 text-white shadow-[0_15px_30px_rgba(0,0,0,0.6)]' : 'bg-white/95 backdrop-blur-md border-slate-200 text-slate-900'
        }`}>
          <div className="flex items-center gap-2 mb-2.5">
            <span className="text-xl">🍪</span>
            <h4 className="text-sm font-black tracking-tight">
              {language === 'de' ? 'Cookie- & Datenschutzeinstellungen' : 'Cookie & Privacy Preference'}
            </h4>
          </div>
          
          <p className="text-xs leading-relaxed opacity-85 mb-4 text-left">
            {language === 'de' 
              ? 'Wir nutzen Cookies und lokale Speichergeräte, um dein Benutzerkonto und deine Token-Käufe im Shop abzusichern, Präferenzen zu speichern und unsere Chatting-Dienste zu verbessern.'
              : 'We use cookies and local storage to secure your user account, save visual preferences, authorize shop purchases, and improve our intelligent chatting services.'}
          </p>

          {showCookieSettings ? (
            <div className={`space-y-3 p-3.5 rounded-2xl mb-4 border text-[11px] ${darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-55 border-slate-150'}`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="font-extrabold">{language === 'de' ? 'Notwendige Cookies (Aktiv)' : 'Strictly Necessary (Always Active)'}</p>
                  <p className="opacity-75 text-[10px]">{language === 'de' ? 'Für Benutzerkonto, SMTP-Codes, Sprache & Design.' : 'For user credentials, SMTP code flows, and visual settings.'}</p>
                </div>
                <input type="checkbox" checked disabled className="accent-blue-500 h-4 w-4" />
              </div>
              <div className="flex items-center justify-between border-t pt-2.5 border-slate-200/50 dark:border-slate-800/50">
                <div className="text-left">
                  <p className="font-extrabold">{language === 'de' ? 'Analyse & Shop-Sicherheit' : 'Analytics & Shop Security'}</p>
                  <p className="opacity-75 text-[10px]">{language === 'de' ? 'Sichert Einkäufe und anonyme Feedbackstatistiken.' : 'Ensures secure checkout logs and anonymous performance tracking.'}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cookieSettings.analytics} 
                  onChange={(e) => setCookieSettings({ ...cookieSettings, analytics: e.target.checked })}
                  className="accent-blue-500 h-4 w-4 cursor-pointer" 
                />
              </div>
              <div className="flex items-center justify-between border-t pt-2.5 border-slate-200/50 dark:border-slate-800/50">
                <div className="text-left">
                  <p className="font-extrabold">{language === 'de' ? 'Marketing & Personalisierung' : 'Marketing & Personalization'}</p>
                  <p className="opacity-75 text-[10px]">{language === 'de' ? 'Für exklusive Design-Vorschläge & Kampagnen.' : 'For seasonal theme updates & platform promotions.'}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={cookieSettings.marketing} 
                  onChange={(e) => setCookieSettings({ ...cookieSettings, marketing: e.target.checked })}
                  className="accent-blue-500 h-4 w-4 cursor-pointer" 
                />
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-2.5 text-[10px] mb-4">
            <button 
              onClick={() => { setShowLegalModal('privacy'); }}
              className="text-[#4f6ef7] dark:text-blue-400 hover:underline font-bold cursor-pointer"
            >
              {language === 'de' ? 'Datenschutzerklärung lesen' : 'View Privacy Policy'}
            </button>
            <button 
              onClick={() => setShowCookieSettings(!showCookieSettings)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-bold cursor-pointer"
            >
              {showCookieSettings ? (language === 'de' ? 'Ausblenden' : 'Hide settings') : (language === 'de' ? 'Anpassen...' : 'Customize...')}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                const finalSettings = { necessary: true, analytics: false, marketing: false };
                setCookieSettings(finalSettings);
                localStorage.setItem('aleksai_cookie_consent', JSON.stringify(finalSettings));
                setShowCookieBanner(false);
                triggerToast(language === 'de' ? 'Nur notwendige Cookies gespeichert!' : 'Only necessary cookies saved!');
              }}
              className={`py-2 rounded-xl text-[11px] font-black uppercase tracking-wider border cursor-pointer transition ${
                darkMode ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 text-white' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
              }`}
            >
              {language === 'de' ? 'Nur Notwendige' : 'Essential Only'}
            </button>
            <button
              onClick={() => {
                const finalSettings = showCookieSettings 
                  ? cookieSettings 
                  : { necessary: true, analytics: true, marketing: true };
                setCookieSettings(finalSettings);
                localStorage.setItem('aleksai_cookie_consent', JSON.stringify(finalSettings));
                setShowCookieBanner(false);
                triggerToast(language === 'de' ? 'Cookie-Einstellungen erfolgreich gespeichert!' : 'Cookie preferences saved successfully!');
              }}
              className="py-2 rounded-xl text-[11px] font-black uppercase tracking-wider bg-[#4f6ef7] hover:bg-[#6c83f8] text-white cursor-pointer transition shadow-md"
            >
              {language === 'de' ? 'Zustimmen & Schließen' : 'Accept All'}
            </button>
          </div>
        </div>
      )}

      {/* ── LEGAL DOCUMENTS MODAL (PRIVACY / TERMS / COOKIE POLICY) ── */}
      {showLegalModal && (
        <div className="fixed inset-0 bg-black/70 z-55 flex items-center justify-center p-3 sm:p-4">
          <div className={`rounded-3xl w-full max-w-2xl max-h-[85vh] flex flex-col p-5 sm:p-6 relative shadow-2xl animate-zoom-in border transition-all ${
            darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-950'
          }`}>
            <button 
              onClick={() => setShowLegalModal(null)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full bg-[#f4f4f7] dark:bg-slate-800 hover:bg-[#e2e5f1] dark:hover:bg-slate-750 transition flex items-center justify-center text-sm font-bold text-stone-500 hover:text-red-500 cursor-pointer z-10"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-4 shrink-0 text-left">
              <span className="text-2xl">
                {showLegalModal === 'privacy' ? '🛡️' : showLegalModal === 'terms' ? '📜' : '🍪'}
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  {showLegalModal === 'privacy' && (language === 'de' ? 'Datenschutzerklärung' : 'Privacy Policy')}
                  {showLegalModal === 'terms' && (language === 'de' ? 'Einkaufsbedingungen & Shop-Richtlinien' : 'Purchase Terms & Shop Policy')}
                  {showLegalModal === 'cookies' && (language === 'de' ? 'Cookie-Richtlinie' : 'Cookie Policy')}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  AlerksAI Compliance Platform • {new Date().toLocaleDateString(language === 'de' ? 'de-DE' : 'en-US')}
                </p>
              </div>
            </div>

            {/* Scrollable text box */}
            <div className={`flex-1 overflow-y-auto pr-2 text-xs leading-relaxed text-left space-y-4 pb-4 border-b border-t py-3 scrollbar-thin ${
              darkMode ? 'text-slate-300 border-slate-850' : 'text-slate-700 border-slate-100'
            }`}>
              {showLegalModal === 'privacy' && (
                <>
                  <p>
                    {language === 'de'
                      ? 'Der Schutz deiner persönlichen Daten ist uns ein wichtiges Anliegen. In dieser Datenschutzerklärung informieren wir dich darüber, wie deine Daten verarbeitet werden, insbesondere im Hinblick auf dein Benutzerkonto, deine Chats und Einkäufe.'
                      : 'Protecting your personal data is a top priority. This Privacy Policy informs you about how your data is processed, specifically regarding your credentials, chat sessions, and credit purchases.'}
                  </p>
                  
                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">1. Erhebung und Speicherung personenbezogener Daten</h4>
                    <p>
                      {language === 'de'
                        ? '• Benutzerkonto: Bei der Registrierung erfassen wir deine E-Mail-Adresse und dein verschlüsseltes Passwort. Diese Daten dienen ausschließlich deiner Authentifizierung und der Synchronisation deiner Token-Credits.'
                        : '• User Account: Upon registration, we collect your email address and your encrypted password. This data is exclusively used for authentication and syncing your token credits.'}
                    </p>
                    <p>
                      {language === 'de'
                        ? '• Chats & Interaktionen: Deine eingegebenen Prompts und die generierten Antworten werden lokal in deinem Browser (LocalStorage) und verschlüsselt in unserer sicheren Datenbank gesichert, damit du deine Chatverläufe auf verschiedenen Geräten nutzen kannst.'
                        : '• Chats & Interactions: Your prompt inputs and generated replies are secured locally in your browser (LocalStorage) and encrypted inside our database to enable cross-device synchronization.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">2. Kredit-Käufe und Zahlungsdaten</h4>
                    <p>
                      {language === 'de'
                        ? 'Wenn du im Credit Shop Token-Pakete erwirbst, nutzen wir hochsichere Zahlungsanbieter (z. B. Stripe). AlerksAI speichert zu keinem Zeitpunkt deine Bankdaten oder Kreditkartennummern auf eigenen Servern. Wir protokollieren lediglich den Status des Kaufs (Erfolgreich/Fehlgeschlagen) und die Anzahl der gutgeschriebenen Tokens.'
                        : 'When purchasing token packages in our Credit Shop, we route through highly secure payment gateways (e.g. Stripe). AlerksAI never saves your banking accounts or credit card numbers on our servers. We only log transaction states (Success/Failed) and credited token amounts.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">3. Einbindung von AI-Modellen (Dritte)</h4>
                    <p>
                      {language === 'de'
                        ? 'Deine Chat-Nachrichten werden verschlüsselt an die API-Schnittstellen unserer Model-Anbieter (OpenAI, Anthropic, Google) übermittelt, um die Antworten zu generieren. Hierbei werden keinerlei persönliche Benutzerdaten (wie E-Mail-Adresse, IP-Adresse oder Namen) an diese Dritten weitergegeben.'
                        : 'Your chat content is encrypted and proxy-forwarded to our model providers (OpenAI, Anthropic, Google) to generate responses. Absolutely no personal identifiers (such as email, IP, or username) are ever sent to these third parties.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">4. Deine Rechte</h4>
                    <p>
                      {language === 'de'
                        ? 'Du hast das Recht auf Auskunft, Berichtigung oder vollständige Löschung deines Benutzerkontos und der damit verbundenen Daten. Du kannst deine Daten jederzeit löschen, indem du in deinen Profileinstellungen auf "Konto löschen" klickst, oder uns direkt kontaktierst.'
                        : 'You have the right to request access, correction, or permanent deletion of your user account. You can trigger deletion at any time in your profile settings via "Delete Account", or by contacting us.'}
                    </p>
                  </div>
                </>
              )}

              {showLegalModal === 'terms' && (
                <>
                  <p>
                    {language === 'de'
                      ? 'Diese Einkaufsbedingungen regeln die Geschäftsbeziehung zwischen dir und AlerksAI bezüglich des Erwerbs von virtuellen Credits (Tokens) und VIP-Mitgliedschaften.'
                      : 'These Purchase Terms govern the commercial relationship between you and AlerksAI regarding the acquisition of virtual credits (Tokens) and VIP subscriptions.'}
                  </p>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">1. Vertragsgegenstand</h4>
                    <p>
                      {language === 'de'
                        ? 'Der Shop bietet virtuelle Credits ("Tokens") und monatliche Abonnements an. Tokens können eingesetzt werden, um rechenintensive AI-Modelle (wie GPT-4, Claude 3.5, DeepSeek-R1) im Chat zu nutzen. Tokens haben keinen materiellen Gegenwert, sind nicht übertragbar und können nicht in Bargeld ausgezahlt werden.'
                        : 'Our Shop offers virtual credits ("Tokens") and monthly subscriptions. Tokens are consumed to execute queries on compute-heavy AI models (like GPT-4, Claude 3.5, DeepSeek-R1). Tokens have no physical value, are non-transferable, and cannot be redeemed for cash.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">2. Sofortige Bereitstellung & Verzicht auf das Widerrufsrecht</h4>
                    <p>
                      {language === 'de'
                        ? 'Beim Kauf eines Token-Pakets stimmst du ausdrücklich zu, dass der Kauf sofort abgeschlossen und das Token-Guthaben deinem Benutzerkonto gutgeschrieben wird. Du stimmst zu, dass dein 14-tägiges Widerrufsrecht vorzeitig erlischt, sobald die Bereitstellung der digitalen Inhalte begonnen hat und der erste Token verbraucht wurde.'
                        : 'By purchasing a token bundle, you explicitly agree that delivery of the digital content starts immediately. You acknowledge and agree that your 14-day cooling-off/right of withdrawal expires prematurely once execution has begun (i.e., as soon as the first token is consumed).'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">3. Ablauf von Guthaben & Benutzerkonten</h4>
                    <p>
                      {language === 'de'
                        ? 'Erworbene Tokens verfallen nicht, solange dein Benutzerkonto aktiv bleibt. Solltest du dich entscheiden, dein Benutzerkonto dauerhaft zu löschen, verfallen alle verbleibenden Tokens ersatzlos. Es besteht kein Anspruch auf Rückerstattung verbleibender Guthaben.'
                        : 'Acquired tokens do not expire as long as your account remains active. If you permanently delete your credentials, all unused credits are lost. There are no refunds for leftover active credit balances.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">4. Preise und sichere Abwicklung</h4>
                    <p>
                      {language === 'de'
                        ? 'Alle Preise sind Endpreise. Der Zahlungsvorgang wird vollständig verschlüsselt über Stripe abgewickelt, um maximalen Schutz zu garantieren. Ein Kauf ist erst abgeschlossen, wenn die Zahlungsbestätigung vom Provider verarbeitet wurde.'
                        : 'All prices are final. Payments are fully encrypted and securely authorized via Stripe. A transaction is considered complete only after confirmation from the secure payment provider.'}
                    </p>
                  </div>
                </>
              )}

              {showLegalModal === 'cookies' && (
                <>
                  <p>
                    {language === 'de'
                      ? 'Hier erfährst du im Detail, welche Cookies und Speichertechnologien AlerksAI einsetzt, um dir eine reibungslose Benutzererfahrung zu gewährleisten.'
                      : 'This section details the cookies and storage technologies used by AlerksAI to ensure a smooth, stable, and persistent web application.'}
                  </p>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">1. Was sind Cookies & LocalStorage?</h4>
                    <p>
                      {language === 'de'
                        ? 'Cookies sind kleine Textdateien, die auf deinem Computer abgelegt werden. LocalStorage ermöglicht es uns, größere Mengen an Daten (wie Chatverläufe und Einstellungen) dauerhaft direkt in deinem Browser zu sichern, ohne die Servergeschwindigkeit zu beeinträchtigen.'
                        : 'Cookies are small text strings saved on your computer. LocalStorage allows us to safely store larger volumes of state data (like chat histories and configurations) directly inside your browser for rapid response times.'}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">2. Erstaussteller-Schlüssel (Eingesetzte Schlüssel)</h4>
                    <p>
                      {language === 'de'
                        ? 'Wir verwenden folgende Erstaussteller-Schlüssel:'
                        : 'We utilize the following first-party keys:'}
                    </p>
                    <ul className="list-disc list-inside pl-2 space-y-1">
                      <li>
                        <strong>`aleksai_dark_mode`</strong>:{' '}
                        {language === 'de' ? 'Speichert deine Theme-Auswahl (Hell oder Dunkel).' : 'Saves your active color mode preference (Dark/Light).'}
                      </li>
                      <li>
                        <strong>`aleksai_language`</strong>:{' '}
                        {language === 'de' ? 'Speichert deine Sprachauswahl (Deutsch oder Englisch).' : 'Saves your active language preference (German/English).'}
                      </li>
                      <li>
                        <strong>`aleksai_cookie_consent`</strong>:{' '}
                        {language === 'de' ? 'Speichert deine in diesem Banner getroffene Cookie-Entscheidung.' : 'Saves the consent choices you made on this banner.'}
                      </li>
                      <li>
                        <strong>`aleks_ai_sessions`</strong>:{' '}
                        {language === 'de' ? 'Sichert deine aktuellen Chat-Sitzungen lokal zur sofortigen Wiederherstellung.' : 'Secures active chat sequences locally for instantaneous recovery.'}
                      </li>
                    </ul>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-sm text-[#4f6ef7] dark:text-blue-400">3. Drittanbieter-Technologien</h4>
                    <p>
                      {language === 'de'
                        ? 'Für die Sicherheit von Benutzerkonto und Kreditshop bettet Firebase Auth und Stripe funktionale Cookie-Elemente ein, die ausschließlich der Missbrauchserkennung und sicheren Authentifizierung dienen. Es werden keine Werbe- oder Trackingnetzwerke geladen.'
                        : 'For checkout stability and credentials protection, Firebase Auth and Stripe embed functional cookie widgets solely for security screening and verification. Absolutely no commercial advertisement trackers are loaded.'}
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="mt-4 flex justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-450 font-bold">AlerksAI Compliance Platform</span>
              <button
                onClick={() => setShowLegalModal(null)}
                className="px-5 py-2.5 bg-[#4f6ef7] hover:bg-[#6c83f8] text-white font-black text-xs rounded-xl transition cursor-pointer shadow-sm"
              >
                {language === 'de' ? 'Schließen' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUCCESS / ERROR APP TOAST POPUP ── */}
      {showToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 text-white px-5 py-3 rounded-2xl text-xs md:text-sm font-bold z-55 shadow-2xl flex items-center gap-2 animate-[pulse_1.5s_infinite]">
          <span>💬</span> {toastMessage}
        </div>
      )}
    </div>
  );

  const renderWithDeviceFrame = () => {
    if (deviceSize === 'auto') {
      return (
        <div className={darkMode ? 'dark' : ''}>
          {renderedApp}
        </div>
      );
    }

    const deviceConfig = {
      iPhone: {
        containerClass: "max-w-[390px] rounded-[52px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border-[12px] border-slate-900 bg-white dark:bg-slate-950 aspect-[9/19.5]",
        label: "iPhone (Mobil)",
        notch: true,
      },
      iPad: {
        containerClass: "max-w-[760px] rounded-[36px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border-[14px] border-slate-900 bg-white dark:bg-slate-950 aspect-[4/3]",
        label: "iPad (Tablet)",
        notch: false,
      },
      PC: {
        containerClass: "max-w-[1140px] rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.4)] border-4 border-slate-800 bg-white dark:bg-slate-950 aspect-[16/10]",
        label: "PC (Widescreen)",
        notch: false,
      }
    }[deviceSize];

    return (
      <div className={`min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-5 md:p-8 transition-colors duration-300 ${darkMode ? 'dark bg-[#0a0d16]' : 'bg-slate-100'}`}>
        {/* Quick controls on top of the device mockup */}
        <div className="mb-4 flex items-center justify-between w-full max-w-md bg-white/80 dark:bg-slate-900/80 backdrop-blur px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm z-50">
          <div className="flex items-center gap-1.5">
            <AleksAILogo className="w-4 h-4 text-[#4f6ef7]" />
            <span className="text-[11px] font-bold dark:text-slate-200">{deviceConfig?.label}</span>
          </div>
          <button 
            onClick={() => setDeviceSize('auto')}
            className="text-[10px] font-bold text-[#4f6ef7] hover:underline cursor-pointer"
          >
            ➔ {t('automaticSize')}
          </button>
        </div>

        {/* Device frame container */}
        <div className={`w-full relative overflow-hidden flex flex-col ${deviceConfig?.containerClass}`}>
          {deviceConfig?.notch && (
            <div className="absolute top-0 inset-x-0 h-6 bg-slate-900 text-white flex items-center justify-between px-6 text-[9px] font-bold z-50 select-none">
              <span>09:41</span>
              {/* Camera Island */}
              <div className="w-24 h-4 bg-slate-900 rounded-b-xl mx-auto absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center gap-1.5">
                <div className="w-1.5 h-1.5 bg-slate-800 rounded-full"></div>
                <div className="w-4 h-1 bg-slate-800 rounded-full"></div>
              </div>
              <div className="flex items-center gap-1">
                <span>📶</span>
                <span>🔋</span>
              </div>
            </div>
          )}
          <div className={`flex-1 relative flex flex-col overflow-hidden ${deviceConfig?.notch ? 'pt-6' : ''}`}>
            {renderedApp}
          </div>
        </div>
      </div>
    );
  };

  return renderWithDeviceFrame();
}

// Collapsible helper module for reasoning thought processes (DeepSeek R1)
function CollapsibleThought({ content }: { content: string }) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="border-l-2 border-slate-300 bg-slate-50/75 rounded-lg p-3.5 my-2.5 text-xs text-slate-500 shadow-sm">
      <button 
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full font-bold text-slate-600 gap-1 select-none cursor-pointer outline-none"
      >
        <span className="flex items-center gap-1.5">🐳 DeepSeek-R1 Denkprozess {expanded ? '(aktiv)' : '(eingeklappt)'}</span>
        <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
      </button>
      {expanded && (
        <div className="mt-2.5 whitespace-pre-wrap leading-relaxed border-t border-slate-200/55 pt-2.5 font-mono text-[11px] text-[#4a4e6a]">
          {content}
        </div>
      )}
    </div>
  );
}

// Custom SVG based on the uploaded AleksAI logo (beautiful sparkles with circular dot)
function AleksAILogo({ className = "w-6 h-6", glow = false }: { className?: string, glow?: boolean }) {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${glow ? 'drop-shadow-[0_0_12px_rgba(99,102,241,0.65)]' : ''}`}>
      <svg 
        className={className} 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Upper right tiny sparkle */}
        <path 
          d="M380 110 C380 138, 395 148, 435 155 C395 162, 380 172, 380 200 C380 172, 365 162, 325 155 C365 148, 380 138, 380 110 Z" 
          fill="currentColor" 
        />
        {/* Main large sparkle with curved starburst flare contours */}
        <path 
          d="M256 80 C256 182, 303 216, 422 256 C303 296, 256 330, 256 432 C256 330, 209 296, 90 256 C209 216, 256 182, 256 80 Z" 
          stroke="currentColor" 
          strokeWidth="36" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          fill="none"
        />
        {/* Bottom left tiny solid circle */}
        <circle cx="150" cy="362" r="28" fill="currentColor" />
      </svg>
    </div>
  );
}

// Customized logo component for each specific model using the custom design shapes
export function ModelLogo({ model, className = "w-5 h-5", glow = false, color }: { model: AIModel, className?: string, glow?: boolean, color?: string }) {
  let colorClass = color || "text-[#4f6ef7]"; // Default
  if (!color) {
    if (model === AIModel.GEMINI) {
      colorClass = "text-blue-500";
    } else if (model === AIModel.LLAMA_SCOUT) {
      colorClass = "text-purple-500";
    } else if (model === AIModel.OPENAI) {
      colorClass = "text-emerald-500";
    } else if (model === AIModel.DEEPSEEK) {
      colorClass = "text-cyan-500";
    } else if (model === AIModel.CLAUDE) {
      colorClass = "text-orange-500";
    } else if (model === AIModel.LLAMA_ULTRA) {
      colorClass = "text-pink-500";
    } else if (model === AIModel.NANO_BANANA) {
      colorClass = "text-amber-500";
    }
  }

  return (
    <AleksAILogo className={`${className} ${colorClass}`} glow={glow} />
  );
}

// Emulates a high-speed character-by-character typewriter animation for incoming AI replies (ChatGPT style)
export function TypewriterParagraph({ content, isLatest, darkMode, idx }: { key?: any; content: string; isLatest: boolean; darkMode: boolean; idx: number }) {
  const [displayedText, setDisplayedText] = useState(isLatest ? "" : content);

  useEffect(() => {
    if (!isLatest) {
      setDisplayedText(content);
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      i += 3; // Rapid 3-char increments for snappy responsive feel
      if (i >= content.length) {
        setDisplayedText(content);
        clearInterval(timer);
      } else {
        setDisplayedText(content.slice(0, i));
      }
    }, 12);

    return () => clearInterval(timer);
  }, [content, isLatest]);

  const parts = displayedText.split(/(\*\*.*?\*\*)/g);
  const formattedInline = parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className={`font-bold ${darkMode ? 'text-white' : 'text-[#0d0f1a]'}`}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });

  return (
    <p key={idx} className={`text-[15px] leading-relaxed whitespace-pre-wrap ${darkMode ? 'text-slate-100' : 'text-[#0d0f1a]'}`}>
      {formattedInline}
      {isLatest && displayedText.length < content.length && (
        <span className="inline-block w-1.5 h-4 bg-blue-500 animate-pulse ml-1 align-middle">|</span>
      )}
    </p>
  );
}
