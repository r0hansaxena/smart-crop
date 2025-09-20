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
      case 'calendar':
        return <CropCalendar profile={farmerProfile} setView={setCurrentView} />;
      case 'market':
        return <MarketPlace profile={farmerProfile} setView={setCurrentView} />;
      case 'recommendations':
        return <CropRecommendations profile={farmerProfile} setView={setCurrentView} />;
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

          <div className="feature-card" onClick={() => setView('calendar')}>
            <div className="feature-icon">📅</div>
            <h3>Smart Calendar</h3>
            <p>AI-driven crop planning & optimal timing</p>
          </div>

          <div className="feature-card" onClick={() => setView('market')}>
            <div className="feature-icon">💰</div>
            <h3>Market Prices</h3>
            <p>Live mandi rates & selling opportunities</p>
          </div>

          <div className="feature-card" onClick={() => setView('recommendations')}>
            <div className="feature-icon">🎯</div>
            <h3>Crop Suggestions</h3>
            <p>AI recommendations for maximum profit</p>
          </div>

          <div className="feature-card" onClick={() => setView('pest')}>
            <div className="feature-icon">🔍</div>
            <h3>Pest Detection</h3>
            <p>Upload crop images for pest analysis</p>
          </div>

          <div className="feature-card" onClick={() => setView('history')}>
            <div className="feature-icon">📚</div>
            <h3>Advice History</h3>
            <p>View your previous consultations</p>
          </div>
        </div>
      </div>

      <div className="bottom-nav">
        <div className="nav-item active">
          <span>🏠</span>
          <span>Home</span>
        </div>
        <div className="nav-item" onClick={() => setView('calendar')}>
          <span>📅</span>
          <span>Calendar</span>
        </div>
        <div className="nav-item" onClick={() => setView('market')}>
          <span>💰</span>
          <span>Market</span>
        </div>
        <div className="nav-item" onClick={() => setView('chat')}>
          <span>💬</span>
          <span>Chat</span>
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
              <option value="Small (less than 2 acres)">Small (less than 2 acres)</option>
              <option value="Medium (2-10 acres)">Medium (2-10 acres)</option>
              <option value="Large (more than 10 acres)">Large (more than 10 acres)</option>
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

// Smart Crop Calendar Component
const CropCalendar = ({ profile, setView }) => {
  const [calendar, setCalendar] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');

  const crops = ['Rice', 'Wheat', 'Corn', 'Cotton', 'Sugarcane', 'Mustard'];

  useEffect(() => {
    if (profile) {
      fetchCalendar();
    }
  }, [profile]);

  const fetchCalendar = async () => {
    if (!profile) return;
    
    try {
      const response = await axios.get(`${API}/crop-calendar/${profile.id}`);
      setCalendar(response.data);
    } catch (error) {
      console.error('Error fetching calendar:', error);
    }
  };

  const addCropToCalendar = async () => {
    if (!selectedCrop || !profile) return;
    
    setLoading(true);
    try {
      await axios.post(`${API}/crop-calendar?farmer_id=${profile.id}&crop_name=${selectedCrop}`);
      await fetchCalendar();
      setSelectedCrop('');
    } catch (error) {
      console.error('Error adding crop:', error);
      alert('Failed to add crop to calendar');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <button className="back-btn" onClick={() => setView('home')}>←</button>
        <h2>🌾 Smart Calendar</h2>
      </div>

      <div className="calendar-content">
        {profile && (
          <div className="add-crop-section">
            <h3>Add Crop to Calendar</h3>
            <div className="crop-selector">
              <select
                value={selectedCrop}
                onChange={(e) => setSelectedCrop(e.target.value)}
              >
                <option value="">Select crop</option>
                {crops.map(crop => (
                  <option key={crop} value={crop}>{crop}</option>
                ))}
              </select>
              <button 
                className="btn-primary"
                onClick={addCropToCalendar}
                disabled={!selectedCrop || loading}
              >
                {loading ? 'Adding...' : 'Add to Calendar'}
              </button>
            </div>
          </div>
        )}

        <div className="calendar-list">
          {calendar.length === 0 ? (
            <div className="empty-state">
              <p>No crops in calendar yet</p>
              {!profile && (
                <button className="btn-primary" onClick={() => setView('profile')}>
                  Create Profile First
                </button>
              )}
            </div>
          ) : (
            calendar.map((entry, index) => (
              <div key={index} className="calendar-card">
                <div className="calendar-header">
                  <h3>{entry.crop_name}</h3>
                  <span className={`risk-badge ${entry.weather_risk.toLowerCase()}`}>
                    {entry.weather_risk} Risk
                  </span>
                </div>
                
                <div className="calendar-details">
                  <div className="detail-row">
                    <span className="label">🌱 Sowing:</span>
                    <span>{formatDate(entry.sowing_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">🌾 Harvest:</span>
                    <span>{formatDate(entry.harvesting_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">💰 Best Selling:</span>
                    <span>{formatDate(entry.recommended_selling_date)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">📈 Expected Yield:</span>
                    <span>{entry.expected_yield} quintals/acre</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">💵 Est. Price:</span>
                    <span>₹{entry.estimated_price}/quintal</span>
                  </div>
                </div>

                <div className="market-score">
                  <span>Market Demand: </span>
                  <div className="score-bar">
                    <div 
                      className="score-fill"
                      style={{width: `${entry.market_demand_score * 100}%`}}
                    ></div>
                  </div>
                  <span>{Math.round(entry.market_demand_score * 100)}%</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Market Place Component
const MarketPlace = ({ profile, setView }) => {
  const [marketPrices, setMarketPrices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prices');

  useEffect(() => {
    fetchMarketData();
    if (profile) {
      fetchAlerts();
    }
  }, [profile]);

  const fetchMarketData = async () => {
    try {
      const response = await axios.get(`${API}/market-prices`);
      setMarketPrices(response.data);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlerts = async () => {
    if (!profile) return;
    
    try {
      const response = await axios.get(`${API}/market-alerts/${profile.id}`);
      setAlerts(response.data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getDemandColor = (demand) => {
    switch(demand) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      default: return '#757575';
    }
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <button className="back-btn" onClick={() => setView('home')}>←</button>
        <h2>💰 Market Place</h2>
      </div>

      <div className="market-tabs">
        <button 
          className={`tab ${activeTab === 'prices' ? 'active' : ''}`}
          onClick={() => setActiveTab('prices')}
        >
          Market Prices
        </button>
        <button 
          className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          Alerts ({alerts.length})
        </button>
      </div>

      <div className="market-content">
        {activeTab === 'prices' && (
          <div className="prices-section">
            {loading ? (
              <div className="loading">Loading market data...</div>
            ) : (
              <div className="price-cards">
                {marketPrices.map((price, index) => (
                  <div key={index} className="price-card">
                    <div className="price-header">
                      <h3>{price.crop_name}</h3>
                      <span className="trend">{getTrendIcon(price.trend)}</span>
                    </div>
                    
                    <div className="price-details">
                      <div className="price-main">
                        <span className="price">₹{price.current_price}</span>
                        <span className="unit">/quintal</span>
                      </div>
                      
                      <div className="price-meta">
                        <div className="meta-item">
                          <span>📍 {price.mandi_name}</span>
                        </div>
                        <div className="meta-item">
                          <span style={{color: getDemandColor(price.demand_level)}}>
                            ⚡ {price.demand_level.toUpperCase()} demand
                          </span>
                        </div>
                        <div className="meta-item">
                          <span>🏆 Grade {price.quality_grade}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            {!profile ? (
              <div className="empty-state">
                <p>Create profile to get personalized alerts</p>
                <button className="btn-primary" onClick={() => setView('profile')}>
                  Create Profile
                </button>
              </div>
            ) : alerts.length === 0 ? (
              <div className="empty-state">
                <p>No alerts at the moment</p>
              </div>
            ) : (
              <div className="alerts-list">
                {alerts.map((alert, index) => (
                  <div key={index} className={`alert-card ${alert.priority}`}>
                    <div className="alert-header">
                      <span className={`alert-type ${alert.alert_type}`}>
                        {alert.alert_type === 'price_spike' ? '📈' : '⚡'}
                      </span>
                      <span className="alert-crop">{alert.crop_name}</span>
                      <span className={`priority-badge ${alert.priority}`}>
                        {alert.priority}
                      </span>
                    </div>
                    
                    <div className="alert-message">
                      {alert.message}
                    </div>
                    
                    <div className="alert-details">
                      <div className="detail">
                        <span>📍 {alert.mandi_name}</span>
                      </div>
                      <div className="detail">
                        <span>💰 ₹{alert.price_offered}/quintal</span>
                      </div>
                      <div className="detail">
                        <span>⏰ Valid until {new Date(alert.valid_until).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Crop Recommendations Component
const CropRecommendations = ({ profile, setView }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      fetchRecommendations();
    }
  }, [profile]);

  const fetchRecommendations = async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API}/crop-recommendations/${profile.id}`);
      setRecommendations(response.data.recommendations);
      setAiAnalysis(response.data.ai_analysis);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (score) => {
    if (score >= 0.8) return '#4CAF50';
    if (score >= 0.6) return '#FF9800';
    return '#757575';
  };

  return (
    <div className="mobile-container">
      <div className="header">
        <button className="back-btn" onClick={() => setView('home')}>←</button>
        <h2>🎯 Crop Recommendations</h2>
      </div>

      <div className="recommendations-content">
        {!profile ? (
          <div className="empty-state">
            <p>Create profile to get personalized recommendations</p>
            <button className="btn-primary" onClick={() => setView('profile')}>
              Create Profile
            </button>
          </div>
        ) : loading ? (
          <div className="loading">Analyzing optimal crops for you...</div>
        ) : (
          <>
            {aiAnalysis && (
              <div className="ai-analysis">
                <h3>🤖 AI Analysis</h3>
                <p>{aiAnalysis}</p>
              </div>
            )}
            
            <div className="recommendations-list">
              {recommendations.map((rec, index) => (
                <div key={index} className="recommendation-card">
                  <div className="rec-header">
                    <h3>{rec.crop_name}</h3>
                    <div className="confidence-score">
                      <span style={{color: getConfidenceColor(rec.confidence_score)}}>
                        {Math.round(rec.confidence_score * 100)}% match
                      </span>
                    </div>
                  </div>
                  
                  <div className="rec-profit">
                    <span className="profit-label">Expected Profit:</span>
                    <span className="profit-value">₹{rec.expected_profit_per_acre.toLocaleString()}/acre</span>
                  </div>
                  
                  <div className="rec-details">
                    <div className="detail-item">
                      <span className="label">📈 Market Demand:</span>
                      <span>{rec.market_demand_forecast}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">🌱 Sowing:</span>
                      <span>{rec.sowing_window}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">🌾 Harvest:</span>
                      <span>{rec.harvest_window}</span>
                    </div>
                  </div>
                  
                  <div className="rec-benefits">
                    <h4>✅ Benefits:</h4>
                    <ul>
                      {rec.key_benefits.map((benefit, idx) => (
                        <li key={idx}>{benefit}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="rec-risks">
                    <h4>⚠️ Risks:</h4>
                    <ul>
                      {rec.risks.map((risk, idx) => (
                        <li key={idx}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// ChatBot Component (existing)
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
          placeholder="Ask about crops, market, calendar..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        <button onClick={handleSend} disabled={loading || !inputText.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

// Pest Detection Component (existing)
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

// Advice History Component (existing)
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