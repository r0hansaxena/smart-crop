import React, { useState, useRef, useEffect } from "react";
import "./App.css";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Main App Component
function App() {
  const [currentView, setCurrentView] = useState('home');
  const [farmerProfile, setFarmerProfile] = useState(null);

  const renderView = () => {
    switch(currentView) {
      case 'profile':
        return <FarmerProfile setProfile={setFarmerProfile} setView={setCurrentView} />;
      case 'chat':
        return <ChatBot profile={farmerProfile} setView={setCurrentView} />;
      case 'pest':
        return <PestDetection profile={farmerProfile} setView={setCurrentView} />;
      case 'history':
        return <AdviceHistory setView={setCurrentView} />;
      default:
        return <Home setView={setCurrentView} profile={farmerProfile} />;
    }
  };

  return (
    <div className="app">
      {renderView()}
    </div>
  );
}

// Home Screen Component
const Home = ({ setView, profile }) => {
  return (
    <div className="mobile-container">
      <div className="header">
        <div className="header-content">
          <h1>🌾 Smart Crop Advisor</h1>
          <p>Your AI-powered farming companion</p>
        </div>
      </div>

      <div className="main-content">
        {!profile && (
          <div className="welcome-card">
            <h3>Welcome to Smart Crop Advisory!</h3>
            <p>Get started by creating your farmer profile</p>
            <button className="btn-primary" onClick={() => setView('profile')}>
              Create Profile
            </button>
          </div>
        )}

        <div className="feature-grid">
          <div className="feature-card" onClick={() => setView('chat')}>
            <div className="feature-icon">🤖</div>
            <h3>AI Crop Advisor</h3>
            <p>Get instant farming advice from our AI expert</p>
          </div>

          <div className="feature-card" onClick={() => setView('pest')}>
            <div className="feature-icon">🔍</div>
            <h3>Pest Detection</h3>
            <p>Upload crop images for pest and disease analysis</p>
          </div>

          <div className="feature-card" onClick={() => setView('history')}>
            <div className="feature-icon">📚</div>
            <h3>Advice History</h3>
            <p>View your previous consultations</p>
          </div>

          <div className="feature-card" onClick={() => setView('profile')}>
            <div className="feature-icon">👤</div>
            <h3>Profile</h3>
            <p>Manage your farming profile</p>
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-item active">
          <span>🏠</span>
          <span>Home</span>
        </div>
        <div className="nav-item" onClick={() => setView('chat')}>
          <span>💬</span>
          <span>Chat</span>
        </div>
        <div className="nav-item" onClick={() => setView('pest')}>
          <span>📸</span>
          <span>Detect</span>
        </div>
        <div className="nav-item" onClick={() => setView('history')}>
          <span>📋</span>
          <span>History</span>
        </div>
      </div>
    </div>
  );
};

// Farmer Profile Component
const FarmerProfile = ({ setProfile, setView }) => {
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    farm_size: '',
    primary_crops: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const profileData = {
        ...formData,
        primary_crops: formData.primary_crops.split(',').map(crop => crop.trim())
      };
      
      const response = await axios.post(`${API}/farmer-profile`, profileData);
      setProfile(response.data);
      alert('Profile created successfully!');
      setView('home');
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Failed to create profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <button className="back-btn" onClick={() => setView('home')}>←</button>
        <h2>Farmer Profile</h2>
      </div>

      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              required
            />
          </div>

          <div className="form-group">
            <label>Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="e.g., Punjab, India"
              required
            />
          </div>

          <div className="form-group">
            <label>Farm Size</label>
            <select
              value={formData.farm_size}
              onChange={(e) => setFormData({...formData, farm_size: e.target.value})}
              required
            >
              <option value="">Select farm size</option>
              <option value="Small (< 2 acres)">Small (< 2 acres)</option>
              <option value="Medium (2-10 acres)">Medium (2-10 acres)</option>
              <option value="Large (> 10 acres)">Large (> 10 acres)</option>
            </select>
          </div>

          <div className="form-group">
            <label>Primary Crops</label>
            <input
              type="text"
              value={formData.primary_crops}
              onChange={(e) => setFormData({...formData, primary_crops: e.target.value})}
              placeholder="e.g., Rice, Wheat, Corn (comma separated)"
              required
            />
          </div>

          <div className="form-group">
            <label>Phone (Optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              placeholder="+91 XXXXXXXXXX"
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};

// ChatBot Component
const ChatBot = ({ profile, setView }) => {
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I\'m your AI crop advisor. How can I help you today?' }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    setInputText('');
    setMessages(prev => [...prev, { type: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const requestData = {
        query: userMessage,
        crop_type: profile?.primary_crops?.[0] || null,
        location: profile?.location || null,
        language: 'English'
      };

      const response = await axios.post(`${API}/crop-advice`, requestData);
      setMessages(prev => [...prev, { type: 'bot', text: response.data.advice }]);
    } catch (error) {
      console.error('Error getting advice:', error);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container chat-container">
      <div className="header">
        <button className="back-btn" onClick={() => setView('home')}>←</button>
        <h2>AI Crop Advisor</h2>
      </div>

      <div className="chat-messages">
        {messages.map((message, index) => (
          <div key={index} className={`message ${message.type}`}>
            <div className="message-content">
              {message.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask about crops, pests, soil..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading || !inputText.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

// Pest Detection Component
const PestDetection = ({ profile, setView }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [cropType, setCropType] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target.result.split(',')[1];
        
        const requestData = {
          image_base64: base64,
          crop_type: cropType || profile?.primary_crops?.[0] || 'general crop'
        };

        const response = await axios.post(`${API}/pest-detection`, requestData);
        setResult(response.data);
      };
      reader.readAsDataURL(selectedImage);
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <button className="back-btn" onClick={() => setView('home')}>←</button>
        <h2>Pest Detection</h2>
      </div>

      <div className="pest-detection-content">
        <div className="upload-section">
          <input
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          
          {!imagePreview ? (
            <div 
              className="upload-placeholder"
              onClick={() => fileInputRef.current.click()}
            >
              <div className="upload-icon">📷</div>
              <p>Tap to upload crop image</p>
            </div>
          ) : (
            <div className="image-preview">
              <img src={imagePreview} alt="Selected crop" />
              <button 
                className="change-image-btn"
                onClick={() => fileInputRef.current.click()}
              >
                Change Image
              </button>
            </div>
          )}
        </div>

        <div className="form-group">
          <label>Crop Type (Optional)</label>
          <input
            type="text"
            value={cropType}
            onChange={(e) => setCropType(e.target.value)}
            placeholder="e.g., Tomato, Rice, Wheat"
          />
        </div>

        <button 
          className="btn-primary"
          onClick={handleAnalyze}
          disabled={!selectedImage || loading}
        >
          {loading ? 'Analyzing...' : 'Analyze Image'}
        </button>

        {result && (
          <div className="detection-result">
            <h3>Analysis Result</h3>
            <div className="result-content">
              <p><strong>Status:</strong> {result.detection_result}</p>
              <div className="recommendations">
                <h4>Recommendations:</h4>
                <p>{result.recommendations}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Advice History Component
const AdviceHistory = ({ setView }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get(`${API}/advice-history`);
      setHistory(response.data);
    } catch (error) {
      console.error('Error fetching history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <button className="back-btn" onClick={() => setView('home')}>←</button>
        <h2>Advice History</h2>
      </div>

      <div className="history-content">
        {loading ? (
          <div className="loading">Loading history...</div>
        ) : history.length === 0 ? (
          <div className="empty-state">
            <p>No advice history yet</p>
            <button className="btn-primary" onClick={() => setView('chat')}>
              Start Chatting
            </button>
          </div>
        ) : (
          <div className="history-list">
            {history.map((item, index) => (
              <div key={index} className="history-item">
                <div className="history-header">
                  <span className="history-date">{formatDate(item.timestamp)}</span>
                </div>
                <div className="history-query">
                  <strong>Q:</strong> {item.query}
                </div>
                <div className="history-advice">
                  <strong>A:</strong> {item.advice.substring(0, 200)}...
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;