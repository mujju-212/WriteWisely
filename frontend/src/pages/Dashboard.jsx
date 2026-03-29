import React, { useState, useRef, useEffect } from 'react';
import './Dashboard.css';

// ─── All view components defined OUTSIDE Dashboard to prevent remount/focus loss ───

function DashboardViewComp({ setCurrentTab }) {
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1.5rem'}}>
        <div className="db-card db-card-p">
          <p className="db-section-title">⚡ Recent Activity</p>
          <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
            {[{text:'Practice Exercise - Day 3',badge:'COMPLETED'},{text:'Completed Quiz 2',badge:'YESTERDAY'},{text:'Edited Document 5',badge:'MAR 24'}].map((item,i)=>(
              <div key={i} className="db-activity-row" style={{opacity:i===2?0.6:1}}>
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
                  <i className="fa-solid fa-circle-check" style={{color:'var(--primary)'}}></i>
                  <span style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-dark)'}}>{item.text}</span>
                </div>
                <span className="db-badge db-badge-muted">{item.badge}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="db-card db-card-p">
          <p className="db-section-title"><i className="fa-solid fa-chart-line" style={{color:'var(--primary)'}}></i> Weekly Performance</p>
          <div style={{height:120,position:'relative',borderLeft:'1px solid var(--border)',borderBottom:'1px solid var(--border)',marginBottom:'0.5rem'}}>
            <svg style={{position:'absolute',inset:0,width:'100%',height:'100%',padding:8}} viewBox="0 0 100 100" preserveAspectRatio="none">
              <polyline fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" points="0,90 33,60 66,30 100,50"/>
              <circle cx="33" cy="60" r="3" fill="var(--primary)"/>
              <circle cx="66" cy="30" r="3" fill="var(--primary)"/>
            </svg>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>
            <span>Day 1</span><span>Day 2</span><span>Day 3</span><span>Day 4</span>
          </div>
        </div>
      </div>
      <div>
        <p className="db-section-title">Learning Modules</p>
        <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
          {['Reduce Redundant Words','Learn Business Writing'].map((name,i)=>(
            <div key={i} className="db-card db-card-p" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'1rem',flex:1}}>
                <div style={{width:48,height:48,background:'#EEF2FF',borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--primary)',flexShrink:0}}>
                  <i className="fa-solid fa-book-open"></i>
                </div>
                <div style={{flex:1}}>
                  <p style={{fontWeight:700,color:'var(--text-dark)',marginBottom:'0.4rem'}}>{name}</p>
                  <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                    <div className="db-progress-track" style={{flex:1,height:8}}>
                      <div className="db-progress-fill" style={{width:i===0?'40%':'60%',height:'100%'}}></div>
                    </div>
                    <span style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)'}}>{i===0?'40%':'60%'}</span>
                  </div>
                </div>
              </div>
              <button className="db-btn-primary" onClick={()=>setCurrentTab('learning')}>Continue</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function LearningViewComp({ setCurrentTab, completedModules, handleOpenModule, handleStartQuiz, setShowLearningPath,
  practiceText, handlePracticeTextChange, handlePracticeKeyDown, textAlignment, setTextAlignment,
  isBold, setIsBold, isItalic, setIsItalic, isUnderline, setIsUnderline,
  showSuggestions, suggestions }) {
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <h1 className="db-page-title">Gamified <span>Learning Hub</span></h1>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.5rem'}}>
        <div style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
          <div>
            <p className="db-section-title"><i className="fa-solid fa-book-open" style={{color:'var(--primary)'}}></i> Learn by Reading</p>
            {['Indian Flag & Nationalism'].map((title,i)=>(
              <div key={i} className="db-card db-card-p" style={{borderLeft:'4px solid var(--primary)'}}>
                <span className="db-badge db-badge-primary" style={{marginBottom:'0.75rem',display:'inline-block'}}>BEGINNER CONTENT</span>
                <p style={{fontWeight:700,color:'var(--text-dark)',marginBottom:'1rem'}}>{title}</p>
                <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>handleOpenModule(title)}>
                  {completedModules.includes(title)?'✅ Continue Reading':'Start Reading'}
                </button>
              </div>
            ))}
          </div>
          <div>
            <p className="db-section-title"><i className="fa-solid fa-pen-nib" style={{color:'var(--primary)'}}></i> Quick Practice</p>
            <div className="db-card" style={{overflow:'hidden'}}>
              <div style={{padding:'0.875rem',borderBottom:'1px solid var(--border)',display:'flex',gap:'0.5rem',background:'#F9FAFB',flexWrap:'wrap'}}>
                <div style={{display:'flex',gap:'2px',background:'#F3F4F6',border:'1px solid var(--border)',borderRadius:8,padding:4}}>
                  {['left','center','right','justify'].map(a=>(
                    <button key={a} onClick={()=>setTextAlignment(a)} className={'db-toolbar-btn'+(textAlignment===a?' active':'')} title={'Align '+a}>
                      <i className={'fa-solid fa-align-'+a}></i>
                    </button>
                  ))}
                </div>
                <div style={{display:'flex',gap:'2px',background:'#F3F4F6',border:'1px solid var(--border)',borderRadius:8,padding:4}}>
                  <button className={'db-toolbar-btn'+(isBold?' active':'')} onClick={()=>setIsBold(!isBold)}><strong>B</strong></button>
                  <button className={'db-toolbar-btn'+(isItalic?' active':'')} onClick={()=>setIsItalic(!isItalic)}><em>I</em></button>
                  <button className={'db-toolbar-btn'+(isUnderline?' active':'')} onClick={()=>setIsUnderline(!isUnderline)}><u>U</u></button>
                </div>
              </div>
              <textarea
                className="db-textarea"
                style={{borderRadius:0,border:'none',minHeight:140,padding:'1rem',textAlign:textAlignment,fontWeight:isBold?700:400,fontStyle:isItalic?'italic':'normal',textDecoration:isUnderline?'underline':'none'}}
                value={practiceText}
                onChange={handlePracticeTextChange}
                onKeyDown={handlePracticeKeyDown}
                placeholder="Type here... suggestions appear after each space!"
                spellCheck="false"
              />
              <div style={{display:'flex',gap:'1rem',padding:'0.5rem 1rem',fontSize:'0.75rem',color:'var(--text-muted)',borderTop:'1px solid var(--border)',background:'#F9FAFB'}}>
                <span>📄 <strong style={{color:'var(--text-dark)'}}>{practiceText.split(/\s+/).filter(w=>w).length}</strong> Words</span>
                <span>🔤 <strong style={{color:'var(--text-dark)'}}>{practiceText.length}</strong> Chars</span>
              </div>
              {showSuggestions && suggestions.length>0 && (
                <div style={{padding:'0.75rem 1rem',background:'#EEF2FF',borderTop:'1px solid #C7D2FE'}}>
                  <p style={{fontSize:'0.8rem',fontWeight:700,color:'var(--primary)',marginBottom:'0.35rem'}}>💡 Suggestions:</p>
                  {suggestions.slice(0,2).map((s,i)=>(
                    <p key={i} style={{fontSize:'0.8rem',color:'var(--text-muted)'}}><code style={{color:'#DC2626'}}>{s.text}</code> → <code style={{color:'#059669'}}>{s.suggestion}</code></p>
                  ))}
                </div>
              )}
              <div style={{padding:'0.75rem'}}>
                <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setCurrentTab('practice')}>Open Full Practice Panel →</button>
              </div>
            </div>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
          <p className="db-section-title">Quiz Panel</p>
          <div className="db-card db-card-p">
            <div style={{background:'#FFFFFF',border:'1.5px solid #D1D5DB',borderRadius:12,padding:'1rem',marginBottom:'0.75rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:'0.25rem'}}>
                <p style={{fontSize:'0.875rem',fontWeight:700,color:'var(--text-dark)'}}>Grammar Sprint</p>
                <span className="db-badge db-badge-warning">HARD</span>
              </div>
              <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>Earn 300 Credits</p>
              <button className="db-btn-primary" style={{width:'100%',justifyContent:'center',fontSize:'0.8rem'}} onClick={handleStartQuiz}>Start Quiz</button>
            </div>
          </div>
          <div className="db-card db-card-p" style={{background:'#EEF2FF',border:'1.5px solid #C7D2FE'}}>
            <p style={{fontSize:'0.75rem',fontWeight:700,color:'var(--primary)',marginBottom:'0.5rem'}}>📚 ADVANCED PATH</p>
            <p style={{fontSize:'0.875rem',fontWeight:600,color:'var(--text-dark)',marginBottom:'1rem'}}>Master 30 Comprehensive Lessons</p>
            <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setShowLearningPath(true)}>📚 View All 30 Levels</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AllLevelsViewComp({ setShowLearningPath, addPoints }) {
  const [completedLevels, setCompletedLevels] = React.useState([1,2,3,4,5,6,7,8,9,10,11,12,13]);
  const [currentLevel, setCurrentLevel] = React.useState(14);
  const levels = [
    {id:1,title:'Basic Spelling Rules',difficulty:'Beginner',credits:20,topic:'Spelling'},
    {id:2,title:'Common Misspellings',difficulty:'Beginner',credits:20,topic:'Spelling'},
    {id:3,title:'Capitalization Rules',difficulty:'Beginner',credits:25,topic:'Grammar'},
    {id:4,title:'Basic Punctuation',difficulty:'Beginner',credits:25,topic:'Punctuation'},
    {id:5,title:'Subject-Verb Agreement',difficulty:'Beginner',credits:30,topic:'Grammar'},
    {id:6,title:'Singular vs Plural',difficulty:'Beginner',credits:25,topic:'Grammar'},
    {id:7,title:'Articles (a, an, the)',difficulty:'Beginner',credits:20,topic:'Grammar'},
    {id:8,title:'Basic Tenses',difficulty:'Beginner',credits:35,topic:'Grammar'},
    {id:9,title:'Common Homophones',difficulty:'Beginner',credits:30,topic:'Homophones'},
    {id:10,title:'🏆 Beginner Assessment',difficulty:'Beginner',credits:50,topic:'Assessment'},
    {id:11,title:'Advanced Punctuation',difficulty:'Intermediate',credits:40,topic:'Punctuation'},
    {id:12,title:'Complex Sentences',difficulty:'Intermediate',credits:35,topic:'Grammar'},
    {id:13,title:'Active vs Passive Voice',difficulty:'Intermediate',credits:40,topic:'Grammar'},
    {id:14,title:'Commonly Confused Words',difficulty:'Intermediate',credits:45,topic:'Vocabulary'},
    {id:15,title:'Paragraph Structure',difficulty:'Intermediate',credits:50,topic:'Writing'},
    {id:16,title:'Transition Words',difficulty:'Intermediate',credits:35,topic:'Writing'},
    {id:17,title:'Advanced Tenses',difficulty:'Intermediate',credits:45,topic:'Grammar'},
    {id:18,title:'Prepositions',difficulty:'Intermediate',credits:40,topic:'Grammar'},
    {id:19,title:'Formal vs Informal Writing',difficulty:'Intermediate',credits:50,topic:'Writing'},
    {id:20,title:'🏆 Intermediate Assessment',difficulty:'Intermediate',credits:75,topic:'Assessment'},
    {id:21,title:'Style & Tone',difficulty:'Advanced',credits:60,topic:'Writing'},
    {id:22,title:'Conciseness',difficulty:'Advanced',credits:55,topic:'Writing'},
    {id:23,title:'Advanced Punctuation (Em dash)',difficulty:'Advanced',credits:50,topic:'Punctuation'},
    {id:24,title:'Parallel Structure',difficulty:'Advanced',credits:60,topic:'Grammar'},
    {id:25,title:'Conditional Sentences',difficulty:'Advanced',credits:55,topic:'Grammar'},
    {id:26,title:'Academic Writing',difficulty:'Advanced',credits:70,topic:'Writing'},
    {id:27,title:'Business Writing',difficulty:'Advanced',credits:70,topic:'Writing'},
    {id:28,title:'Creative Writing Techniques',difficulty:'Advanced',credits:65,topic:'Writing'},
    {id:29,title:'Editing & Proofreading',difficulty:'Advanced',credits:65,topic:'Writing'},
    {id:30,title:'🏆 Final Master Assessment',difficulty:'Advanced',credits:100,topic:'Assessment'},
  ];
  const getStatus = id => completedLevels.includes(id)?'completed':id<=currentLevel?'available':'locked';
  const diffColor = {Beginner:'#ECFDF5',Intermediate:'#FFFBEB',Advanced:'#FEF2F2'};
  const diffText = {Beginner:'#059669',Intermediate:'#D97706',Advanced:'#DC2626'};
  const handleStart = id => {
    if(getStatus(id)==='locked'){alert('Complete previous lessons first!');return;}
    const l=levels.find(x=>x.id===id);
    addPoints(l.credits);
    alert('Starting Lesson '+id+': '+l.title);
  };
  const handleComplete = id => {
    if(!completedLevels.includes(id)){
      setCompletedLevels(p=>[...p,id]);
      const l=levels.find(x=>x.id===id);
      alert('🎉 Lesson completed! +'+l.credits+' credits!');
      if(id===currentLevel) setCurrentLevel(id+1);
    }
  };
  const renderCards = list => (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'1rem'}}>
      {list.map(level=>{
        const st=getStatus(level.id);
        return (
          <div key={level.id} className="db-level-card" style={{opacity:st==='locked'?0.55:1}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.5rem'}}>
              <span>{st==='completed'?'✅':st==='available'?'▶️':'🔒'}</span>
              <span style={{fontSize:'0.7rem',fontWeight:700,padding:'2px 8px',borderRadius:999,background:diffColor[level.difficulty],color:diffText[level.difficulty]}}>L{level.id}</span>
            </div>
            <h3 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'0.875rem',marginBottom:'0.25rem'}}>{level.title}</h3>
            <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>📚 {level.topic} • ⭐ +{level.credits} Cr</p>
            <div className="db-progress-track" style={{height:6,marginBottom:'0.75rem'}}>
              <div className={'db-progress-fill'+(st==='completed'?' db-progress-fill-success':st==='locked'?' db-progress-fill-muted':'')} style={{width:st==='completed'?'100%':st==='available'?'50%':'0%',height:'100%'}}></div>
            </div>
            <div style={{display:'flex',gap:'0.5rem'}}>
              {st==='locked'?<button disabled className="db-btn-secondary" style={{flex:1,opacity:0.5,cursor:'not-allowed'}}>🔒 Locked</button>
              :st==='completed'?<button onClick={()=>handleStart(level.id)} className="db-btn-secondary" style={{flex:1}}>✅ Review</button>
              :<><button onClick={()=>handleStart(level.id)} className="db-btn-primary" style={{flex:1}}>Start</button><button onClick={()=>handleComplete(level.id)} className="db-btn-secondary" style={{flex:1,background:'#ECFDF5',color:'#059669',border:'1px solid #A7F3D0'}}>Complete</button></>}
            </div>
          </div>
        );
      })}
    </div>
  );
  return (
    <div className="db-animate" style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
        <div>
          <h1 className="db-page-title">30-Level <span>Learning Path</span></h1>
          <p className="db-page-sub">Master writing skills with comprehensive lessons organized by difficulty.</p>
        </div>
        <button className="db-btn-secondary" onClick={()=>setShowLearningPath(false)}>← Back</button>
      </div>
      <div className="db-card db-card-p">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'0.75rem'}}>
          <div><h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1rem'}}>Your Progress</h2><p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>Level {currentLevel}</p></div>
          <div style={{textAlign:'right'}}><p style={{fontSize:'1.75rem',fontWeight:700,color:'var(--primary)',lineHeight:1}}>{completedLevels.length}/30</p><p style={{fontSize:'0.75rem',color:'var(--text-muted)'}}>Completed</p></div>
        </div>
        <div className="db-progress-track" style={{height:10}}>
          <div className="db-progress-fill" style={{width:(completedLevels.length/30*100)+'%',height:'100%'}}></div>
        </div>
        <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>{Math.round(completedLevels.length/30*100)}% Complete</p>
      </div>
      {[{emoji:'🟢',label:'Beginner Level (1-10)',sub:'Master the fundamentals',diff:'Beginner'},
        {emoji:'🟡',label:'Intermediate Level (11-20)',sub:'Advance with complex techniques',diff:'Intermediate'},
        {emoji:'🔴',label:'Advanced Level (21-30)',sub:'Perfect your craft',diff:'Advanced'}].map(sec=>(
        <div key={sec.diff}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',marginBottom:'1rem'}}>
            <span style={{fontSize:'1.5rem'}}>{sec.emoji}</span>
            <div><h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1.1rem'}}>{sec.label}</h2><p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{sec.sub}</p></div>
          </div>
          {renderCards(levels.filter(l=>l.difficulty===sec.diff))}
        </div>
      ))}
    </div>
  );
}

function ChatViewComp({messages,chatInput,setChatInput,sendMessage,handleFileUpload,showHistory,setShowHistory,chatBoxRef}) {
  return (
    <div className="db-chat-root" style={{height:'100%',minHeight:500}}>
      <div className="db-chat-main">
        <div className="db-chat-topbar">
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <div style={{width:36,height:36,background:'var(--primary)',borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',color:'white'}}><i className="fa-solid fa-robot"></i></div>
            <span style={{fontWeight:600,color:'var(--text-dark)'}}>AI Assistant</span>
          </div>
          <button className="db-btn-secondary" style={{fontSize:'0.8rem'}} onClick={()=>setShowHistory(!showHistory)}>Show History</button>
        </div>
        <div ref={chatBoxRef} className="db-chat-messages">
          {messages.map((msg,i)=>(
            <div key={i} style={{display:'flex',justifyContent:msg.type==='user'?'flex-end':'flex-start'}}>
              {msg.type==='file'
                ?<div className="db-chat-bubble-file"><i className="fa-solid fa-file-arrow-up"></i> {msg.text}</div>
                :<div className={msg.type==='user'?'db-chat-bubble-user':'db-chat-bubble-ai'}>{msg.text}</div>}
            </div>
          ))}
        </div>
        <div className="db-chat-input-bar">
          <input type="file" id="fileUpload" style={{display:'none'}} onChange={handleFileUpload}/>
          <button className="db-chat-attach-btn" onClick={()=>document.getElementById('fileUpload').click()} title="Upload File"><i className="fa-solid fa-paperclip"></i></button>
          <input type="text" className="db-chat-input" placeholder="Type here..." value={chatInput} onChange={(e)=>setChatInput(e.target.value)} onKeyPress={(e)=>e.key==='Enter'&&sendMessage()}/>
          <button className="db-chat-send-btn" onClick={sendMessage}><i className="fa-solid fa-paper-plane"></i></button>
        </div>
      </div>
      <div className={'db-history-panel'+(showHistory?'':' db-history-hidden')}>
        <div style={{padding:'1rem',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg-white)'}}>
          <span style={{fontSize:'0.75rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.08em'}}>History</span>
          <button className="db-icon-btn" onClick={()=>setShowHistory(false)}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div style={{padding:'0.75rem',display:'flex',flexDirection:'column',gap:'0.5rem'}}>
          <div className="db-history-item"><p style={{fontSize:'0.75rem',fontWeight:700,color:'var(--primary)',marginBottom:'0.2rem'}}>March 26</p><p style={{fontSize:'0.875rem',color:'var(--text-dark)',fontWeight:500}}>Proposal Tone Draft</p></div>
        </div>
      </div>
    </div>
  );
}

function PracticeViewComp({practiceText,handlePracticeTextChange,handlePracticeKeyDown,textAlignment,setTextAlignment,isBold,setIsBold,isItalic,setIsItalic,isUnderline,setIsUnderline,practiceMode,setPracticeMode,isAnalyzing,setIsAnalyzing,suggestions,setSuggestions,showSuggestions,handleAnalyzeText,errors,practiceEditorRef}) {
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end'}}>
        <div><h1 className="db-page-title">Practice <span>Panel</span></h1><p className="db-page-sub">Enhance your writing with real-time AI assistance.</p></div>
        <div style={{textAlign:'right'}}>
          <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.35rem'}}>⭐ Daily Goal: 350 / 500 Words</p>
          <div className="db-progress-track" style={{width:200,height:7}}><div className="db-progress-fill" style={{width:'70%',height:'100%'}}></div></div>
        </div>
      </div>
      <div className="db-card" style={{overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div className="db-practice-toolbar">
          <div className="db-toolbar-group">
            {['left','center','right','justify'].map(a=>(
              <button key={a} className={'db-toolbar-btn'+(textAlignment===a?' active':'')} onClick={()=>setTextAlignment(a)} title={'Align '+a}>
                <i className={'fa-solid fa-align-'+a}></i>
              </button>
            ))}
          </div>
          <div style={{width:1,height:24,background:'var(--border)',margin:'0 4px'}}></div>
          <div className="db-toolbar-group">
            <button className={'db-toolbar-btn'+(isBold?' active':'')} onClick={()=>setIsBold(!isBold)} title="Bold"><strong>B</strong></button>
            <button className={'db-toolbar-btn'+(isItalic?' active':'')} onClick={()=>setIsItalic(!isItalic)} title="Italic"><em>I</em></button>
            <button className={'db-toolbar-btn'+(isUnderline?' active':'')} onClick={()=>setIsUnderline(!isUnderline)} title="Underline"><u>U</u></button>
          </div>
          <div className="db-mode-group">
            <button className={'db-mode-btn'+(practiceMode==='realtime'?' active':'')} onClick={()=>setPracticeMode('realtime')}><i className="fa-solid fa-bolt" style={{color:practiceMode==='realtime'?'white':'#F59E0B'}}></i> Real-time</button>
            <button className={'db-mode-btn'+(practiceMode==='analysis'?' active':'')} onClick={()=>setPracticeMode('analysis')}><i className="fa-solid fa-magnifying-glass"></i> Analysis</button>
          </div>
        </div>
        <textarea
          ref={practiceEditorRef}
          className="db-textarea"
          style={{borderRadius:0,border:'none',borderBottom:'1px solid var(--border)',minHeight:300,padding:'1.25rem',textAlign:textAlignment,fontWeight:isBold?700:400,fontStyle:isItalic?'italic':'normal',textDecoration:isUnderline?'underline':'none',fontSize:'1rem',lineHeight:1.7,background:'var(--bg-white)'}}
          value={practiceText}
          onChange={handlePracticeTextChange}
          onKeyDown={handlePracticeKeyDown}
          placeholder="Start typing here... Suggestions appear after each space!"
          spellCheck="false"
          autoCorrect="off"
          autoCapitalize="off"
        />
        <div className="db-stats-bar">
          <div className="db-stat-chip">📄 <strong>{practiceText.split(/\s+/).filter(w=>w).length}</strong> Words</div>
          <div className="db-stat-chip">�� <strong>{practiceText.length}</strong> Chars</div>
          <div className="db-stat-chip">⏱️ <strong>{Math.max(1,Math.ceil(practiceText.split(/\s+/).filter(w=>w).length/200))}</strong> min</div>
          <div className="db-stat-chip" style={{marginLeft:'auto',borderColor:'rgba(239, 68, 68, 0.3)',background:'rgba(239, 68, 68, 0.15)'}}>
            <i className="fa-solid fa-circle-exclamation" style={{color:'#EF4444'}}></i>
            <strong style={{color:'#EF4444'}}>{errors.length}</strong>
            <span style={{color:'#DC2626'}}>Issues</span>
          </div>
        </div>
        {isAnalyzing && suggestions.length>0 && (
          <div style={{margin:'0 1rem',marginBottom:'0.75rem',padding:'0.875rem',borderRadius:12,border:'1px solid rgba(167, 139, 250, 0.3)',background:'rgba(167, 139, 250, 0.1)'}}>
            <p style={{fontWeight:700,color:'var(--primary)',marginBottom:'0.5rem',fontSize:'0.875rem'}}>⚠️ Analysis — {suggestions.length} Issues Found</p>
            <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',maxHeight:160,overflowY:'auto'}}>
              {suggestions.map((s,i)=>(
                <div key={i} style={{padding:'0.5rem 0.75rem',background:'#E5E7EB',border:'1px solid var(--border)',borderRadius:8,fontSize:'0.825rem'}}>
                  <strong style={{color:'var(--primary)'}}>{s.type.toUpperCase()}</strong>{' — '}
                  <code style={{background:'#FEE2E2',color:'#DC2626',padding:'0 4px',borderRadius:4}}>{s.text}</code>{' → '}
                  <code style={{background:'#D1FAE5',color:'#059669',padding:'0 4px',borderRadius:4}}>{s.suggestion}</code>
                  <p style={{color:'var(--text-muted)',marginTop:'0.2rem',fontStyle:'italic',fontSize:'0.8rem'}}>💡 {s.hint}</p>
                </div>
              ))}
            </div>
          </div>
        )}
        {showSuggestions && suggestions.length>0 && !isAnalyzing && (
          <div style={{margin:'0 1rem',marginBottom:'0.75rem',padding:'0.875rem',borderRadius:12,border:'1px solid rgba(59, 130, 246, 0.3)',background:'rgba(59, 130, 246, 0.1)'}}>
            <p style={{fontWeight:700,color:'#1D4ED8',marginBottom:'0.35rem',fontSize:'0.875rem'}}>💡 Real-time Suggestions</p>
            {suggestions.slice(0,2).map((s,i)=>(
              <p key={i} style={{fontSize:'0.825rem',color:'var(--text-muted)'}}>
                <code style={{color:'#DC2626'}}>{s.text}</code>{' → '}<code style={{color:'#059669'}}>{s.suggestion}</code>
              </p>
            ))}
          </div>
        )}
        <div style={{padding:'0.75rem 1rem',borderTop:'1px solid var(--border)'}}>
          <button
            onClick={()=>{if(!isAnalyzing){handleAnalyzeText();setIsAnalyzing(true);}else{setIsAnalyzing(false);setSuggestions([]);}}}
            className={isAnalyzing?'db-btn-danger':'db-btn-primary'}
            style={{width:'100%',justifyContent:'center'}}
          >
            <i className={'fa-solid fa-'+(isAnalyzing?'stop':'magnifying-glass')}></i>
            {isAnalyzing?'Stop Analysis':'Analyze Writing'}
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectsViewComp({currentProjects,selectedProject,setSelectedProject,isEditingProject,setIsEditingProject,projectContent,setProjectContent,projectTitle,setProjectTitle,handleNewProject,handleSaveProject,handleDeleteProject}) {
  if(isEditingProject && selectedProject) {
    return (
      <div className="db-animate" style={{display:'flex',flexDirection:'column',gap:'1rem',height:'100%'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem',flex:1}}>
            <button className="db-btn-secondary" onClick={()=>{setIsEditingProject(false);setSelectedProject(null);}}>← Back</button>
            <input type="text" className="db-input" style={{fontSize:'1.1rem',fontWeight:700,flex:1}} value={projectTitle} onChange={(e)=>setProjectTitle(e.target.value)} placeholder="Project Title"/>
          </div>
          <button className="db-btn-primary" onClick={handleSaveProject}>💾 Save Project</button>
        </div>
        <textarea className="db-textarea" style={{flex:1,minHeight:360,fontFamily:'monospace',fontSize:'0.95rem',lineHeight:1.7}} value={projectContent} onChange={(e)=>setProjectContent(e.target.value)} placeholder="Start writing your story, document, or notes here..." spellCheck="false"/>
        <div className="db-card db-card-p" style={{borderRadius:12,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',gap:'1.5rem',fontSize:'0.875rem',fontWeight:600,color:'var(--text-muted)'}}>
            <span>📝 {projectContent.split(/\s+/).filter(w=>w).length} words</span>
            <span>🔤 {projectContent.length} chars</span>
            <span>⏱️ {Math.max(1,Math.ceil(projectContent.split(/\s+/).filter(w=>w).length/200))} min</span>
          </div>
          <button className="db-btn-danger" style={{fontSize:'0.8rem',padding:'0.5rem'}} onClick={()=>{if(window.confirm('Delete this project?')){handleDeleteProject(selectedProject);setProjectContent('');setProjectTitle('');}}}>🗑️ Delete</button>
        </div>
      </div>
    );
  }
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div><h1 className="db-page-title">Project <span>Workspace</span></h1><p className="db-page-sub">Create and manage your stories, documents, and content.</p></div>
        <button className="db-btn-primary" onClick={handleNewProject}><i className="fa-solid fa-plus"></i> New Project</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
        {currentProjects.length===0?(
          <div style={{gridColumn:'1/-1',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem',border:'2px dashed var(--border)',borderRadius:16,color:'var(--text-muted)',gap:'0.5rem'}}>
            <span style={{fontSize:'2rem'}}>📝</span>
            <p style={{fontWeight:600,color:'var(--text-dark)'}}>No projects yet</p>
            <p style={{fontSize:'0.875rem'}}>Create a new project to get started</p>
          </div>
        ):currentProjects.map(p=>(
          <div key={p.id} className="db-card" style={{padding:'1.25rem',cursor:'pointer'}} onClick={()=>{setSelectedProject(p.id);setProjectTitle(p.title);setProjectContent(p.content);setIsEditingProject(true);}}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:'0.75rem'}}>
              <div style={{width:44,height:44,background:'rgba(167, 139, 250, 0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.2rem'}}>📖</div>
              <span className="db-badge db-badge-muted">{p.type}</span>
            </div>
            <h3 style={{fontWeight:700,color:'var(--text-dark)',marginBottom:'0.35rem',fontSize:'0.95rem'}}>{p.title}</h3>
            <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginBottom:'0.75rem'}}>{p.content||'No content yet'}</p>
            <div style={{fontSize:'0.75rem',color:'var(--text-muted)',display:'flex',justifyContent:'space-between'}}>
              <span>📊 {p.words} words</span><span>{p.lastEdited}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsViewComp({analyticsPeriod,setAnalyticsPeriod,showResults,setShowResults}) {
  return (
    <div className="db-animate" style={{maxWidth:900,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div><h1 className="db-page-title">Performance <span>Analytics</span></h1><p className="db-page-sub">Track your writing improvement, grammar accuracy, and vocabulary growth.</p></div>
        <div style={{display:'flex',gap:'0.5rem',alignItems:'center'}}>
          <select className="db-input" style={{width:'auto',padding:'0.5rem 0.875rem',cursor:'pointer'}} value={analyticsPeriod} onChange={(e)=>setAnalyticsPeriod(e.target.value)}>
            <option value="weekly">Weekly</option><option value="monthly">Monthly</option>
          </select>
          <button className="db-btn-primary" onClick={()=>setShowResults(!showResults)}>📊 Results</button>
        </div>
      </div>
      {showResults && (
        <div className="db-card db-card-p" style={{border:'1px solid #A7F3D0',background:'#F0FDF4'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1rem'}}>
            <h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1.1rem'}}>Achievement Summary</h2>
            <button onClick={()=>setShowResults(false)} style={{background:'none',border:'none',fontSize:'1.2rem',cursor:'pointer',color:'var(--text-muted)'}}>✕</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:'1rem'}}>
            {[{label:'Quizzes Completed',value:'12',sub:'3,600 Credits'},{label:'Levels Completed',value:'8',sub:'2,400 Credits'},{label:'Session Credits',value:'750',sub:'+750 Cr'}].map((m,i)=>(
              <div key={i} className="db-card" style={{padding:'1rem'}}>
                <p style={{fontSize:'0.8rem',fontWeight:600,color:'var(--text-muted)',marginBottom:'0.2rem'}}>{m.label}</p>
                <p style={{fontSize:'1.75rem',fontWeight:700,color:'var(--primary)',margin:0}}>{m.value}</p>
                <p style={{fontSize:'0.75rem',color:'var(--text-muted)',marginTop:'0.2rem'}}>{m.sub}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'1rem'}}>
        {[{label:'Grammar Accuracy',value:'96.8%',icon:'fa-bullseye',color:'#10B981'},{label:'Vocabulary Score',value:'8.4/10',icon:'fa-book-font',color:'var(--primary)'},{label:'Words Written',value:'12,450',icon:'fa-keyboard',color:'#3B82F6'},{label:'Active Streak',value:'14 Days',icon:'fa-fire',color:'#F59E0B'}].map((m,i)=>(
          <div key={i} className="db-metric-card">
            <div style={{width:36,height:36,borderRadius:8,background:'#EEF2FF',display:'flex',alignItems:'center',justifyContent:'center',color:m.color,marginBottom:'0.75rem',border:'1px solid #C7D2FE'}}>
              <i className={'fa-solid '+m.icon}></i>
            </div>
            <p className="db-metric-label">{m.label}</p>
            <p className="db-metric-value" style={{color:m.color}}>{m.value}</p>
          </div>
        ))}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:'1.5rem'}}>
        <div className="db-card db-card-p">
          <p className="db-section-title"><i className="fa-solid fa-chart-area" style={{color:'var(--primary)'}}></i> {analyticsPeriod==='weekly'?'Weekly':'Monthly'} Trends</p>
          <div style={{height:120,display:'flex',alignItems:'flex-end',justifyContent:'space-around',borderBottom:'1px solid var(--border)',gap:4,marginBottom:'0.5rem'}}>
            {[40,55,50,70,65,85,95].map((h,i)=>(
              <div key={i} style={{flex:1,display:'flex',alignItems:'flex-end',height:'100%'}}>
                <div style={{width:'100%',background:'var(--primary)',borderRadius:'4px 4px 0 0',height:h+'%',opacity:0.8}}></div>
              </div>
            ))}
          </div>
          <div style={{display:'flex',justifyContent:'space-around',fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.06em'}}>
            {(analyticsPeriod==='weekly'?['Mon','Tue','Wed','Thu','Fri','Sat','Sun']:['Wk1','Wk2','Wk3','Wk4']).map(d=><span key={d}>{d}</span>)}
          </div>
        </div>
        <div className="db-card db-card-p">
          <p className="db-section-title"><i className="fa-solid fa-list-check" style={{color:'var(--primary)'}}></i> Skill Breakdown</p>
          <div style={{display:'flex',flexDirection:'column',gap:'1rem'}}>
            {[{label:'Clarity & Brevity',score:92},{label:'Professional Tone',score:85},{label:'Vocabulary Variety',score:78}].map((s,i)=>(
              <div key={i}>
                <div style={{display:'flex',justifyContent:'space-between',fontSize:'0.8rem',fontWeight:600,marginBottom:'0.35rem'}}>
                  <span style={{color:'var(--text-dark)'}}>{s.label}</span><span style={{color:'var(--primary)'}}>{s.score}%</span>
                </div>
                <div className="db-progress-track" style={{height:6}}><div className="db-progress-fill" style={{width:s.score+'%',height:'100%'}}></div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsViewComp({isDarkMode,setIsDarkMode,setShowEditNameModal,setShowEditPasswordModal}) {
  return (
    <div className="db-animate" style={{maxWidth:600,margin:'0 auto',display:'flex',flexDirection:'column',gap:'1.5rem'}}>
      <div><h1 className="db-page-title">Settings <span>&amp; Preferences</span></h1><p className="db-page-sub">Manage your account and appearance.</p></div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
        {[
          {icon:'fa-palette',label:'Theme',sub:'Switch between dark and light mode',action:<button className="db-btn-secondary" onClick={()=>setIsDarkMode(!isDarkMode)}>{isDarkMode?'🌙 Dark':'☀️ Light'}</button>},
          {icon:'fa-user-pen',label:'Change Name',sub:'Update your display name',action:<button className="db-btn-primary" onClick={()=>setShowEditNameModal(true)}>Edit</button>},
          {icon:'fa-lock',label:'Change Password',sub:'Secure your account',action:<button className="db-btn-primary" onClick={()=>setShowEditPasswordModal(true)}>Edit</button>},
          {icon:'fa-language',label:'Language',sub:'Choose preferred language',action:<select className="db-input" style={{width:'auto',padding:'0.5rem 0.875rem',cursor:'pointer'}}><option value="en">English</option><option value="hi">हिंदी</option><option value="es">Español</option><option value="fr">Français</option></select>}
        ].map((item,i)=>(
          <div key={i} className="db-card db-card-p" style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:'1rem'}}>
            <div style={{display:'flex',alignItems:'center',gap:'0.875rem'}}>
              <div style={{width:44,height:44,background:'rgba(167, 139, 250, 0.15)',borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',color:'var(--primary)',flexShrink:0}}>
                <i className={'fa-solid '+item.icon}></i>
              </div>
              <div>
                <p style={{fontWeight:600,color:'var(--text-dark)',fontSize:'0.95rem',marginBottom:'0.1rem'}}>{item.label}</p>
                <p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{item.sub}</p>
              </div>
            </div>
            {item.action}
          </div>
        ))}
      </div>
      <div className="db-card" style={{padding:'1rem 1.25rem',borderColor:'rgba(167, 139, 250, 0.3)',background:'rgba(167, 139, 250, 0.1)'}}>
        <p style={{fontSize:'0.875rem',color:'var(--primary)',fontWeight:500,display:'flex',alignItems:'center',gap:'0.5rem'}}>
          <i className="fa-solid fa-info-circle"></i> All changes are automatically saved to your account.
        </p>
      </div>
    </div>
  );
}

// ─── Main Dashboard Component ─────────────────────────────────────────────────

function Dashboard({ onLogout }) {
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [credits, setCredits] = useState(1250);
  const [showLearningPath, setShowLearningPath] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showCuratedModule, setShowCuratedModule] = useState(null);
  const [completedModules, setCompletedModules] = useState([]);
  const [readSections, setReadSections] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [quizScore, setQuizScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [showQuizResult, setShowQuizResult] = useState(false);
  const [messages, setMessages] = useState([{type:'ai',text:'How can I help you refine your writing today?'}]);
  const [chatInput, setChatInput] = useState('');
  const [showHistory, setShowHistory] = useState(false);
  const [practiceText, setPracticeText] = useState('The AI will actively highlight grammar errors and stylistic improvements as you type.\n\nFor example, it easily catches teh common typos. It can even suggest more better phrasing to elevate your professional tone.');
  const [practiceMode, setPracticeMode] = useState('realtime');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [textAlignment, setTextAlignment] = useState('left');
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [errors, setErrors] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState('weekly');
  const [showResults, setShowResults] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showEditNameModal, setShowEditNameModal] = useState(false);
  const [showEditPasswordModal, setShowEditPasswordModal] = useState(false);
  const [userName, setUserName] = useState('John Doe');
  const [userPhone] = useState('+1 (555) 123-4567');
  const [editNameValue, setEditNameValue] = useState('John Doe');
  const [editPasswordValue, setEditPasswordValue] = useState('');
  const [currentProjects, setCurrentProjects] = useState([
    {id:1,title:'My First Story',type:'Story',content:'Once upon a time...',words:234,lastEdited:'Today'},
    {id:2,title:'Project Report 2024',type:'Report',content:'Executive Summary...',words:1250,lastEdited:'Yesterday'}
  ]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [projectContent, setProjectContent] = useState('');
  const [projectTitle, setProjectTitle] = useState('');
  const chatBoxRef = useRef(null);
  const practiceEditorRef = useRef(null);

  // Apply theme based on isDarkMode state
  React.useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('light-mode');
      document.body.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
      document.body.classList.remove('light-mode');
    }
  }, [isDarkMode]);

  const addPoints = (amount) => setCredits(prev=>prev+amount);

  const detectErrors = (text) => {
    const issues = [];
    if(text.includes('teh ')) issues.push({type:'typo',text:'teh',suggestion:'the',hint:'Did you mean "the"?'});
    if(text.includes('recieve')) issues.push({type:'typo',text:'recieve',suggestion:'receive',hint:'Check spelling: "receive"'});
    if(text.includes('occured')) issues.push({type:'typo',text:'occured',suggestion:'occurred',hint:'Double check: "occurred"'});
    if(text.includes('more better')) issues.push({type:'grammar',text:'more better',suggestion:'better',hint:'"better" is already comparative'});
    if(text.includes('very unique')) issues.push({type:'grammar',text:'very unique',suggestion:'unique',hint:'"unique" means one of a kind'});
    if(text.includes('future plans')) issues.push({type:'redundancy',text:'future plans',suggestion:'plans',hint:'Plans are inherently about the future'});
    return issues;
  };

  const handlePracticeTextChange = (e) => setPracticeText(e.target.value);

  const handlePracticeKeyDown = (e) => {
    if(e.key===' ' && practiceMode==='realtime') {
      const currentText = e.currentTarget.value+' ';
      setTimeout(()=>{
        const detected = detectErrors(currentText);
        if(detected.length>0){setSuggestions(detected);setShowSuggestions(true);}
        else setShowSuggestions(false);
      },0);
    }
  };

  const handleAnalyzeText = () => {
    const allErrors = [];
    practiceText.split(/[.!?]+/).filter(s=>s.trim()).forEach(s=>allErrors.push(...detectErrors(s)));
    setSuggestions(allErrors);
    setShowSuggestions(true);
  };

  const handleSaveName = () => {
    if(editNameValue.trim()){setUserName(editNameValue);setShowEditNameModal(false);alert('✅ Name updated!');}
  };

  const handleSavePassword = () => {
    if(editPasswordValue.trim().length>=6){alert('✅ Password changed!');setEditPasswordValue('');setShowEditPasswordModal(false);}
    else alert('❌ Password must be at least 6 characters!');
  };

  const handleNewProject = () => {
    const p={id:Date.now(),title:'Untitled Project',type:'Document',content:'',words:0,lastEdited:'Now'};
    setCurrentProjects(prev=>[...prev,p]);
    setSelectedProject(p.id);setProjectTitle(p.title);setProjectContent(p.content);setIsEditingProject(true);
  };

  const handleSaveProject = () => {
    setCurrentProjects(prev=>prev.map(p=>p.id===selectedProject?{...p,title:projectTitle,content:projectContent,words:projectContent.split(/\s+/).length,lastEdited:'Now'}:p));
    setIsEditingProject(false);alert('✅ Project saved!');
  };

  const handleDeleteProject = (id) => {
    if(window.confirm('Delete this project?')){
      setCurrentProjects(prev=>prev.filter(p=>p.id!==id));
      if(selectedProject===id){setSelectedProject(null);setIsEditingProject(false);}
      alert('✅ Project deleted!');
    }
  };

  const showNotificationAlert = () => {setShowNotification(true);setTimeout(()=>setShowNotification(false),3000);};

  const quizQuestions = [
    {id:1,question:'Which sentence is grammatically correct?',options:['She have completed her homework.','She has completed her homework.','She having completed her homework.','She complete her homework.'],correctAnswer:1,points:50},
    {id:2,question:'What is the correct spelling?',options:['Recieve','Receive','Recive','Reciever'],correctAnswer:1,points:50},
    {id:3,question:'Which word is spelled correctly?',options:['Occured','Occured','Occurred','Ocured'],correctAnswer:2,points:50},
    {id:4,question:'Choose the sentence with correct punctuation:',options:['The cat, the dog and the bird are friends.','The cat the dog, and the bird are friends.','The cat, the dog, and the bird are friends.','The cat, the dog and, the bird are friends.'],correctAnswer:2,points:50},
    {id:5,question:"Which is correct use of their/there/they're?",options:["There going to their house over their.","They're going to there house over their.","They're going to their house over there.","There going to there house over they're."],correctAnswer:2,points:50}
  ];

  const handleStartQuiz = () => {setShowQuiz(true);setCurrentQuestionIndex(0);setQuizScore(0);setSelectedAnswer(null);setShowQuizResult(false);};
  const handleAnswerSelect = (i) => setSelectedAnswer(i);
  const handleSubmitAnswer = () => {
    const q=quizQuestions[currentQuestionIndex];
    const ok=selectedAnswer===q.correctAnswer;
    if(ok){setQuizScore(prev=>prev+q.points);setCredits(prev=>prev+q.points);alert('✅ Correct! +'+q.points+' Credits!');}
    else alert('❌ Incorrect. Answer: '+q.options[q.correctAnswer]);
    if(currentQuestionIndex<quizQuestions.length-1){setCurrentQuestionIndex(prev=>prev+1);setSelectedAnswer(null);}
    else setShowQuizResult(true);
  };
  const handleQuizRestart = () => {setShowQuiz(false);setCurrentQuestionIndex(0);setQuizScore(0);setSelectedAnswer(null);setShowQuizResult(false);};

  const curatedModules = {
    'Indian Flag & Nationalism': {
      title:'Indian Flag & Nationalism',description:'Beginner content about our Indian Flag, national symbols, and patriotic values.',icon:'🇮🇳',
      content:[
        {title:'1. 🇮🇳 History of the Indian Flag',text:'The Indian tricolor flag consists of saffron, white, and green bands. Saffron symbolizes courage. White represents peace and truth. Green denotes fertility and growth. The Ashoka Chakra has 24 spokes. Adopted on July 22, 1947.'},
        {title:'2. ⭐ National Symbols & Their Meaning',text:'The 24 spokes represent the 24 hours of a day. Saffron represents courage and sacrifice. White symbolizes peace and communal harmony. Green represents agricultural wealth. These symbols unite 1.4 billion citizens.'},
        {title:'3. 📜 Indian Constitution & Nationalism',text:'Adopted on January 26, 1950. Article 51-A defines Fundamental Duties including fostering national spirit. The Preamble ensures justice, liberty, and equality. Indian nationalism is civic, not ethnic.'},
        {title:'4. 🕊️ Patriotic Values & Citizenship',text:'True patriotism means serving the nation through education and ethical conduct. A patriotic citizen respects the national anthem, flag, and symbols. Every citizen shares responsibility for India\'s progress.'},
        {title:'5. 🌏 Unity in Diversity',text:'India\'s greatest strength is unity in diversity. With 2,000+ ethnic groups and 22 official languages, India demonstrates inclusion. "Vasudhaiva Kutumbakam" — The world is one family.'}
      ]
    }
  };

  const handleOpenModule = (name) => setShowCuratedModule(name);
  const handleCompleteModule = () => {
    if(!completedModules.includes(showCuratedModule)){
      setCompletedModules(prev=>[...prev,showCuratedModule]);
      alert('✅ Reading Complete!');
    }
    setShowCuratedModule(null);
  };

  const sendMessage = () => {
    if(!chatInput.trim()) return;
    setMessages(prev=>[...prev,{type:'user',text:chatInput}]);
    setChatInput('');
    setTimeout(()=>{if(chatBoxRef.current)chatBoxRef.current.scrollTop=chatBoxRef.current.scrollHeight;},100);
  };

  const handleFileUpload = (e) => {
    const file=e.target.files?.[0];
    if(file){setMessages(prev=>[...prev,{type:'file',text:file.name}]);e.target.value='';}
  };

  const navItems = [
    {id:'dashboard',label:'Dashboard',icon:'fa-house-chimney'},
    {id:'learning',label:'Learning Hub',icon:'fa-graduation-cap',section:'Workspace'},
    {id:'chat',label:'Chat AI',icon:'fa-comment-dots'},
    {id:'practice',label:'Practice Panel',icon:'fa-pen-nib'},
    {id:'projects',label:'Projects',icon:'fa-layer-group'},
    {id:'analytics',label:'Analytics',icon:'fa-chart-line'},
    {id:'settings',label:'Settings',icon:'fa-sliders'}
  ];

  const renderView = () => {
    if(currentTab==='learning' && showLearningPath) return <AllLevelsViewComp setShowLearningPath={setShowLearningPath} addPoints={addPoints}/>;
    switch(currentTab) {
      case 'dashboard': return <DashboardViewComp setCurrentTab={setCurrentTab}/>;
      case 'learning': return <LearningViewComp setCurrentTab={setCurrentTab} completedModules={completedModules} handleOpenModule={handleOpenModule} handleStartQuiz={handleStartQuiz} setShowLearningPath={setShowLearningPath} practiceText={practiceText} handlePracticeTextChange={handlePracticeTextChange} handlePracticeKeyDown={handlePracticeKeyDown} textAlignment={textAlignment} setTextAlignment={setTextAlignment} isBold={isBold} setIsBold={setIsBold} isItalic={isItalic} setIsItalic={setIsItalic} isUnderline={isUnderline} setIsUnderline={setIsUnderline} showSuggestions={showSuggestions} suggestions={suggestions}/>;
      case 'chat': return <ChatViewComp messages={messages} chatInput={chatInput} setChatInput={setChatInput} sendMessage={sendMessage} handleFileUpload={handleFileUpload} showHistory={showHistory} setShowHistory={setShowHistory} chatBoxRef={chatBoxRef}/>;
      case 'practice': return <PracticeViewComp practiceText={practiceText} handlePracticeTextChange={handlePracticeTextChange} handlePracticeKeyDown={handlePracticeKeyDown} textAlignment={textAlignment} setTextAlignment={setTextAlignment} isBold={isBold} setIsBold={setIsBold} isItalic={isItalic} setIsItalic={setIsItalic} isUnderline={isUnderline} setIsUnderline={setIsUnderline} practiceMode={practiceMode} setPracticeMode={setPracticeMode} isAnalyzing={isAnalyzing} setIsAnalyzing={setIsAnalyzing} suggestions={suggestions} setSuggestions={setSuggestions} showSuggestions={showSuggestions} handleAnalyzeText={handleAnalyzeText} errors={errors} practiceEditorRef={practiceEditorRef}/>;
      case 'projects': return <ProjectsViewComp currentProjects={currentProjects} selectedProject={selectedProject} setSelectedProject={setSelectedProject} isEditingProject={isEditingProject} setIsEditingProject={setIsEditingProject} projectContent={projectContent} setProjectContent={setProjectContent} projectTitle={projectTitle} setProjectTitle={setProjectTitle} handleNewProject={handleNewProject} handleSaveProject={handleSaveProject} handleDeleteProject={handleDeleteProject}/>;
      case 'analytics': return <AnalyticsViewComp analyticsPeriod={analyticsPeriod} setAnalyticsPeriod={setAnalyticsPeriod} showResults={showResults} setShowResults={setShowResults}/>;
      case 'settings': return <SettingsViewComp isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} setShowEditNameModal={setShowEditNameModal} setShowEditPasswordModal={setShowEditPasswordModal}/>;
      default: return <DashboardViewComp setCurrentTab={setCurrentTab}/>;
    }
  };

  return (
    <div className="db-root">
      {/* Sidebar */}
      <aside className="db-sidebar">
        <div className="db-sidebar-logo">
          <div className="db-logo-icon">W</div>
          <span className="db-logo-text">Write<span>Wisely</span></span>
        </div>
        <nav className="db-nav">
          {navItems.map(item=>(
            <React.Fragment key={item.id}>
              {item.section && <div className="db-nav-section-label">{item.section}</div>}
              <div className={'db-nav-item'+(currentTab===item.id?' active':'')} onClick={()=>setCurrentTab(item.id)}>
                <i className={'fa-solid '+item.icon} style={{width:18}}></i> {item.label}
              </div>
            </React.Fragment>
          ))}
        </nav>
        <div className="db-sidebar-footer">
          <button className="db-signout-btn" onClick={()=>onLogout()}>
            <i className="fa-solid fa-power-off" style={{width:18}}></i> Sign Out
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="db-main">
        {/* Top Bar */}
        <header className="db-topbar">
          <div className="db-topbar-title">Welcome to <span>WriteWisely</span></div>
          <div className="db-topbar-actions">
            <div className="db-credits-badge">
              <i className="fa-solid fa-coins"></i> {credits.toLocaleString()} Credits
            </div>
            <button className="db-icon-btn" onClick={showNotificationAlert} style={{position:'relative'}}>
              <i className="fa-regular fa-bell"></i>
              <span className="db-notif-dot"></span>
            </button>
            <div style={{position:'relative'}}>
              <button className="db-avatar-btn" onClick={()=>setShowProfileModal(!showProfileModal)}>
                <img src={'https://ui-avatars.com/api/?name='+userName+'&background=6C5CE7&color=fff'} className="db-avatar-img" alt="avatar"/>
                <span className="db-avatar-name">{userName.split(' ')[0]}</span>
              </button>
              {showProfileModal && (
                <div className="db-profile-dropdown">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',paddingBottom:'1rem',borderBottom:'1px solid var(--border)',marginBottom:'1rem'}}>
                    <div><p style={{fontSize:'0.75rem',color:'var(--text-muted)',fontWeight:600}}>Profile</p><p style={{fontWeight:700,color:'var(--text-dark)'}}>{userName}</p></div>
                    <button className="db-icon-btn" onClick={()=>setShowProfileModal(false)}><i className="fa-solid fa-xmark"></i></button>
                  </div>
                  <div style={{background:'#F9FAFB',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}>
                    <p style={{fontSize:'0.875rem',color:'var(--text-dark)'}}>📱 {userPhone}</p>
                  </div>
                  <div style={{background:'#F9FAFB',borderRadius:8,padding:'0.75rem',marginBottom:'0.75rem'}}>
                    <p style={{fontSize:'0.7rem',fontWeight:700,color:'var(--text-muted)',textTransform:'uppercase',marginBottom:'0.25rem'}}>Credits</p>
                    <p style={{fontSize:'1.5rem',fontWeight:700,color:'var(--primary)'}}>💰 {credits}</p>
                  </div>
                  <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={()=>setCurrentTab('settings')}>⚙️ Settings</button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Notification Toast */}
        {showNotification && (
          <div className="db-toast">
            <i className="fa-solid fa-bell"></i>
            <div><p style={{fontWeight:700,fontSize:'0.875rem'}}>New Notification</p><p style={{fontSize:'0.8rem',opacity:0.9}}>You have 2 new messages and 1 achievement unlocked!</p></div>
          </div>
        )}

        {/* Content */}
        <div className="db-content">{renderView()}</div>
      </main>

      {/* Quiz Modal */}
      {showQuiz && (
        <div className="db-modal-overlay">
          <div className="db-modal">
            {!showQuizResult ? (
              <>
                <div className="db-modal-header">
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'0.75rem'}}>
                    <p style={{fontSize:'0.875rem',fontWeight:600,opacity:0.9}}>Question {currentQuestionIndex+1}/{quizQuestions.length}</p>
                    <span style={{fontSize:'1.5rem'}}>📝</span>
                  </div>
                  <h2 style={{fontSize:'1.25rem',fontWeight:700}}>{quizQuestions[currentQuestionIndex].question}</h2>
                  <div style={{width:'100%',background:'rgba(255,255,255,0.3)',borderRadius:999,height:6,marginTop:'1rem'}}>
                    <div style={{background:'var(--primary)',height:'100%',borderRadius:999,width:((currentQuestionIndex+1)/quizQuestions.length*100)+'%'}}></div>
                  </div>
                </div>
                <div className="db-modal-body" style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
                  {quizQuestions[currentQuestionIndex].options.map((opt,idx)=>(
                    <button key={idx} onClick={()=>handleAnswerSelect(idx)} style={{width:'100%',padding:'0.875rem 1rem',borderRadius:12,border:'2px solid',borderColor:selectedAnswer===idx?'var(--primary)':'var(--border)',background:selectedAnswer===idx?'var(--primary)':'white',color:selectedAnswer===idx?'white':'var(--text-dark)',fontWeight:600,cursor:'pointer',textAlign:'left',fontFamily:'inherit',fontSize:'0.9rem',transition:'all 0.15s'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
                        <div style={{width:22,height:22,borderRadius:'50%',border:'2px solid',borderColor:selectedAnswer===idx?'white':'#9CA3AF',background:selectedAnswer===idx?'white':'transparent',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                          {selectedAnswer===idx && <span style={{color:'var(--primary)',fontSize:'0.8rem',fontWeight:900}}>✓</span>}
                        </div>
                        {opt}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="db-modal-actions">
                  <button className="db-btn-secondary" style={{flex:1}} onClick={handleQuizRestart}>Exit Quiz</button>
                  <button className="db-btn-primary" style={{flex:1,justifyContent:'center',opacity:selectedAnswer===null?0.5:1,cursor:selectedAnswer===null?'not-allowed':'pointer'}} disabled={selectedAnswer===null} onClick={handleSubmitAnswer}>Submit Answer</button>
                </div>
              </>
            ):(
              <div style={{padding:'3rem 2rem',textAlign:'center',display:'flex',flexDirection:'column',gap:'1.5rem',alignItems:'center'}}>
                <span style={{fontSize:'4rem'}}>🎉</span>
                <div>
                  <h2 style={{fontSize:'1.75rem',fontWeight:700,color:'var(--text-dark)',marginBottom:'0.5rem'}}>Quiz Completed!</h2>
                  <p style={{color:'var(--text-muted)',marginBottom:'0.5rem'}}>Final Score</p>
                  <p style={{fontSize:'3rem',fontWeight:700,color:'var(--primary)',lineHeight:1}}>{quizScore}</p>
                  <p style={{fontSize:'0.875rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>+{quizScore} Credits Added</p>
                </div>
                <div style={{background:'#ECFDF5',border:'1px solid #A7F3D0',borderRadius:12,padding:'1rem',width:'100%'}}>
                  <p style={{color:'#059669',fontWeight:600}}>✅ Great job! Keep learning to improve.</p>
                </div>
                <button className="db-btn-primary" style={{width:'100%',justifyContent:'center'}} onClick={handleQuizRestart}>Back to Learning Hub</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Curated Module Modal */}
      {showCuratedModule && curatedModules[showCuratedModule] && (
        <div className="db-modal-overlay">
          <div className="db-modal" style={{maxWidth:640}}>
            <div className="db-modal-header" style={{position:'sticky',top:0,zIndex:10}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
                <div>
                  <span style={{fontSize:'2.5rem',display:'block',marginBottom:'0.5rem'}}>{curatedModules[showCuratedModule].icon}</span>
                  <h2 style={{fontSize:'1.25rem',fontWeight:700}}>{curatedModules[showCuratedModule].title}</h2>
                  <p style={{fontSize:'0.875rem',opacity:0.9,marginTop:'0.25rem'}}>{curatedModules[showCuratedModule].description}</p>
                </div>
                <button style={{background:'none',border:'none',color:'white',fontSize:'1.5rem',cursor:'pointer',lineHeight:1}} onClick={()=>setShowCuratedModule(null)}>×</button>
              </div>
            </div>
            <div className="db-modal-body" style={{display:'flex',flexDirection:'column',gap:'1.5rem'}}>
              {curatedModules[showCuratedModule].content.map((sec,idx)=>{
                const key=showCuratedModule+'-'+idx;
                return (
                  <div key={idx} style={{borderLeft:'4px solid var(--primary)',paddingLeft:'1rem'}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'0.75rem'}}>
                      <input type="checkbox" checked={readSections[key]||false} onChange={(e)=>setReadSections(prev=>({...prev,[key]:e.target.checked}))} style={{width:18,height:18,marginTop:2,accentColor:'var(--primary)',cursor:'pointer',flexShrink:0}}/>
                      <div><h3 style={{fontWeight:700,color:'var(--text-dark)',marginBottom:'0.35rem'}}>{sec.title}</h3><p style={{color:'var(--text-muted)',lineHeight:1.7,fontSize:'0.9rem'}}>{sec.text}</p></div>
                    </div>
                  </div>
                );
              })}
              {(() => {
                const allRead = curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx]);
                return (
                  <div style={{padding:'1rem',borderRadius:12,background:allRead?'#EDE9FE':'#F9FAFB',border:'1px solid',borderColor:allRead?'#DDD6FE':'var(--border)'}}>
                    <p style={{fontWeight:700,color:allRead?'var(--primary)':'var(--text-dark)',marginBottom:'0.2rem'}}>{allRead?'✅ All Sections Read!':'📖 Mark sections as read to complete'}</p>
                    <p style={{fontSize:'0.8rem',color:'var(--text-muted)'}}>{Object.values(readSections).filter(v=>v).length}/{curatedModules[showCuratedModule].content.length} sections read</p>
                  </div>
                );
              })()}
            </div>
            <div className="db-modal-actions">
              <button className="db-btn-secondary" style={{flex:1}} onClick={()=>setShowCuratedModule(null)}>Continue Later</button>
              <button className="db-btn-primary" style={{flex:1,justifyContent:'center',opacity:curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx])?1:0.5}} disabled={!curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx])} onClick={()=>{if(curatedModules[showCuratedModule].content.every((_,idx)=>readSections[showCuratedModule+'-'+idx]))handleCompleteModule();}}>
                {completedModules.includes(showCuratedModule)?'✅ Already Completed':'✅ Mark as Completed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Name Modal */}
      {showEditNameModal && (
        <div className="db-modal-overlay">
          <div className="db-modal" style={{maxWidth:440}}>
            <div className="db-modal-body" style={{paddingTop:'2rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1.25rem'}}>Change Name</h2>
                <button className="db-icon-btn" onClick={()=>setShowEditNameModal(false)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <label style={{display:'block',fontSize:'0.875rem',fontWeight:600,color:'var(--text-dark)',marginBottom:'0.5rem'}}>Full Name</label>
              <input type="text" className="db-input" value={editNameValue} onChange={(e)=>setEditNameValue(e.target.value)} placeholder="Enter your full name"/>
            </div>
            <div className="db-modal-actions">
              <button className="db-btn-secondary" style={{flex:1}} onClick={()=>setShowEditNameModal(false)}>Cancel</button>
              <button className="db-btn-primary" style={{flex:1,justifyContent:'center'}} onClick={handleSaveName}>Save Changes</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      {showEditPasswordModal && (
        <div className="db-modal-overlay">
          <div className="db-modal" style={{maxWidth:440}}>
            <div className="db-modal-body" style={{paddingTop:'2rem'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'1.5rem'}}>
                <h2 style={{fontWeight:700,color:'var(--text-dark)',fontSize:'1.25rem'}}>Change Password</h2>
                <button className="db-icon-btn" onClick={()=>setShowEditPasswordModal(false)}><i className="fa-solid fa-xmark"></i></button>
              </div>
              <label style={{display:'block',fontSize:'0.875rem',fontWeight:600,color:'var(--text-dark)',marginBottom:'0.5rem'}}>New Password</label>
              <input type="password" className="db-input" value={editPasswordValue} onChange={(e)=>setEditPasswordValue(e.target.value)} placeholder="Enter new password (min 6 characters)"/>
              <p style={{fontSize:'0.8rem',color:'var(--text-muted)',marginTop:'0.5rem'}}>Must be at least 6 characters long</p>
            </div>
            <div className="db-modal-actions">
              <button className="db-btn-secondary" style={{flex:1}} onClick={()=>setShowEditPasswordModal(false)}>Cancel</button>
              <button className="db-btn-primary" style={{flex:1,justifyContent:'center'}} onClick={handleSavePassword}>Save Password</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
